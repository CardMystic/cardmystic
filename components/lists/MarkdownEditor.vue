<template>
  <div class="flex flex-col grow min-h-0 gap-3 pb-0">
    <!-- Mode toggle / action bar -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="editable && mode === 'edit'"
          icon="i-lucide-eye"
          color="primary"
          variant="solid"
          label="View Preview"
          class="cursor-pointer"
          @click="
            () => {
              mode = 'preview';
            }
          "
        />
        <UButton
          v-if="editable && mode === 'edit'"
          icon="i-lucide-columns-2"
          color="primary"
          variant="solid"
          label="Split Preview"
          class="cursor-pointer hidden lg:inline-flex"
          @click="
            () => {
              mode = 'split';
            }
          "
        />
        <UButton
          v-if="editable && (mode === 'preview' || mode === 'split')"
          icon="i-lucide-pencil"
          color="primary"
          variant="outline"
          label="Back to Edit"
          class="cursor-pointer"
          @click="
            () => {
              mode = 'edit';
            }
          "
        />
      </div>
      <div
        v-if="editable && (mode !== 'preview' || saveInPreview)"
        class="flex items-center gap-2"
      >
        <span
          v-if="isDirty"
          class="text-xs text-gray-500 dark:text-gray-400 italic"
          >Unsaved changes</span
        >
        <span
          v-else-if="lastSavedAt"
          class="text-xs text-gray-500 dark:text-gray-400 italic"
          >Saved</span
        >
        <UButton
          icon="i-lucide-save"
          color="success"
          variant="solid"
          :label="isDirty ? saveLabel : 'Saved'"
          class="cursor-pointer"
          :disabled="!isDirty || isSaving || saveDisabled"
          :loading="isSaving"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Keep one CodeMirror instance mounted across mode changes so undo,
         selection and scroll position survive switching views. -->
    <div
      v-if="editable"
      v-show="mode !== 'preview'"
      class="flex h-[80vh] min-h-0 gap-4 overflow-hidden"
    >
      <div class="flex-1 min-w-0 min-h-0 flex flex-col gap-2">
        <!-- Toolbar -->
        <div
          class="shrink-0 flex flex-wrap items-center gap-1 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <template v-for="(group, gi) in toolbarGroups" :key="gi">
            <div
              v-if="gi > 0"
              class="w-px h-5 self-center shrink-0 bg-gray-300 dark:bg-gray-600 mx-0.5"
            />
            <UTooltip
              v-for="action in group"
              :key="action.id"
              :text="action.tooltip"
            >
              <UButton
                :icon="action.icon"
                :aria-label="action.tooltip"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="applyAction(action.id)"
              />
            </UTooltip>
          </template>
          <div
            class="w-px h-5 self-center shrink-0 bg-gray-300 dark:bg-gray-600 mx-0.5"
          />
          <UPopover
            v-model:open="emojiPickerOpen"
            :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
          >
            <UTooltip text="Insert emoji">
              <UButton
                icon="i-lucide-smile"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                aria-label="Insert emoji"
              />
            </UTooltip>
            <template #content>
              <EmojiPickerPanel
                v-model:search="emojiSearchTerm"
                :emojis="emojiResults"
                @select="insertEmojiShortcode"
              />
            </template>
          </UPopover>
          <UPopover
            v-model:open="magicSymbolPickerOpen"
            :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
          >
            <UTooltip text="Insert Magic symbol">
              <UButton
                icon="i-mdi-cards-playing-outline"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                aria-label="Insert Magic symbol"
              />
            </UTooltip>
            <template #content>
              <MagicSymbolPickerPanel
                v-model:search="magicSymbolSearchTerm"
                :symbols="magicSymbols"
                @select="insertMagicSymbol"
              />
            </template>
          </UPopover>
        </div>

        <LazyMarkdownSourceEditor
          ref="sourceEditorRef"
          v-model="draft"
          :placeholder="placeholder"
          :active="mode !== 'preview'"
          @scroll="onEditorScroll"
          @card-hover="onEditorCardHover"
          @card-leave="tokenPreview = null"
        />
      </div>
      <!-- Right: live preview -->
      <div
        v-if="mode === 'split'"
        ref="previewRef"
        class="primer-preview flex-1 min-w-0 min-h-0 px-1 overflow-y-auto"
        @click="handlePreviewClick"
        @pointermove="onPreviewPointerMove"
        @pointerleave="onPreviewPointerLeave"
      >
        <div v-if="renderedHtml" v-html="renderedHtml"></div>
        <p
          v-else
          class="text-gray-500 dark:text-gray-400 italic text-center py-8"
        >
          Start typing to see a preview.
        </p>
      </div>
    </div>

    <!-- Preview-only mode -->
    <div
      v-if="!editable || mode === 'preview'"
      class="primer-preview grow min-h-0 overflow-y-auto px-1"
      @click="handlePreviewClick"
      @pointermove="onPreviewPointerMove"
      @pointerleave="onPreviewPointerLeave"
    >
      <div v-if="renderedHtml" v-html="renderedHtml"></div>
      <p
        v-else
        class="text-gray-500 dark:text-gray-400 italic text-center py-8"
      >
        {{ emptyMessage }}
      </p>
    </div>

    <!-- Floating card preview shown while hovering (desktop) or after tapping
         (mobile) a ((...)) / [[...]] token. Non-interactive: dismisses on
         outside pointerdown or mouse leaving the source token. -->
    <Teleport to="body">
      <div
        v-if="tokenPreview"
        class="editor-card-preview"
        :style="{
          left: `${tokenPreview.x}px`,
          top: `${tokenPreview.y}px`,
        }"
      >
        <img :src="tokenPreview.imageUrl" alt="" />
      </div>
    </Teleport>

    <!-- Unsaved changes confirmation modal -->
    <UModal v-model:open="showUnsavedModal" title="Unsaved Changes">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            You have unsaved changes. Are you sure you want to leave?
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Stay"
              @click="stayOnPage"
            />
            <UButton
              color="error"
              variant="solid"
              label="Leave without saving"
              @click="leaveWithoutSaving"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked';
