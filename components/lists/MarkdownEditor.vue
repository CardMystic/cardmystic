<template>
  <div class="flex flex-col grow min-h-0 gap-3 pb-0">
    <LazyCardActionsModal
      v-if="activeCard && cardActionsOpen"
      v-model:open="cardActionsOpen"
      :card="activeCard"
      :actions="cardActions"
      board="Embedded"
    />
    <LazyAddToDeckModal
      v-if="activeCard && addToDeckOpen"
      v-model:open="addToDeckOpen"
      :oracle-ids="[activeCard.card_data.oracle_id]"
    />
    <LazyPrintingPicker
      v-if="printingTarget && editable"
      :oracle-id="printingTarget.oracleId"
      :name="printingTarget.name"
      :selected-id="printingTarget.printingId"
      :selected-finish="printingTarget.finish"
      :save="saveCardPrinting"
      @close="printingTarget = null"
    />
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
            v-model:open="textColorPickerOpen"
            :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
          >
            <UTooltip text="Text color">
              <UButton
                icon="i-lucide-palette"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                aria-label="Text color"
              />
            </UTooltip>
            <template #content>
              <TextColorPickerPanel @select="applyTextColor" />
            </template>
          </UPopover>
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
          <UDropdownMenu v-if="primerListId" :items="primerDeckMenu">
            <UButton
              label="Deck content"
              icon="i-lucide-chart-column"
              trailing-icon="i-lucide-chevron-down"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </div>

        <LazyMarkdownSourceEditor
          ref="sourceEditorRef"
          v-model="draft"
          :placeholder="placeholder"
          :active="mode !== 'preview'"
          @scroll="onEditorScroll"
          @card-hover="onEditorCardHover"
          @card-leave="schedulePreviewDismiss"
        />
      </div>
      <!-- Right: live preview -->
      <div
        v-if="mode === 'split'"
        ref="previewRef"
        class="primer-preview flex-1 min-w-0 min-h-0 px-1 overflow-y-auto"
        @click="handlePreviewClick"
        @submit="handleSearchEmbedSubmit"
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
      ref="fullPreviewRef"
      class="primer-preview grow min-h-0 overflow-y-auto px-1"
      @click="handlePreviewClick"
      @submit="handleSearchEmbedSubmit"
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

    <LazyPrimerDeckEmbeds
      v-if="
        primerListId &&
        renderedHtml.includes('data-primer-deck=') &&
        (!editable || mode !== 'edit')
      "
      :key="primerListId"
      :list-id="primerListId"
      :owner="editable"
      :container="mode === 'split' ? previewRef : fullPreviewRef"
      :html="renderedHtml"
    />

    <!-- Allow moving from the source token onto the floating card. -->
    <Teleport to="body">
      <Transition name="editor-card-fade">
        <button
          v-if="tokenPreview"
          type="button"
          class="editor-card-preview card-finish"
          :data-card-finish="
            cardImageMap.get(tokenPreview.reference.toLowerCase())?.card
              .card_data.selected_finish
          "
          :aria-label="`Card options for ${parseMarkdownCardReference(tokenPreview.reference).name}`"
          @pointerenter="cancelPreviewDismiss"
          @pointerleave="schedulePreviewDismiss"
          @focus="cancelPreviewDismiss"
          @blur="schedulePreviewDismiss"
          @click="openCardActions(tokenPreview.reference)"
          :style="{
            left: `${tokenPreview.x}px`,
            top: `${tokenPreview.y}px`,
          }"
        >
          <img :src="tokenPreview.imageUrl" alt="" />
        </button>
      </Transition>
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
import { getUsdPrice } from '~/utils/cardPrice';
import { refDebounced } from '~/utils/refDebounced';
import type {
  MarkdownSourceEditorHandle,
  EditorCardHover,
} from '~/utils/markdownEditorSyntax';
import {
  markdownTextColorEdit,
  parseColoredMarkdown,
} from '~/utils/markdownTextColor';
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
import {
  extractSearchEmbeds,
  parseSearchEmbedUrl,
  renderSearchEmbed,
} from '~/utils/searchEmbeds';
import { extractAndTokenizeLinkEmbeds } from '~/utils/linkEmbeds';
import {
  parseMarkdownCardReference,
  formatMarkdownCardReference,
  markdownCardTokens,
} from '~/utils/markdownCardReference';
import { withPrinting, type Printing, type Finish } from '~/utils/printings';
import type { Card } from '~/models/cardModel';
import { cardActionStyles, findSimilarAction, type CardActionMenu } from '~/utils/card-actions';
import {
  primerDeckBlocks,
  restorePrimerDeckEmbeds,
} from '~/utils/primerDeckEmbeds';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    editable: boolean;
    /** Only primer pages can embed data from their associated deck. */
    primerListId?: string;
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
const fullPreviewRef = ref<HTMLDivElement | null>(null);
const primerDeckMenu = primerDeckBlocks.map((block) => ({
  label: block.label,
  icon: block.icon,
  onSelect() {
    const editor = sourceEditorRef.value;
    if (!props.primerListId || !editor) return;
    insertAtCursor(
      ensureBlockBoundary(draft.value, editor.getSelection().from) +
        `@[deck](${block.type})\n\n`,
    );
    nextTick(() => editor.focus());
  },
}));

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
  if (el?.closest('.editor-card-preview')) return;
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
  cancelPreviewDismiss();
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
  reference: string;
  imageUrl: string;
  x: number;
  y: number;
} | null>(null);

