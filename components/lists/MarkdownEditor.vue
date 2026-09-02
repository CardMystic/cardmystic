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
        v-if="editable && (mode === 'edit' || mode === 'split')"
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
          :label="isDirty ? 'Save' : 'Saved'"
          class="cursor-pointer"
          :disabled="!isDirty || isSaving"
          :loading="isSaving"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Edit-only mode -->
    <div
      v-if="editable && mode === 'edit'"
      class="flex flex-col h-[80vh] min-h-0 gap-2 overflow-hidden"
    >
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

      <div
        class="editor-shell flex-1 min-h-0 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus-within:ring-2 focus-within:ring-primary-500"
        @mousemove="onEditorMouseMove"
        @mouseleave="onEditorMouseLeave"
      >
        <div ref="highlightLayerRef" class="highlight-layer" aria-hidden="true">
          <div
            ref="highlightContentRef"
            class="highlight-content"
            v-html="highlightedDraft"
          />
        </div>
        <textarea
          ref="textareaRef"
          v-model="draft"
          :placeholder="placeholder"
          class="editor-textarea"
          spellcheck="true"
          @scroll="syncHighlightScroll"
          @input="syncHighlightScroll"
        />
      </div>
    </div>

    <!-- Split mode (editor + live preview side by side, lg+ only) -->
    <div
      v-else-if="editable && mode === 'split'"
      class="flex h-[80vh] min-h-0 gap-4 overflow-hidden"
    >
      <!-- Left: editor -->
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

        <div
          class="editor-shell flex-1 min-h-0 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus-within:ring-2 focus-within:ring-primary-500"
          @mousemove="onEditorMouseMove"
          @mouseleave="onEditorMouseLeave"
        >
          <div
            ref="highlightLayerRef"
            class="highlight-layer"
            aria-hidden="true"
          >
            <div
              ref="highlightContentRef"
              class="highlight-content"
              v-html="highlightedDraft"
            />
          </div>
          <textarea
            ref="textareaRef"
            v-model="draft"
            placeholder="Describe how this deck wins, key combos, mulligan guide, sideboard plans, etc. Markdown supported."
            class="editor-textarea"
            spellcheck="true"
            @scroll="onSplitScroll"
            @input="syncHighlightScroll"
          />
        </div>
      </div>

      <!-- Right: live preview -->
      <div
        ref="previewRef"
        class="primer-preview flex-1 min-w-0 min-h-0 px-1 overflow-y-auto"
        @click="handlePreviewClick"
        @mousemove="onPreviewMouseMove"
        @mouseleave="onPreviewMouseLeave"
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
      v-else
      class="primer-preview grow min-h-0 overflow-y-auto px-1"
      @click="handlePreviewClick"
      @mousemove="onPreviewMouseMove"
      @mouseleave="onPreviewMouseLeave"
    >
      <div v-if="renderedHtml" v-html="renderedHtml"></div>
      <p
        v-else
        class="text-gray-500 dark:text-gray-400 italic text-center py-8"
      >
        {{ emptyMessage }}
      </p>
    </div>

    <!-- Floating card preview shown while hovering over ((...)) / [[...]] tokens -->
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
import DOMPurify from 'dompurify';
import { emojify, search as searchEmoji } from 'node-emoji';
import 'mana-font/css/mana.min.css';
import { useCardsByName } from '~/composables/useCards';
import { useCommandersSet } from '~/composables/useBulkData';
import { getCardImageUrl } from '~/utils/scryfall';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import {
  extractMagicSymbols,
  magicSymbols,
  restoreMagicSymbols,
} from '~/utils/magicSymbols';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    editable: boolean;
    isSaving?: boolean;
    /** Message shown in preview mode when there is no content yet. */
    emptyMessage?: string;
    /** Placeholder text for the markdown editor textarea. */
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
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const mode = ref<'edit' | 'split' | 'preview'>(
  props.editable ? 'edit' : 'preview',
);
const draft = ref(props.modelValue);
const lastSavedAt = ref<number | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const previewRef = ref<HTMLDivElement | null>(null);
const highlightLayerRef = ref<HTMLDivElement | null>(null);
const highlightContentRef = ref<HTMLDivElement | null>(null);
let highlightResizeObserver: ResizeObserver | null = null;

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

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  highlightResizeObserver = new ResizeObserver(syncHighlightScroll);
  if (textareaRef.value) highlightResizeObserver.observe(textareaRef.value);
  nextTick(syncHighlightScroll);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  highlightResizeObserver?.disconnect();
  highlightResizeObserver = null;
});