import { refDebounced } from '~/utils/refDebounced';
import type {
  MarkdownSourceEditorHandle,
  EditorCardHover,
} from '~/utils/markdownEditorSyntax';
import { sanitizeMarkdownHtml } from '~/utils/sanitizeMarkdown';
import { emojify, search as searchEmoji } from 'node-emoji';
import 'mana-font/css/mana.min.css';
import { useCardsByName } from '~/composables/useCards';
import { useCommandersSet } from '~/composables/useBulkData';
import { useLinkEmbeds, type LinkEmbedData } from '~/composables/useLinkEmbeds';
import { getCardImageUrl } from '~/utils/scryfall';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import {
  extractMagicSymbols,
  magicSymbols,
  restoreMagicSymbols,
} from '~/utils/magicSymbols';
import { extractAndTokenizeLinkEmbeds } from '~/utils/linkEmbeds';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    editable: boolean;
    isSaving?: boolean;
    /** Include surrounding form fields in the save button and leave guard. */
    hasUnsavedChanges?: boolean;
    saveDisabled?: boolean;
    saveLabel?: string;
    saveInPreview?: boolean;
    /** Message shown in preview mode when there is no content yet. */
    emptyMessage?: string;
    /** Placeholder text for the Markdown source editor. */
    placeholder?: string;
    hasBackground?: boolean;
    /**
     * Async save callback. The editor only marks the draft clean and updates
     * `lastSavedAt` after this resolves — any thrown/rejected error leaves the
     * draft dirty so the user can retry and the unsaved-changes guard fires.
     */
    saveHandler?: (value: string) => void | Promise<void>;
  }>(),
  {
    emptyMessage: 'No primer has been written yet.',
    placeholder:
      'Describe how this deck wins, key combos, mulligan guide, sideboard plans, etc. Markdown supported.',
    hasBackground: true,
    saveHandler: undefined,
    saveLabel: 'Save',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'mode-change', mode: 'edit' | 'split' | 'preview'): void;
}>();

const router = useRouter();

// True when the user held a modifier that should still allow the browser's
// default link behavior (open in new tab, save link as, etc.).
function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

const mode = ref<'edit' | 'split' | 'preview'>(
  props.editable ? 'edit' : 'preview',
);
watch(mode, (value) => emit('mode-change', value), { immediate: true });
// Ownership can become available after the public server render hydrates.
watch(
  () => props.editable,
  (editable) => {
    mode.value = editable ? 'edit' : 'preview';
  },
);
const draft = ref(props.modelValue);
const lastSavedAt = ref<number | null>(null);
const sourceEditorRef = ref<MarkdownSourceEditorHandle | null>(null);
const previewRef = ref<HTMLDivElement | null>(null);

// --- Unsaved changes guard ---
const showUnsavedModal = ref(false);
type NavGuardNext = Parameters<Parameters<typeof onBeforeRouteLeave>[0]>[2];
const pendingNavigation = ref<NavGuardNext | null>(null);

onBeforeRouteLeave((to, from, next) => {
  if (!isDirty.value) {
    next();
    return;
  }
  pendingNavigation.value = next;
  showUnsavedModal.value = true;
});

function stayOnPage() {
  pendingNavigation.value?.(false);
  pendingNavigation.value = null;
  showUnsavedModal.value = false;
}

function leaveWithoutSaving() {
  showUnsavedModal.value = false;
  pendingNavigation.value?.();
  pendingNavigation.value = null;
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}

function handleDocumentPointerDown(e: PointerEvent) {
  const el = e.target as HTMLElement | null;
  // Keep the preview open while tapping its link again. Any other interaction
  // ends the pending double tap, including a tap on a different card.
  const cardLink = el?.closest('.card-inline-link');
  if (cardLink !== lastCardTap?.element) lastCardTap = null;
  if (cardLink) return;
  tokenPreview.value = null;
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
});

// --- Scroll sync: editor → preview ---
function onEditorScroll(position: { top: number; max: number }) {
  const preview = previewRef.value;
  if (!preview || mode.value !== 'split' || position.max <= 0) return;
  preview.scrollTop =
    (position.top / position.max) *
    (preview.scrollHeight - preview.clientHeight);
}

// --- Card token hover preview ---
const tokenPreview = ref<{
  imageUrl: string;
  x: number;
  y: number;
} | null>(null);

const PREVIEW_WIDTH = 220;
const PREVIEW_HEIGHT = 307; // 220 * 1.395 (MTG card aspect)
const CARD_DOUBLE_TAP_MS = 450;
let lastCardTap: { element: HTMLElement; time: number } | null = null;

function onEditorCardHover(card: EditorCardHover) {
  const entry = cardImageMap.value.get(card.name.toLowerCase());
  if (!entry) {
    tokenPreview.value = null;
    return;
  }
  const preferredTop = card.top - PREVIEW_HEIGHT - 8;
  const maxX = window.innerWidth - PREVIEW_WIDTH - 8;
  tokenPreview.value = {
    imageUrl: entry.imageUrl,
    x: Math.min(Math.max(card.left, 8), Math.max(maxX, 8)),
    y: preferredTop < 8 ? card.bottom + 8 : preferredTop,
  };
}