let previewDismissTimer: ReturnType<typeof setTimeout> | undefined;
function cancelPreviewDismiss() {
  clearTimeout(previewDismissTimer);
  previewDismissTimer = undefined;
}
function schedulePreviewDismiss() {
  // Pointer movement away from a link must not keep extending its lifetime.
  if (previewDismissTimer !== undefined || !tokenPreview.value) return;
  previewDismissTimer = setTimeout(() => {
    previewDismissTimer = undefined;
    tokenPreview.value = null;
  }, 100);
}

const PREVIEW_WIDTH = 220;
const PREVIEW_HEIGHT = 307; // 220 * 1.395 (MTG card aspect)
const CARD_DOUBLE_TAP_MS = 450;
let lastCardTap: { element: HTMLElement; time: number } | null = null;

function onEditorCardHover(card: EditorCardHover) {
  cancelPreviewDismiss();
  const entry = cardImageMap.value.get(card.name.toLowerCase());
  if (!entry) {
    tokenPreview.value = null;
    return;
  }
  const preferredTop = card.top - PREVIEW_HEIGHT - 8;
  const maxX = window.innerWidth - PREVIEW_WIDTH - 8;
  tokenPreview.value = {
    reference: card.name,
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
    schedulePreviewDismiss();
    lastCardTap = null;
    return;
  }
  const name =
    target.dataset.cardReference ?? (target.textContent ?? '').trim();
  cancelPreviewDismiss();
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
    reference: name,
    imageUrl: entry.imageUrl,
    x,
    y,
  };
}

function onPreviewPointerLeave(event: PointerEvent) {
  // Touch ends with pointerleave, followed by synthetic mouse events. Neither
  // should dismiss the preview or cancel the pending second tap.
  if (event.pointerType === 'touch') return;
  schedulePreviewDismiss();
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

const referencedCardTokens = computed(() => {
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
const referencedCardNames = computed(() => [
  ...new Set(
    referencedCardTokens.value.map(
      (value) => parseMarkdownCardReference(value).name,
    ),
  ),
]);
const markdownPrintings = useMarkdownPrintings(referencedCardTokens);

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
      card: Card;
      imageUrl: string;
      oracleId: string;
    }
  >();
  for (const reference of referencedCardTokens.value) {
    const parsed = parseMarkdownCardReference(reference);
    const card = referencedCards.value?.find(
      (card) => card.card_data.name.toLowerCase() === parsed.name.toLowerCase(),
    );
    if (!card) continue;
    const display = withPrinting(
      card.card_data,
      {
        oracle_id: card.card_data.oracle_id,
        board: 'mainboard',
        printing_id: parsed.printingId,
        finish: parsed.finish,
      },
      parsed.printingId
        ? markdownPrintings.byId.value.get(parsed.printingId)
        : undefined,
    );
    const imageUrl = getCardImageUrl(display, false, 'normal');
    map.set(reference.toLowerCase(), {
      card: { ...card, card_data: display },
      imageUrl,
      oracleId: card.card_data.oracle_id,
    });
  }
  return map;
});