// --- Scroll sync: editor → preview ---
function onEditorScroll() {
  const ta = textareaRef.value;
  const pr = previewRef.value;
  if (!ta || !pr) return;
  const maxEditorScroll = ta.scrollHeight - ta.clientHeight;
  if (maxEditorScroll <= 0) return;
  const ratio = ta.scrollTop / maxEditorScroll;
  const maxPreviewScroll = pr.scrollHeight - pr.clientHeight;
  pr.scrollTop = ratio * maxPreviewScroll;
}

// Keep the syntax-highlight overlay aligned with the textarea's scroll position.
function syncHighlightScroll() {
  const ta = textareaRef.value;
  const layer = highlightLayerRef.value;
  const content = highlightContentRef.value;
  if (!ta || !layer || !content) return;
  // A textarea's client width excludes its vertical scrollbar. Mirror that
  // usable width so soft-wrapped lines, highlighted text, and the caret stay
  // aligned after the editor begins scrolling or changes layout.
  layer.style.width = `${ta.clientWidth}px`;
  content.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
}

watch(textareaRef, (ta) => {
  if (!highlightResizeObserver) return;
  highlightResizeObserver.disconnect();
  if (ta) highlightResizeObserver.observe(ta);
  nextTick(syncHighlightScroll);
});

function onSplitScroll() {
  onEditorScroll();
  syncHighlightScroll();
}

watch(
  () => draft.value,
  () => {
    nextTick(syncHighlightScroll);
  },
);

// --- Card token hover preview (raw editor) ---
// The highlight overlay is `pointer-events: none` so the textarea stays fully
// interactive. To surface hover previews for ((Card)) / [[Card]] tokens we
// hit-test the token span rects against the mouse position on mousemove.
const tokenPreview = ref<{
  imageUrl: string;
  x: number;
  y: number;
} | null>(null);

const PREVIEW_WIDTH = 220;
const PREVIEW_HEIGHT = 307; // 220 * 1.395 (MTG card aspect)

function onEditorMouseMove(e: MouseEvent) {
  const layer = highlightContentRef.value;
  if (!layer) {
    tokenPreview.value = null;
    return;
  }
  const spans = layer.querySelectorAll<HTMLElement>(
    '.tok-card-img, .tok-card-link',
  );
  for (const span of spans) {
    const rects = span.getClientRects();
    for (const rect of rects) {
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const raw = span.textContent ?? '';
        const name = raw
          .replace(/^\(\(|\)\)$/g, '')
          .replace(/^\[\[|\]\]$/g, '')
          .trim();
        const entry = cardImageMap.value.get(name.toLowerCase());
        if (!entry) {
          tokenPreview.value = null;
          return;
        }
        // Position above the token by default; flip below if too close to top.
        const preferredTop = rect.top - PREVIEW_HEIGHT - 8;
        const y = preferredTop < 8 ? rect.bottom + 8 : preferredTop;
        const maxX = window.innerWidth - PREVIEW_WIDTH - 8;
        const x = Math.min(Math.max(rect.left, 8), Math.max(maxX, 8));
        tokenPreview.value = { imageUrl: entry.imageUrl, x, y };
        return;
      }
    }
  }
  tokenPreview.value = null;
}

function onEditorMouseLeave() {
  tokenPreview.value = null;
}