// --- Card token hover preview (rendered preview pane) ---
// The preview pane is `overflow-y-auto`, which clips CSS-only tooltip
// approaches. Reuse the teleported floating preview by hit-testing the
// rendered `.card-inline-link` elements on pointer movement.
function onPreviewPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'touch') showCardLinkPreview(event);
}

function showCardLinkPreview(e: MouseEvent) {
  const target = (e.target as HTMLElement | null)?.closest(
    '.card-inline-link',
  ) as HTMLElement | null;
  if (!target) {
    tokenPreview.value = null;
    lastCardTap = null;
    return;
  }
  const name = (target.textContent ?? '').trim();
  const entry = cardImageMap.value.get(name.toLowerCase());
  if (!entry) {
    tokenPreview.value = null;
    return;
  }
  const rect = target.getBoundingClientRect();
  const preferredTop = rect.top - PREVIEW_HEIGHT - 8;
  const y = preferredTop < 8 ? rect.bottom + 8 : preferredTop;
  const maxX = window.innerWidth - PREVIEW_WIDTH - 8;
  const x = Math.min(Math.max(rect.left, 8), Math.max(maxX, 8));
  tokenPreview.value = {
    imageUrl: entry.imageUrl,
    x,
    y,
  };
}

function onPreviewPointerLeave(event: PointerEvent) {
  // Touch ends with pointerleave, followed by synthetic mouse events. Neither
  // should dismiss the preview or cancel the pending second tap.
  if (event.pointerType === 'touch') return;
  tokenPreview.value = null;
  lastCardTap = null;
}

// Keep typing and saves on the live draft. Preview rendering and card/link
// lookups wait for a short pause while the user edits.
const debouncedDraft = refDebounced(draft, 200);
watch(mode, (value) => {
  // Opening split view explicitly should show the latest text immediately.
  if (value === 'split') debouncedDraft.value = draft.value;
});
const previewSource = computed(() => {
  if (!props.editable) return props.modelValue ?? '';
  return mode.value === 'preview' ? draft.value : debouncedDraft.value;
});

// --- Card embeds: ((Card Name)) and [[Card Name]] ---
// Explicit full preview and read-only rendering stay immediate, including SSR.

const referencedCardNames = computed(() => {
  const names = new Set<string>();
  const imgPattern = /\(\(([^)]+)\)\)/g;
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = imgPattern.exec(previewSource.value)) !== null)
    names.add(m[1].trim());
  while ((m = linkPattern.exec(previewSource.value)) !== null)
    names.add(m[1].trim());
  return [...names];
});

const { cards: referencedCards, suspense: resolveReferencedCards } =
  useCardsByName(referencedCardNames);
const { data: commanderNames, suspense: resolveCommanders } =
  useCommandersSet();

onServerPrefetch(async () => {
  if (!referencedCardNames.value.length) return;
  // Resolve the same cached queries the browser uses, so canonical card links
  // are present in the response and hydration does not repeat their requests.
  // A lookup failure must not prevent readers from seeing the article/primer.
  await Promise.allSettled([resolveReferencedCards(), resolveCommanders()]);
});

// Map from card name (lowercase) → image URL for fast lookup during render.
const cardImageMap = computed(() => {
  const map = new Map<
    string,
    {
      imageUrl: string;
      oracleId: string;
      isCommander: boolean;
      price: string | null;
      tcgplayerId?: number;
      backImageUrl: string | null;
    }
  >();
  for (const card of referencedCards.value ?? []) {
    const imageUrl = getCardImageUrl(card.card_data, false, 'normal');
    const flippedImageUrl = getCardImageUrl(card.card_data, true, 'normal');
    const hasDistinctBack =
      (card.card_data.card_faces?.length ?? 0) >= 2 &&
      Boolean(flippedImageUrl) &&
      flippedImageUrl !== imageUrl;
    map.set(card.card_data.name.toLowerCase(), {
      imageUrl,
      oracleId: card.card_data.oracle_id,
      isCommander: commanderNames.value?.has(card.card_data.name) ?? false,
      price: card.card_data.prices?.usd ?? null,
      tcgplayerId: card.card_data.tcgplayer_id,
      backImageUrl: hasDistinctBack ? flippedImageUrl : null,
    });
  }
  return map;
});

// --- Link unfurls: bare CardMystic URLs on their own line ---
// Discord-style unfurl for decklists, articles, users, and search pages.
// We pre-tokenize before markdown to keep marked's autolinker from turning
// the URL into a plain anchor, then swap the token for the resolved unfurl
// HTML (or a skeleton) after sanitize.
const linkEmbedTargets = computed(() => {
  const src = previewSource.value;
  if (!src?.trim()) return [];
  return extractAndTokenizeLinkEmbeds(src).targets;
});
const { embedMap: linkEmbedMap } = useLinkEmbeds(linkEmbedTargets);

const embeddedActionIcons = {
  similar:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.19 2.25c-.26 0-.52.06-.77.15L3.06 5.45a1.994 1.994 0 0 0-1.09 2.6L6.93 20a2 2 0 0 0 1.81 1.25c.26 0 .53-.03.79-.15l7.37-3.05a2.02 2.02 0 0 0 1.23-1.8c.01-.25-.04-.54-.13-.8L13 3.5a1.95 1.95 0 0 0-1.81-1.25m3.48 0l3.45 8.35V4.25a2 2 0 0 0-2-2m4.01 1.54v9.03l2.43-5.86a1.99 1.99 0 0 0-1.09-2.6m-10.28-.14l4.98 12.02l-7.39 3.06L3.8 7.29"/></svg>',
  popular:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0a5 5 0 0 1 1-3a1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>',
  recommend:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7l8.7 5l8.7-5M12 22V12"/></g></svg>',
  buy: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></g></svg>',
  flip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>',
};