const activeCard = shallowRef<Card | null>(null);
const cardActionsOpen = ref(false);
const addToDeckOpen = ref(false);
function openCardActions(reference: string) {
  const entry = cardImageMap.value.get(reference.toLowerCase());
  if (!entry) return;
  cancelPreviewDismiss();
  tokenPreview.value = null;
  activeCard.value = entry.card;
  cardActionsOpen.value = true;
}
const cardActions = computed<CardActionMenu>(() => {
  if (!activeCard.value) return {};
  const data = activeCard.value.card_data;
  const encodedName = encodeURIComponent(data.name);
  const menu: CardActionMenu = {
    addToDeck: {
      label: 'Add to Deck',
      ...cardActionStyles.addToDeck,
      onSelect: () => {
        addToDeckOpen.value = true;
      },
    },
    similar: {
      ...findSimilarAction,
      to: `/search/all/similarity?card_name=${encodedName}&searchType=similarity`,
    },
  };
  if (commanderNames.value?.has(data.name)) {
    menu.popular = {
      label: 'Popular Cards for this Commander',
      ...cardActionStyles.popularForCommander,
      to: `/popular-by-commander/all?commander=${encodedName}`,
    };
    menu.recommendations = {
      label: 'Get Deck Recommendations',
      ...cardActionStyles.recommendations,
      to: `/search/all/deckbuilder?commander=${encodedName}`,
    };
  }
  if (data.tcgplayer_id) {
    const price = getUsdPrice(data.prices);
    menu.marketplace = {
      label: price ? `Buy on TCGPlayer · $${price}` : 'Buy on TCGPlayer',
      ...cardActionStyles.buy,
      to: getAffiliateLink(data.tcgplayer_id),
      target: '_blank',
      rel: 'noopener noreferrer',
    };
  }
  return menu;
});

const printingTarget = ref<
  | (ReturnType<typeof parseMarkdownCardReference> & {
      oracleId: string;
      source: string;
      from: number;
      to: number;
      image: boolean;
    })
  | null