// --- Card token hover preview (rendered preview pane) ---
// The preview pane is `overflow-y-auto`, which clips CSS-only tooltip
// approaches. Reuse the teleported floating preview by hit-testing the
// rendered `.card-inline-link` elements on mousemove.
function onPreviewMouseMove(e: MouseEvent) {
  const target = (e.target as HTMLElement | null)?.closest(
    '.card-inline-link',
  ) as HTMLElement | null;
  if (!target) {
    tokenPreview.value = null;
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
  tokenPreview.value = { imageUrl: entry.imageUrl, x, y };
}

function onPreviewMouseLeave() {
  tokenPreview.value = null;
}

// --- Card embeds: ((Card Name)) and [[Card Name]] ---
// Collect all unique card names referenced in the current preview source.
const previewSource = computed(() => {
  // When editable, always read from the live draft so newly-typed tokens are
  // resolved for hover previews even before switching to preview/split mode.
  const src = props.editable ? draft.value : props.modelValue;
  return src ?? '';
});

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

const { cards: referencedCards } = useCardsByName(referencedCardNames);
const { data: commanderNames } = useCommandersSet();

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

const isDirty = computed(() => draft.value !== props.modelValue);

async function handleSave() {
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
  if (!import.meta.client) return '';

  // --- Pre-process: extract special tokens before markdown sees them ---
  const ytIds: string[] = [];
  // Card image tokens: ((Card Name))
  const cardImgNames: string[] = [];
  // Card link tokens: [[Card Name]]
  const cardLinkNames: string[] = [];

  let pre = src.replace(/@\[youtube\]\(([A-Za-z0-9_-]{11})\)/g, (_, id) => {
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
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'loading',
      'frameborder',
      'allowfullscreen',
      'class',
      'open',
      'start',
    ],
    ADD_TAGS: ['details', 'summary', 'iframe'],
  });

  // --- Post-process: swap tokens back with final HTML ---
  let result = sanitized.replace(/YTEMBEDTOKEN(\d+)YTEMBEDTOKEN/g, (_, idx) => {
    const id = ytIds[Number(idx)];
    if (!id) return '';
    return `<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
  });

  result = result.replace(/CARDIMGTOKEN(\d+)CARDIMGTOKEN/g, (_, idx) => {
    const name = cardImgNames[Number(idx)];
    if (!name) return '';
    const entry = cardImageMap.value.get(name.toLowerCase());
    if (!entry) return `<em class="card-unknown">${name}</em>`;
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
      ? `<a class="card-inline-action card-inline-action-buy" href="${getAffiliateLink(entry.tcgplayerId)}" target="_blank" rel="noopener noreferrer" aria-label="Buy on TCGPlayer" data-tooltip="${entry.price ? `Buy on TCGPlayer ($${entry.price})` : 'Buy on TCGPlayer'}">${embeddedActionIcons.buy}<span>Buy${entry.price ? ` $${entry.price}` : ''}</span></a>`
      : '';
    const flipAction = entry.backImageUrl
      ? `<button type="button" class="card-inline-action card-inline-action-flip" aria-label="Flip Card" data-tooltip="Flip card" data-card-flip>${embeddedActionIcons.flip}<span>Flip</span></button>`
      : '';
    return `<span class="card-inline-embed" data-front-image="${entry.imageUrl}"${entry.backImageUrl ? ` data-back-image="${entry.backImageUrl}"` : ''}><a class="card-inline-img-link" href="/card/${entry.oracleId}"><img class="card-inline-img" src="${entry.imageUrl}" alt="${name}" data-card-face="front" loading="lazy" /></a><span class="card-inline-actions">${flipAction}${similarAction}${commanderActions}${buyAction}</span></span>`;
  });

  result = result.replace(/CARDLINKTOKEN(\d+)CARDLINKTOKEN/g, (_, idx) => {
    const name = cardLinkNames[Number(idx)];
    if (!name) return '';
    const entry = cardImageMap.value.get(name.toLowerCase());
    const href = entry ? `/card/${entry.oracleId}` : '#';
    return `<a class="card-inline-link" href="${href}">${name}</a>`;
  });

  result = restoreMagicSymbols(result, extractedMagicSymbols.symbols);

  return result;
});

function handlePreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
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

// --- Syntax highlighting for the raw markdown editor ---
// Produces safe HTML mirroring the textarea contents with token spans so users
// can visually distinguish HTML tags, card embeds, links, etc.
const highlightedDraft = computed(() => highlightMarkdown(draft.value));

interface HighlightMatch {
  start: number;
  end: number;
  cls: string;
}

function escapeHighlightHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightMarkdown(src: string): string {
  if (!src) return '';

  const matches: HighlightMatch[] = [];
  const add = (re: RegExp, cls: string) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      matches.push({ start: m.index, end: m.index + m[0].length, cls });
    }
  };

  // Higher-priority patterns first so they win when overlapping.
  add(/```[\s\S]*?```/g, 'tok-code-block');
  add(/`[^`\n]+`/g, 'tok-code');
  add(/\(\([^)\n]+\)\)/g, 'tok-card-img');
  add(/\[\[[^\]\n]+\]\]/g, 'tok-card-link');
  add(/@\[youtube\]\([A-Za-z0-9_-]{11}\)/g, 'tok-youtube');
  add(/\{[^{}\n]+\}/g, 'tok-magic-symbol');
  add(/:[a-z0-9_+-]+:/g, 'tok-emoji');
  add(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?\/?>/g, 'tok-html');
  add(/!\[[^\]\n]*\]\([^)\n]+\)/g, 'tok-image');
  add(/\[[^\]\n]+\]\([^)\n]+\)/g, 'tok-link');
  add(/^#{1,6}\s.*$/gm, 'tok-heading');
  add(/\*\*[^*\n]+\*\*/g, 'tok-bold');
  add(/(?<!\w)_[^_\n]+_(?!\w)/g, 'tok-italic');
  add(/^>\s.*$/gm, 'tok-quote');
  add(/^\s*(?:-{3,}|\*{3,})\s*$/gm, 'tok-hr');
  add(/^\s*(?:[-*+]|\d+\.)\s/gm, 'tok-list');

  // Prefer earlier start; on ties, prefer the longer match.
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  // Drop matches that overlap already-claimed ranges (first-wins after sort).
  const kept: HighlightMatch[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start >= cursor) {
      kept.push(m);
      cursor = m.end;
    }
  }

  let out = '';
  let pos = 0;
  for (const m of kept) {
    if (m.start > pos) out += escapeHighlightHtml(src.slice(pos, m.start));
    out += `<span class="${m.cls}">${escapeHighlightHtml(
      src.slice(m.start, m.end),
    )}</span>`;
    pos = m.end;
  }
  if (pos < src.length) out += escapeHighlightHtml(src.slice(pos));

  // Textareas render a trailing newline as an empty line; mirror that in the
  // overlay so line counts stay aligned.
  if (src.endsWith('\n')) out += '\n';

  return out;
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