function embeddedCardAction(
  href: string,
  label: string,
  buttonLabel: string,
  modifier: string,
  icon: string,
): string {
  return `<a class="card-inline-action ${modifier}" href="${href}" aria-label="${label}" data-tooltip="${label}">${icon}<span>${buttonLabel}</span></a>`;
}

// Escape user-provided strings before injecting into raw HTML. All embed
// content originates from API responses (decklist name, article title, etc.)
// so callers must NOT double-escape values already safe by construction.
function escapeEmbedHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isOracleId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function renderLinkEmbedCard(data: LinkEmbedData): string {
  const href = escapeEmbedHtml(data.href);
  const eyebrow = escapeEmbedHtml(data.eyebrow);
  const title = escapeEmbedHtml(data.title);
  const description = escapeEmbedHtml(data.description);
  const meta = escapeEmbedHtml(data.meta);
  const imageMarkup = data.imageUrl
    ? `<span class="link-embed-image"><img src="${escapeEmbedHtml(data.imageUrl)}" alt="" loading="lazy" /></span>`
    : '';
  return `<a class="link-embed" href="${href}">${
    eyebrow ? `<span class="link-embed-eyebrow">${eyebrow}</span>` : ''
  }<span class="link-embed-title">${title}</span>${
    description
      ? `<span class="link-embed-description">${description}</span>`
      : ''
  }${meta ? `<span class="link-embed-meta">${meta}</span>` : ''}${imageMarkup}</a>`;
}

function renderLinkEmbedSkeleton(href: string): string {
  const safeHref = escapeEmbedHtml(href);
  return `<a class="link-embed link-embed-loading" href="${safeHref}" aria-busy="true"><span class="link-embed-skeleton-line link-embed-skeleton-line--sm"></span><span class="link-embed-skeleton-line link-embed-skeleton-line--lg"></span><span class="link-embed-skeleton-line link-embed-skeleton-line--md"></span><span class="link-embed-image link-embed-image-skeleton"></span></a>`;
}

watch(
  () => props.modelValue,
  (val, oldVal) => {
    if (val === draft.value) return;
    // Only accept the incoming snapshot if the draft still matches the
    // previous one — otherwise the user has typed since (e.g. during an
    // in-flight save) and their newer edits win, keeping the draft dirty.
    if (draft.value === oldVal) draft.value = val;
  },
);

const isDirty = computed(
  () => draft.value !== props.modelValue || props.hasUnsavedChanges,
);

async function handleSave() {
  if (!isDirty.value || props.isSaving || props.saveDisabled) return;
  const value = draft.value;
  try {
    await props.saveHandler?.(value);
  } catch {
    // Parent surfaces the error; keep the draft dirty so the user can retry
    // and the unsaved-changes guard still fires.
    return;
  }
  emit('update:modelValue', value);
  lastSavedAt.value = Date.now();
}