>(null);
function chooseCardPrinting(
  token: ReturnType<typeof markdownCardTokens>[number],
  source: string,
) {
  if (!props.editable) return;
  const parsed = parseMarkdownCardReference(token.value);
  const entry = cardImageMap.value.get(token.value.toLowerCase());
  if (!entry) {
    useToast().add({
      title: 'Wait for this card to load, then try again.',
      color: 'error',
    });
    return;
  }
  tokenPreview.value = null;
  printingTarget.value = {
    ...parsed,
    oracleId: entry.oracleId,
    source,
    from: token.from,
    to: token.to,
    image: token.image,
  };
}
async function saveCardPrinting(
  printing: Printing | null,
  finish: Finish | null,
) {
  const target = printingTarget.value;
  if (!props.editable || !target) return;
  if (draft.value !== target.source)
    throw new Error(
      'The text changed. Close the picker and choose the card again.',
    );
  if (printing && printing.oracle_id !== target.oracleId)
    throw new Error('This printing belongs to a different card.');
  const reference = formatMarkdownCardReference(
    target.name,
    printing?.id,
    finish,
  );
  const text = target.image ? `((${reference}))` : `[[${reference}]]`;
  if (printing) markdownPrintings.remember(printing);
  const editor = sourceEditorRef.value;
  if (editor)
    editor.replaceSelection(text, undefined, {
      from: target.from,
      to: target.to,
    });
  else
    draft.value =
      draft.value.slice(0, target.from) + text + draft.value.slice(target.to);
  printingTarget.value = null;
}

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
  const searchEmbedResult = extractSearchEmbeds(src);
  const linkEmbedResult = extractAndTokenizeLinkEmbeds(
    searchEmbedResult.processed,
  );
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

  const html = parseColoredMarkdown(pre, !!props.primerListId);
  const safeHtml = sanitizeMarkdownHtml(html);
  const sanitized = props.primerListId
    ? restorePrimerDeckEmbeds(safeHtml)
    : safeHtml;

  // --- Post-process: swap tokens back with final HTML ---
  let result = sanitized.replace(
    /(?:<p>\s*)?YTEMBEDTOKEN(\d+)YTEMBEDTOKEN(?:\s*<\/p>)?/g,
    (_, idx) => {
      const id = ytIds[Number(idx)];
      if (!id) return '';
      return `<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
    },
  );

  // Markdown preprocessing separates image rows from surrounding prose.
  result = result.replace(
    /<p>((?:\s|<br\s*\/?>|CARDIMGTOKEN\d+CARDIMGTOKEN)+)<\/p>/g,
    '<p class="card-embed-row">$1</p>',
  );

  result = result.replace(/CARDIMGTOKEN(\d+)CARDIMGTOKEN/g, (_, idx) => {
    const reference = cardImgNames[Number(idx)];
    if (!reference) return '';
    const { name } = parseMarkdownCardReference(reference);
    const entry = cardImageMap.value.get(reference.toLowerCase());
    if (!entry || !isOracleId(entry.oracleId))
      return `<em class="card-unknown">${escapeEmbedHtml(name)}</em>`;
    const safeName = escapeEmbedHtml(name);
    const imageUrl = escapeEmbedHtml(entry.imageUrl);
    const printingAction = props.editable
      ? `<button type="button" class="card-printing-button" data-card-printing="${idx}" aria-label="Select printing for ${safeName}">Select Printing</button>`
      : '';
    const image = imageUrl
      ? `<img class="card-inline-img" src="${imageUrl}" alt="${safeName}" loading="lazy" />`
      : `<span class="card-inline-placeholder">${safeName}</span>`;
    return `<span class="card-inline-embed"><a class="card-inline-img-link card-finish" data-card-finish="${escapeEmbedHtml(entry.card.card_data.selected_finish ?? '')}" data-card-reference="${escapeEmbedHtml(reference)}" href="/card/${entry.oracleId}" aria-label="Card options for ${safeName}">${image}</a>${printingAction}</span>`;
  });

  result = result.replace(/CARDLINKTOKEN(\d+)CARDLINKTOKEN/g, (_, idx) => {
    const reference = cardLinkNames[Number(idx)];
    if (!reference) return '';
    const { name } = parseMarkdownCardReference(reference);
    const safeName = escapeEmbedHtml(name);
    const entry = cardImageMap.value.get(reference.toLowerCase());
    // Unresolved names stay plain text instead of linking to a missing card.
    if (!entry || !isOracleId(entry.oracleId)) {
      return `<span class="card-unknown">${safeName}</span>`;
    }
    return `<a class="card-inline-link" data-card-reference="${escapeEmbedHtml(reference)}" href="/card/${entry.oracleId}">${safeName}</a>`;
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

  result = result.replace(
    /(?:<p>\s*)?CMSEARCHTOKEN(\d+)CMSEARCHTOKEN(?:\s*<\/p>)?/g,
    (_, index) => {
      const embed = searchEmbedResult.embeds[Number(index)];
      return embed ? renderSearchEmbed(embed) : '';
    },
  );

  result = restoreMagicSymbols(result, extractedMagicSymbols.symbols);

  return result;
});

function handleSearchEmbedSubmit(event: Event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches('.search-embed-form'))
    return;
  const embed = parseSearchEmbedUrl(form.dataset.searchHref ?? '');
  if (!embed) return;
  event.preventDefault();
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form)) {
    if (typeof value === 'string') params.append(key, value);
  }
  const href =
    params.get(embed.queryKey) === embed.query
      ? embed.href
      : embed.action + '?' + params.toString();
  router.push(href);
}

function handlePreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const cardImage = target?.closest<HTMLAnchorElement>('.card-inline-img-link');
  if (cardImage && event.button === 0 && !isModifiedClick(event)) {
    event.preventDefault();
    openCardActions(cardImage.dataset.cardReference ?? '');
    return;
  }
  const printingButton = target?.closest<HTMLElement>('[data-card-printing]');
  if (printingButton && props.editable) {
    const token = markdownCardTokens(previewSource.value).filter(
      (token) => token.image,
    )[Number(printingButton.dataset.cardPrinting)];
    if (token) chooseCardPrinting(token, previewSource.value);
    return;
  }

  const cardLink = target?.closest<HTMLAnchorElement>('.card-inline-link');
  if (cardLink) {
    // Preserve modifier and middle clicks. Touch
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
    event.preventDefault();
    openCardActions(cardLink.dataset.cardReference ?? '');
    return;
  }

  // These anchors are injected as raw HTML. Route ordinary activations through
  // Vue while keeping the browser's native new-tab and modifier-link behavior.
  const spaLink = target?.closest<HTMLAnchorElement>(
    '.link-embed, .search-embed-link, .card-inline-img-link, .card-inline-link',
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
  | 'search-embed'
  | 'card-image'
  | 'card-printing'
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
    {
      id: 'search-embed',
      icon: 'i-lucide-search',
      tooltip: 'Embed a CardMystic search',
    },
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
    {
      id: 'card-printing',
      icon: 'i-lucide-images',
      tooltip: 'Choose card printing',
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
    case 'card-printing': {
      const token = markdownCardTokens(value).find(
        (token) => start >= token.from && end <= token.to,
      );
      if (token) chooseCardPrinting(token, value);
      else
        useToast().add({
          title: 'Place your cursor inside a card image or card link first.',
        });
      return;
    }
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
    case 'search-embed': {
      const input = window.prompt(
        'CardMystic search URL',
        selected ||
          'https://cardmystic.com/search/all/smart?query=draw%20cards',
      );
      if (!input) return;
      if (!parseSearchEmbedUrl(input)) {
        window.alert('Enter a valid CardMystic search URL.');
        return;
      }
      insertAtCursor(
        ensureBlockBoundary(value, start) +
          '@[search](' +
          input.trim() +
          ')\n\n',
      );
      return;
    }
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

const textColorPickerOpen = ref(false);

function applyTextColor(color: string) {
  const editor = sourceEditorRef.value;
  if (!editor) return;
  const edit = markdownTextColorEdit(draft.value, editor.getSelection(), color);
  if (!edit) return;
  editor.replaceSelection(edit.text, edit.selection, edit.range);
  textColorPickerOpen.value = false;
  nextTick(() => sourceEditorRef.value?.focus());
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
  width: 280px;
  max-width: 100%;
  flex-shrink: 0;
  text-align: center;
  text-decoration: none;
  border-radius: 5% / 3.6%;
  overflow: hidden;
}
.primer-preview :deep(.card-inline-embed) {
  display: inline-flex;
  width: fit-content;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0.5rem 0.5rem 0;
  max-width: 100%;
  vertical-align: top;
}
.primer-preview :deep(.card-embed-row) {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 1.5rem;
}
.primer-preview :deep(.card-embed-row > .card-inline-embed) {
  margin: 0.5rem 0;
}
.primer-preview :deep(.card-inline-img) {
  display: block;
  width: 100%;
  max-width: 100%;
  border-radius: inherit;
  margin: 0;
}
.primer-preview :deep(.card-inline-placeholder) {
  display: grid;
  place-items: center;
  aspect-ratio: 488 / 680;
  padding: 1rem;
  border-radius: inherit;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
}
.primer-preview :deep(.card-printing-button) {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  color: var(--ui-text);
  font-size: 0.875rem;
  cursor: pointer;
}
.primer-preview :deep(.card-printing-button:hover) {
  background: var(--ui-bg-elevated);
}
.primer-preview :deep(.primer-deck-slot:empty) {
  min-height: 18rem;
}
.primer-preview :deep(.primer-deck-slot ul) {
  list-style: none;
  padding-left: 0;
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

/* Explicit search embeds remain usable as ordinary links and GET forms. */
.primer-preview :deep(.search-embed) {
  margin: 1.25rem 0;
  padding: 1rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 1rem;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--ui-primary) 9%, var(--ui-bg)),
    var(--ui-bg)
  );
}
.primer-preview :deep(.search-embed-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.primer-preview :deep(.search-embed-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ui-text-highlighted);
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
}
.primer-preview :deep(.search-embed-link:hover) {
  color: var(--ui-primary);
  text-decoration: underline;
}
.primer-preview :deep(.search-embed-link svg) {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  color: var(--ui-primary);
}
.primer-preview :deep(.search-embed-platform) {
  color: var(--ui-text-muted);
  font-size: 0.75rem;
  text-align: right;
}
.primer-preview :deep(.search-embed-bar) {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.375rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 0.75rem;
  background: var(--ui-bg);
}
.primer-preview :deep(.search-embed-input) {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0.625rem;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--ui-text-highlighted);
  font: inherit;
  font-size: 1rem;
  line-height: 1.4;
}
.primer-preview :deep(.search-embed-submit) {
  flex-shrink: 0;
  align-self: center;
  border: 0;
  border-radius: 0.5rem;
  padding: 0.7rem 1rem;
  background: var(--ui-primary);
  color: var(--ui-bg);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.05em;
  cursor: pointer;
}
.primer-preview :deep(.search-embed-submit:hover) {
  filter: brightness(1.08);
}
.primer-preview :deep(.search-embed-input:focus-visible),
.primer-preview :deep(.search-embed-submit:focus-visible),
.primer-preview :deep(.search-embed-link:focus-visible) {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
@media (max-width: 420px) {
  .primer-preview :deep(.search-embed) {
    padding: 0.75rem;
  }
  .primer-preview :deep(.search-embed-submit) {
    padding: 0.7rem;
  }
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
  cursor: pointer;
  padding: 0;
  border: 0;
}
.editor-card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.editor-card-fade-enter-active {
  transition: opacity 140ms ease-out;
}
.editor-card-fade-leave-active {
  transition: opacity 100ms ease-out;
  pointer-events: none;
}
.editor-card-fade-enter-from,
.editor-card-fade-leave-to {
  opacity: 0;
}
</style>