// Flat list used only for action lookup
const toolbarActions: ToolbarAction[] = toolbarGroups.flat();

function applyAction(id: ToolbarActionId) {
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
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

  // Use execCommand so the browser undo stack is preserved.
  el.focus();
  el.setSelectionRange(start, end);
  document.execCommand('insertText', false, insertion);

  nextTick(() => {
    if (!textareaRef.value) return;
    textareaRef.value.focus();
    const selStart = start + insertion.length - after.length - text.length;
    const selEnd = selStart + text.length;
    textareaRef.value.setSelectionRange(selStart, selEnd);
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
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
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

  el.focus();
  el.setSelectionRange(start, end);
  document.execCommand('insertText', false, insertion);

  nextTick(() => {
    if (!textareaRef.value) return;
    textareaRef.value.focus();
    const selStart = start + boundary.length;
    const selEnd = selStart + prefixed.length;
    textareaRef.value.setSelectionRange(selStart, selEnd);
  });
}

function insertAtCursor(text: string) {
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  el.focus();
  document.execCommand('insertText', false, text);
  nextTick(() => {
    if (!textareaRef.value) return;
    textareaRef.value.setSelectionRange(
      start + text.length,
      start + text.length,
    );
  });
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
  // Focus the textarea first so the shortcode is inserted at the caret.
  textareaRef.value?.focus();
  nextTick(() => insertAtCursor(`:${name}:`));
}

function insertMagicSymbol(token: string) {
  magicSymbolPickerOpen.value = false;
  magicSymbolSearchTerm.value = '';
  textareaRef.value?.focus();
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

/* --- Syntax-highlighted editor (overlay + transparent textarea) --- */
.editor-shell {
  position: relative;
  overflow: hidden;
}
/* Shared type metrics — both layers MUST match exactly for caret/highlight alignment. */
.highlight-layer,
.editor-textarea {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0;
  tab-size: 4;
  -moz-tab-size: 4;
}
.highlight-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
  border-radius: inherit;
}
.highlight-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  will-change: transform;
  color: rgb(107 114 128); /* base tone for un-tokenized text */
}
:global(.dark) .highlight-content {
  color: rgb(148 163 184);
}
.editor-textarea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 1rem;
  margin: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: rgb(17 24 39);
  resize: none;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  box-sizing: border-box;
}
.editor-textarea::selection {
  background: rgba(59, 130, 246, 0.35);
  color: transparent;
}
.editor-textarea::placeholder {
  color: rgb(156 163 175);
}

/* Token colors — tuned to work in both light and dark themes. Keep font
   metrics unchanged so this mirror wraps exactly like the textarea. */
.highlight-content :deep(.tok-html) {
  color: #d946ef;
}
.highlight-content :deep(.tok-card-img) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 3px;
}
.highlight-content :deep(.tok-card-link) {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  border-radius: 3px;
}
.highlight-content :deep(.tok-youtube) {
  color: #ef4444;
}
.highlight-content :deep(.tok-emoji) {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 3px;
}
.highlight-content :deep(.tok-magic-symbol) {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.12);
  border-radius: 3px;
}
.highlight-content :deep(.tok-heading) {
  color: #f59e0b;
}
.highlight-content :deep(.tok-bold) {
  color: #eab308;
}
.highlight-content :deep(.tok-italic) {
  color: #eab308;
}
.highlight-content :deep(.tok-quote) {
  color: #94a3b8;
}
.highlight-content :deep(.tok-list) {
  color: #f97316;
}
.highlight-content :deep(.tok-link) {
  color: #06b6d4;
}
.highlight-content :deep(.tok-image) {
  color: #14b8a6;
}
.highlight-content :deep(.tok-code),
.highlight-content :deep(.tok-code-block) {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.12);
  border-radius: 3px;
}
.highlight-content :deep(.tok-hr) {
  color: #64748b;
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
  pointer-events: none;
  z-index: 1000;
  background: #000;
}
.editor-card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Dark-mode caret: kept unscoped because Vue's :global(.dark) in scoped styles
   did not reliably compile to a matching descendant selector here. */
.dark .editor-textarea {
  caret-color: #ffffff;
}
</style>