const renderedHtml = computed(() => {
  const src = previewSource.value;
  if (!src?.trim()) return '';

  // --- Pre-process: extract special tokens before markdown sees them ---
  const ytIds: string[] = [];
  // Card image tokens: ((Card Name))
  const cardImgNames: string[] = [];
  // Card link tokens: [[Card Name]]
  const cardLinkNames: string[] = [];

  // Full-line CardMystic URLs unfurl into embed cards. `extractAndTokenizeLinkEmbeds`
  // rewrites those lines to LINKEMBEDTOKEN{n} markers (surrounded by blank
  // lines) so marked treats them as block elements. Ordered target list is
  // reused by the post-process replacer below.
  const linkEmbedResult = extractAndTokenizeLinkEmbeds(src);
  let pre = linkEmbedResult.processed;

  pre = pre.replace(/@\[youtube\]\(([A-Za-z0-9_-]{11})\)/g, (_, id) => {
    const i = ytIds.push(id) - 1;
    return `\n\nYTEMBEDTOKEN${i}YTEMBEDTOKEN\n\n`;
  });

  pre = pre.replace(/\(\(([^)\n]+)\)\)/g, (_, name) => {
    const i = cardImgNames.push(name.trim()) - 1;
    return `CARDIMGTOKEN${i}CARDIMGTOKEN`;
  });

  pre = pre.replace(/\[\[([^\]\n]+)\]\]/g, (_, name) => {
    const i = cardLinkNames.push(name.trim()) - 1;
    return `CARDLINKTOKEN${i}CARDLINKTOKEN`;
  });

  const extractedMagicSymbols = extractMagicSymbols(pre);
  pre = extractedMagicSymbols.text;

  // Convert :shortcode: → unicode emoji after custom tokens are extracted
  // so card names / URLs can never be misinterpreted as emoji names.
  pre = emojify(pre);

  const html = marked.parse(pre, { async: false }) as string;
  const sanitized = sanitizeMarkdownHtml(html);

  // --- Post-process: swap tokens back with final HTML ---
  let result = sanitized.replace(
    /(?:<p>\s*)?YTEMBEDTOKEN(\d+)YTEMBEDTOKEN(?:\s*<\/p>)?/g,
    (_, idx) => {
      const id = ytIds[Number(idx)];
      if (!id) return '';
      return `<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
    },
  );

  result = result.replace(/CARDIMGTOKEN(\d+)CARDIMGTOKEN/g, (_, idx) => {
    const name = cardImgNames[Number(idx)];
    if (!name) return '';
    const entry = cardImageMap.value.get(name.toLowerCase());
    if (!entry || !isOracleId(entry.oracleId))
      return `<em class="card-unknown">${escapeEmbedHtml(name)}</em>`;
    const safeName = escapeEmbedHtml(name);
    const imageUrl = escapeEmbedHtml(entry.imageUrl);
    const backImageUrl = entry.backImageUrl
      ? escapeEmbedHtml(entry.backImageUrl)
      : null;
    const price = entry.price ? escapeEmbedHtml(entry.price) : null;
    const encodedName = encodeURIComponent(name);
    const commanderActions = entry.isCommander
      ? embeddedCardAction(
          `/popular-by-commander/all?commander=${encodedName}`,
          'Popular Cards for this Commander',
          'Popular',
          'card-inline-action-popular',
          embeddedActionIcons.popular,
        ) +
        embeddedCardAction(
          `/search/all/deckbuilder?commander=${encodedName}`,
          'Get Deck Recommendations for this Commander',
          'Recommend',
          'card-inline-action-recommend',
          embeddedActionIcons.recommend,
        )
      : '';
    const similarAction = embeddedCardAction(
      `/search/all/similarity?card_name=${encodedName}&amp;searchType=similarity`,
      'Find Similar Cards',
      'Similar',
      'card-inline-action-similar',
      embeddedActionIcons.similar,
    );
    const buyAction = entry.tcgplayerId
      ? `<a class="card-inline-action card-inline-action-buy" href="${escapeEmbedHtml(getAffiliateLink(entry.tcgplayerId))}" target="_blank" rel="noopener noreferrer" aria-label="Buy on TCGPlayer" data-tooltip="${price ? `Buy on TCGPlayer ($${price})` : 'Buy on TCGPlayer'}">${embeddedActionIcons.buy}<span>Buy${price ? ` $${price}` : ''}</span></a>`
      : '';
    const flipAction = entry.backImageUrl
      ? `<button type="button" class="card-inline-action card-inline-action-flip" aria-label="Flip Card" data-tooltip="Flip card" data-card-flip>${embeddedActionIcons.flip}<span>Flip</span></button>`
      : '';
    return `<span class="card-inline-embed" data-front-image="${imageUrl}"${backImageUrl ? ` data-back-image="${backImageUrl}"` : ''}><a class="card-inline-img-link" href="/card/${entry.oracleId}"><img class="card-inline-img" src="${imageUrl}" alt="${safeName}" data-card-face="front" loading="lazy" /></a><span class="card-inline-actions">${flipAction}${similarAction}${commanderActions}${buyAction}</span></span>`;
  });

  result = result.replace(/CARDLINKTOKEN(\d+)CARDLINKTOKEN/g, (_, idx) => {
    const name = cardLinkNames[Number(idx)];
    if (!name) return '';
    const safeName = escapeEmbedHtml(name);
    const entry = cardImageMap.value.get(name.toLowerCase());
    // Unresolved names stay plain text instead of linking to a missing card.
    if (!entry || !isOracleId(entry.oracleId)) {
      return `<span class="card-unknown">${safeName}</span>`;
    }
    return `<a class="card-inline-link" href="/card/${entry.oracleId}">${safeName}</a>`;
  });

  result = result.replace(
    /(?:<p>\s*)?LINKEMBEDTOKEN(\d+)LINKEMBEDTOKEN(?:\s*<\/p>)?/g,
    (_, idx) => {
      const target = linkEmbedResult.targets[Number(idx)];
      if (!target) return '';
      const data = linkEmbedMap.value.get(target.url);
      return data
        ? renderLinkEmbedCard(data)
        : renderLinkEmbedSkeleton(target.href);
    },
  );

  result = restoreMagicSymbols(result, extractedMagicSymbols.symbols);

  return result;
});

function handlePreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;

  const cardLink = target?.closest<HTMLAnchorElement>('.card-inline-link');
  if (cardLink) {
    // Preserve modifier clicks, middle clicks, and keyboard activation. Touch
    // clicks use two quick taps on the same link; browsers do not consistently
    // emit dblclick for touch, so track the taps directly.
    if (event.button !== 0 || isModifiedClick(event)) return;
    const pointerType = (event as PointerEvent).pointerType;
    const isTouchClick =
      event.detail > 0 &&
      (pointerType === 'touch' ||
        (!pointerType &&
          window.matchMedia('(hover: none) and (pointer: coarse)').matches));
    if (isTouchClick) {
      const isSecondTap =
        lastCardTap?.element === cardLink &&
        event.timeStamp - lastCardTap.time <= CARD_DOUBLE_TAP_MS;
      if (!isSecondTap) {
        event.preventDefault();
        lastCardTap = { element: cardLink, time: event.timeStamp };
        showCardLinkPreview(event);
        return;
      }
    }
    lastCardTap = null;
  }

  // These anchors are injected as raw HTML. Route ordinary activations through
  // Vue while keeping the browser's native new-tab and modifier-link behavior.
  const spaLink = target?.closest<HTMLAnchorElement>(
    '.link-embed, .card-inline-img-link, .card-inline-link',
  );
  if (spaLink && event.button === 0 && !isModifiedClick(event)) {
    const to = spaLink.getAttribute('href');
    if (to && to.startsWith('/') && !to.startsWith('//')) {
      event.preventDefault();
      tokenPreview.value = null;
      router.push(to);
      return;
    }
  }

  const flipButton = target?.closest<HTMLButtonElement>('[data-card-flip]');
  if (!flipButton) return;

  const embed = flipButton.closest<HTMLElement>('.card-inline-embed');
  const image = embed?.querySelector<HTMLImageElement>('.card-inline-img');
  const frontImage = embed?.dataset.frontImage;
  const backImage = embed?.dataset.backImage;
  if (!image || !frontImage || !backImage) return;

  const showBack = image.dataset.cardFace !== 'back';
  image.src = showBack ? backImage : frontImage;
  image.dataset.cardFace = showBack ? 'back' : 'front';
  flipButton.setAttribute(
    'aria-label',
    showBack ? 'Show Front Face' : 'Show Back Face',
  );
}

type ToolbarActionId =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'link'
  | 'hr'
  | 'image'
  | 'table'
  | 'collapsible'
  | 'youtube'
  | 'card-image'
  | 'card-link';

interface ToolbarAction {
  id: ToolbarActionId;
  icon: string;
  tooltip: string;
}

const toolbarGroups: ToolbarAction[][] = [
  [
    { id: 'h1', icon: 'i-lucide-heading-1', tooltip: 'Heading 1' },
    { id: 'h2', icon: 'i-lucide-heading-2', tooltip: 'Heading 2' },
    { id: 'h3', icon: 'i-lucide-heading-3', tooltip: 'Heading 3' },
  ],
  [
    { id: 'bold', icon: 'i-lucide-bold', tooltip: 'Bold' },
    { id: 'italic', icon: 'i-lucide-italic', tooltip: 'Italic' },
  ],
  [
    { id: 'ul', icon: 'i-lucide-list', tooltip: 'Bulleted list' },
    { id: 'ol', icon: 'i-lucide-list-ordered', tooltip: 'Numbered list' },
    { id: 'quote', icon: 'i-lucide-quote', tooltip: 'Quote' },
  ],
  [
    { id: 'link', icon: 'i-lucide-link', tooltip: 'Link' },
    { id: 'image', icon: 'i-lucide-image', tooltip: 'Image' },
    { id: 'hr', icon: 'i-lucide-minus', tooltip: 'Horizontal rule' },
  ],
  [
    { id: 'table', icon: 'i-lucide-table', tooltip: 'Table' },
    {
      id: 'collapsible',
      icon: 'i-lucide-chevrons-down-up',
      tooltip: 'Collapsible section',
    },
    { id: 'youtube', icon: 'i-lucide-youtube', tooltip: 'YouTube embed' },
  ],
  [
    {
      id: 'card-image',
      icon: 'i-lucide-image-plus',
      tooltip: 'Embed card image  ((Card Name))',
    },
    {
      id: 'card-link',
      icon: 'i-lucide-external-link',
      tooltip: 'Card link with hover preview  [[Card Name]]',
    },
  ],
];

function applyAction(id: ToolbarActionId) {
  const editor = sourceEditorRef.value;
  if (!editor) return;
  const { from: start, to: end } = editor.getSelection();
  const value = draft.value;
  const selected = value.slice(start, end);

  let before = '';
  let after = '';
  let placeholder = '';
  let blockMode = false;

  switch (id) {
    case 'h1':
      before = '# ';
      placeholder = 'Heading';
      blockMode = true;
      break;
    case 'h2':
      before = '## ';
      placeholder = 'Heading';
      blockMode = true;
      break;
    case 'h3':
      before = '### ';
      placeholder = 'Heading';
      blockMode = true;
      break;
    case 'bold':
      before = '**';
      after = '**';
      placeholder = 'bold text';
      break;
    case 'italic':
      before = '_';
      after = '_';
      placeholder = 'italic text';
      break;
    case 'ul':
      return applyListPrefix('- ', 'List item');
    case 'ol':
      return applyListPrefix('1. ', 'List item', true);
    case 'quote':
      return applyListPrefix('> ', 'Quote');
    case 'link': {
      before = '[';
      after = `](url)`;
      placeholder = 'link_text';
      break;
    }
    case 'image':
      return insertAtCursor(`![image_name](image_url)\n`);
    case 'table':
      insertAtCursor(
        ensureBlockBoundary(value, start) +
          '| Header 1 | Header 2 | Header 3 |\n' +
          '| --- | --- | --- |\n' +
          '| Cell | Cell | Cell |\n' +
          '| Cell | Cell | Cell |\n\n',
      );
      return;
    case 'collapsible':
      insertAtCursor(
        ensureBlockBoundary(value, start) +
          `<details open>\n<summary>Details</summary>\n\nContent here.\n\n</details>\n\n`,
      );
      return;
    case 'youtube': {
      const input = window.prompt('YouTube URL or Video ID');
      if (!input) return;
      const match = input.match(
        /(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/,
      );
      const videoId = match ? match[1] : input.trim();
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        window.alert('Could not find a valid YouTube video ID.');
        return;
      }
      insertAtCursor(
        ensureBlockBoundary(value, start) + `@[youtube](${videoId})\n\n`,
      );
      return;
    }
    case 'hr':
      insertAtCursor('\n\n---\n\n');
      return;
    case 'card-image': {
      const name = selected || 'Card Name';
      insertAtCursor(`((${name}))`);
      return;
    }
    case 'card-link': {
      const name = selected || 'Card Name';
      insertAtCursor(`[[${name}]]`);
      return;
    }
  }

  const text = selected || placeholder;
  const insertion = blockMode
    ? ensureBlockBoundary(value, start) + before + text + after
    : before + text + after;

  const selStart = start + insertion.length - after.length - text.length;
  editor.replaceSelection(insertion, {
    anchor: selStart,
    head: selStart + text.length,
  });
}

function ensureBlockBoundary(value: string, pos: number) {
  if (pos === 0) return '';
  if (value[pos - 1] === '\n' && (pos < 2 || value[pos - 2] === '\n')) {
    return '';
  }
  return value[pos - 1] === '\n' ? '\n' : '\n\n';
}

function applyListPrefix(
  prefix: string,
  placeholder: string,
  numbered = false,
) {
  const editor = sourceEditorRef.value;
  if (!editor) return;
  const { from: start, to: end } = editor.getSelection();
  const value = draft.value;
  const selected = value.slice(start, end);

  const lines = (selected || placeholder).split('\n');
  const prefixed = lines
    .map((line, i) => {
      const p = numbered ? `${i + 1}. ` : prefix;
      return p + (line || (selected ? '' : placeholder));
    })
    .join('\n');

  const boundary = ensureBlockBoundary(value, start);
  const insertion = boundary + prefixed;

  editor.replaceSelection(insertion, {
    anchor: start + boundary.length,
    head: start + boundary.length + prefixed.length,
  });
}

function insertAtCursor(text: string) {
  sourceEditorRef.value?.replaceSelection(text);
}

// --- Emoji picker ---
// Curated default set shown when the search box is empty. Users can search the
// full node-emoji dataset by typing.
interface EmojiEntry {
  name: string;
  emoji: string;
}

const emojiPickerOpen = ref(false);
const emojiSearchTerm = ref('');
const magicSymbolPickerOpen = ref(false);
const magicSymbolSearchTerm = ref('');

const defaultEmojiNames = [
  'grinning',
  'smiley',
  'smile',
  'laughing',
  'sweat_smile',
  'joy',
  'rofl',
  'wink',
  'blush',
  'heart_eyes',
  'star_struck',
  'kissing_heart',
  'yum',
  'sunglasses',
  'thinking',
  'raised_eyebrow',
  'neutral_face',
  'roll_eyes',
  'grimacing',
  'sob',
  'rage',
  'exploding_head',
  'skull',
  'ghost',
  '+1',
  '-1',
  'clap',
  'raised_hands',
  'pray',
  'muscle',
  'ok_hand',
  'wave',
  'point_right',
  'point_left',
  'eyes',
  'brain',
  'heart',
  'orange_heart',
  'yellow_heart',
  'green_heart',
  'blue_heart',
  'purple_heart',
  'black_heart',
  'broken_heart',
  'sparkling_heart',
  'fire',
  'sparkles',
  '100',
  'boom',
  'zap',
  'star',
  'dizzy',
  'crown',
  'tada',
  'confetti_ball',
  'gift',
  'trophy',
  'medal_sports',
  'game_die',
  'jigsaw',
  'crystal_ball',
  'magic_wand',
  'dragon',
  'crossed_swords',
  'shield',
  'bow_and_arrow',
  'white_check_mark',
  'x',
  'warning',
  'question',
  'exclamation',
  'arrow_right',
  'arrow_left',
  'arrow_up',
  'arrow_down',
];

const defaultEmojis = computed<EmojiEntry[]>(() => {
  const out: EmojiEntry[] = [];
  const seen = new Set<string>();
  for (const name of defaultEmojiNames) {
    const rendered = emojify(`:${name}:`);
    // emojify returns the input unchanged if the shortcode is unknown.
    if (rendered === `:${name}:` || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, emoji: rendered });
  }
  return out;
});

const emojiResults = computed<EmojiEntry[]>(() => {
  const term = emojiSearchTerm.value.trim().toLowerCase();
  if (!term) return defaultEmojis.value;
  const results = searchEmoji(term) as EmojiEntry[];
  return results.slice(0, 96);
});

function insertEmojiShortcode(name: string) {
  emojiPickerOpen.value = false;
  emojiSearchTerm.value = '';
  // Restore editor focus so the shortcode is inserted at its saved selection.
  sourceEditorRef.value?.focus();
  nextTick(() => insertAtCursor(`:${name}:`));
}

function insertMagicSymbol(token: string) {
  magicSymbolPickerOpen.value = false;
  magicSymbolSearchTerm.value = '';
  sourceEditorRef.value?.focus();
  nextTick(() => insertAtCursor(`{${token}}`));
}
</script>

<style scoped>
.primer-preview :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin: 1.25rem 0 0.75rem;
  line-height: 1.2;
}
.primer-preview :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1.1rem 0 0.6rem;
  line-height: 1.25;
}
.primer-preview :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}
.primer-preview :deep(h4),
.primer-preview :deep(h5),
.primer-preview :deep(h6) {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.9rem 0 0.4rem;
}
.primer-preview :deep(p) {
  margin: 0.6rem 0;
  line-height: 1.65;
}
.primer-preview :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0.6rem 0;
}
.primer-preview :deep(ol) {
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 0.6rem 0;
}
.primer-preview :deep(li) {
  margin: 0.25rem 0;
}
.primer-preview :deep(blockquote) {
  border-left: 4px solid var(--ui-primary);
  padding: 0.25rem 0 0.25rem 1rem;
  margin: 0.75rem 0;
  color: rgb(107 114 128);
  font-style: italic;
}
.primer-preview :deep(code) {
  background: rgba(127, 127, 127, 0.15);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.9em;
}
.primer-preview :deep(pre) {
  background: rgba(127, 127, 127, 0.12);
  padding: 0.85rem 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.75rem 0;
}
.primer-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}
.primer-preview :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
}
.primer-preview :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(127, 127, 127, 0.3);
  margin: 1.25rem 0;
}
.primer-preview :deep(table) {
  border-collapse: collapse;
  margin: 0.75rem 0;
  width: 100%;
}
.primer-preview :deep(th),
.primer-preview :deep(td) {
  border: 1px solid rgba(127, 127, 127, 0.3);
  padding: 0.4rem 0.6rem;
}
.primer-preview :deep(th) {
  background: rgba(127, 127, 127, 0.08);
  font-weight: 600;
}
.primer-preview :deep(details) {
  border: 1px solid rgba(127, 127, 127, 0.3);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin: 0.75rem 0;
}
.primer-preview :deep(summary) {
  cursor: pointer;
  font-weight: 600;
  padding: 0.25rem 0;
  user-select: none;
}
.primer-preview :deep(details[open] summary) {
  margin-bottom: 0.5rem;
}
.primer-preview :deep(img) {
  display: block;
  max-width: 500px;
  margin: 0.5rem auto;
}
.primer-preview :deep(.youtube-embed) {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 16 / 9;
  margin: 1rem auto;
  border-radius: 6px;
  overflow: hidden;
}
.primer-preview :deep(.youtube-embed iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}
.primer-preview :deep(.card-inline-img-link) {
  display: block;
  text-align: center;
  text-decoration: none;
}
.primer-preview :deep(.card-inline-embed) {
  display: flex;
  width: fit-content;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem auto;
}
.primer-preview :deep(.card-inline-img) {
  display: inline-block;
  width: 200px;
  max-width: 500px;
  border-radius: 10px;
  vertical-align: middle;
  margin: 0.25rem;
}
.primer-preview :deep(.card-inline-actions) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0.35rem;
}
.primer-preview :deep(.card-inline-action) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2rem;
  min-width: 6.5rem;
  gap: 0.35rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid currentColor;
  border-radius: 0.375rem;
  box-sizing: border-box;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
}
.primer-preview :deep(.card-inline-action svg) {
  width: 1rem;
  height: 1rem;
}
.primer-preview :deep(.card-inline-action::after) {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.45rem);
  z-index: 20;
  padding: 0.3rem 0.5rem;
  border-radius: 0.375rem;
  background: var(--ui-bg-inverted);
  color: var(--ui-text-inverted);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, 0.2rem);
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}
.primer-preview :deep(.card-inline-action:hover::after),
.primer-preview :deep(.card-inline-action:focus-visible::after) {
  opacity: 1;
  transform: translate(-50%, 0);
}
.primer-preview :deep(.card-inline-action:hover) {
  background: rgba(127, 127, 127, 0.12);
}
.primer-preview :deep(.card-inline-action-similar) {
  color: var(--ui-text-muted);
}
.primer-preview :deep(.card-inline-action-popular) {
  color: var(--ui-error);
}
.primer-preview :deep(.card-inline-action-recommend) {
  color: var(--ui-primary);
}
.primer-preview :deep(.card-inline-action-buy) {
  color: var(--ui-success);
}
.primer-preview :deep(.card-inline-action-flip) {
  color: var(--ui-text-muted);
  cursor: pointer;
}
.primer-preview :deep(.card-inline-link) {
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  touch-action: manipulation;
}
.primer-preview :deep(.card-unknown) {
  color: #f87171;
  font-style: italic;
}
.primer-preview :deep(.magic-symbol) {
  display: inline-block;
  margin: 0 0.08em;
  margin-inline-start: 0.08em !important;
  font-size: 1.05em;
  vertical-align: -0.08em;
}

/* --- Discord-style link unfurls --- */
.primer-preview :deep(.link-embed) {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-width: 520px;
  margin: 0.75rem auto;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-left: 4px solid var(--ui-primary, #6366f1);
  border-radius: 6px;
  background: var(--ui-bg-elevated, rgba(0, 0, 0, 0.03));
  text-decoration: none;
  color: inherit;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
  overflow: hidden;
}
.primer-preview :deep(.link-embed:hover) {
  background: var(--ui-bg-accented, rgba(99, 102, 241, 0.06));
  text-decoration: none;
}
.primer-preview :deep(.link-embed-eyebrow) {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-text-muted, #9ca3af);
}
.primer-preview :deep(.link-embed-title) {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  color: #60a5fa;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}
.primer-preview :deep(.link-embed:hover .link-embed-title) {
  text-decoration: underline;
}
.primer-preview :deep(.link-embed-description) {
  display: block;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--ui-text-muted, #9ca3af);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  word-break: break-word;
}
.primer-preview :deep(.link-embed-meta) {
  display: block;
  font-size: 0.75rem;
  color: var(--ui-text-muted, #9ca3af);
}
.primer-preview :deep(.link-embed-image) {
  display: block;
  margin-top: 0.375rem;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  overflow: hidden;
  background: var(--ui-bg-muted, rgba(0, 0, 0, 0.05));
}
.primer-preview :deep(.link-embed-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin: 0;
  border-radius: 0;
}
.primer-preview :deep(.link-embed-image-skeleton) {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06) 25%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: link-embed-shimmer 1.4s ease-in-out infinite;
}
.primer-preview :deep(.link-embed-skeleton-line) {
  display: block;
  height: 0.75rem;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06) 25%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: link-embed-shimmer 1.4s ease-in-out infinite;
}
.primer-preview :deep(.link-embed-skeleton-line--sm) {
  width: 30%;
}
.primer-preview :deep(.link-embed-skeleton-line--md) {
  width: 60%;
}
.primer-preview :deep(.link-embed-skeleton-line--lg) {
  width: 85%;
  height: 1rem;
}
@keyframes link-embed-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.dark .primer-preview :deep(.link-embed-image-skeleton),
.dark .primer-preview :deep(.link-embed-skeleton-line) {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.06) 75%
  );
  background-size: 200% 100%;
}
</style>

<!-- Unscoped: the token preview is teleported to <body> and can't inherit scoped styles. -->
<style>
.editor-card-preview {
  position: fixed;
  width: 220px;
  aspect-ratio: 5 / 7;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  z-index: 1000;
  background: #000;
  pointer-events: none;
}
.editor-card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
