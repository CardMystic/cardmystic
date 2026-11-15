<template>
  <div class="card-root list-card">
    <LazyCardActionsModal
      v-if="showActions"
      v-model:open="showActions"
      :is-flipped="isFlipped"
      @flip="flipCard"
      :card="card"
      :actions="cardOverlayMenuItems"
      :board="currentBoard"
    />
    <LazyAddToDeckModal
      v-if="showAddToDeckModal"
      v-model:open="showAddToDeckModal"
      :oracle-ids="[card.card_data.oracle_id]"
    />

    <LazySetCommanderModal
      v-if="showCommanderModal"
      :open="showCommanderModal"
      :card-name="card.card_data.name"
      @update:open="showCommanderModal = $event"
      @confirm="confirmSetCommander"
    />

    <LazySetCopiesModal
      v-if="showSetCopiesInput"
      :open="showSetCopiesInput"
      :card-name="card.card_data.name"
      :initial-copies="numCopies ?? 1"
      @update:open="showSetCopiesInput = $event"
      @confirm="confirmSetCopies"
    />

    <LazyRemoveCommanderModal
      v-if="showClearCommanderModal"
      :open="showClearCommanderModal"
      :card-name="card.card_data.name"
      @update:open="showClearCommanderModal = $event"
      @confirm="confirmClearCommander"
    />

    <div class="card-image-wrapper deck-card-hover">
      <CardTagCheckbox
        :oracle-id="card.card_data.oracle_id"
        :name="card.card_data.name"
        class="absolute left-2 z-20 rounded bg-default/90 p-2"
        :class="card.card_data.game_changer ? 'top-10' : 'top-2'"
      />
      <!-- Card image -->
      <button
        ref="actionTrigger"
        type="button"
        :aria-label="`Options for ${card.card_data.name}`"
        :aria-description="highlight.status.value ?? undefined"
        aria-haspopup="dialog"
        :aria-expanded="showActions"
        class="card-finish deck-card-surface relative block w-full rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
        :data-card-finish="card.card_data.selected_finish"
        @click="showActions = true"
      >
        <GameChangerBadge v-if="card.card_data.game_changer" />
        <img
          :src="imageUrl"
          :alt="card.card_data.name"
          @error="handleImageError"
          v-if="imageUrl"
          width="488"
          height="680"
          loading="lazy"
          decoding="async"
          class="card-large cursor-pointer"
        />
        <div v-else class="image-placeholder">
          <p class="placeholder-text">
            {{ card.card_data.name }}
          </p>
        </div>
        <span
          v-if="highlight.status.value"
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 rounded-xl"
          :class="highlight.classes.value"
        />
      </button>

      <LazyCardOverlayButtons
        :card="card"
        :isDualFaced="isDualFaced"
        :show-flip-button="true"
        :show-copy-count="!isDeckCommander"
        :num-copies="numCopies ?? 1"
        @flip="flipCard"
      />

      <!-- Legality Warning Overlay -->
      <div v-if="legalityWarning" class="legality-overlay">
        <div class="legality-overlay-content">
          <UIcon
            name="i-lucide-triangle-alert"
            class="text-amber-400"
            size="28"
          />
          <span
            class="text-xs text-amber-400 text-center font-medium leading-tight"
            >{{ legalityWarning }}</span
          >
        </div>
      </div>
    </div>
    <DeckCardMetadata :card="card.card_data" :face="isDualFaced ? card.card_data.card_faces?.[isFlipped ? 1 : 0] : undefined" />
    <DeckCardLabels :oracle-id="card.card_data.oracle_id" />
    <div
      v-if="card.ai_rerank_score !== undefined"
      class="mt-1 flex min-h-8 items-center gap-2"
      title="Smart search match"
    >
      <progress
        :value="Math.round(card.ai_rerank_score * 100)"
        max="100"
        aria-label="Smart search match"
        :data-color="
          card.ai_rerank_score >= 0.7
            ? 'success'
            : card.ai_rerank_score >= 0.4
              ? 'warning'
              : 'error'
        "
        class="my-0 flex-1 min-w-0"
      />
      <span class="flex items-center gap-0.5 text-xs whitespace-nowrap"
        ><UIcon name="i-lucide-brain" class="size-3" />{{
          Math.round(card.ai_rerank_score * 100)
        }}%</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { getUsdPrice } from '~/utils/cardPrice';
const highlight = useDeckHighlight(() => props.card.card_data);
import { cardActionStyles, findSimilarAction, type CardActionMenu } from '~/utils/card-actions';
import type { Card } from '~/models/cardModel';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';
import {
  isLegal,
  isColorIdentityLegal,
  formatToLegalityKey,
} from '~/utils/legality';
import { useCommandersSet } from '~/composables/useBulkData';
import { useSearchType } from '~/composables/useSearchType';
import { useSearchHistory } from '~/composables/useSearchHistory';

const router = useRouter();
const showActions = ref(false);
const actionTrigger = useTemplateRef<HTMLButtonElement>('actionTrigger');
watch(showActions, async (open) => {
  if (!open) {
    await nextTick();
    actionTrigger.value?.focus();
  }
});
const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();

const props = defineProps<{
  card: Card;
  isDeckCommander: boolean;
  isCommanderCard?: boolean;
  isOwner?: boolean; // List actions (copies, boards, remove) are owner-only
  commanderColorIdentity?: string[] | null;
  numCopies?: number;
  legalityQuantity?: number;
  board?: string;
  format?: string;
  decklistCardNames?: string[]; // Full decklist for pre-filling the deckbuilder
  isFlipped?: boolean; // controlled by parent; falls back to internal state when omitted
}>();

const emit = defineEmits<{
  (
    e: 'remove',
    cardId: string,
    fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
  ): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
  (
    e: 'updateNumCopies',
    cardName: string,
    numCopies: number,
    fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
  ): void;
  (
    e: 'changeBoard',
    cardName: string,
    board: 'Mainboard' | 'Sideboard' | 'Considering',
    fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
  ): void;
  (e: 'flip', cardId: string): void;
}>();

// Deck results already resolve commander eligibility once for the whole list.
const commanderQuery =
  props.isCommanderCard === undefined ? useCommandersSet() : null;

const isFlippedInternal = ref(false);
const isFlipped = computed(() =>
  props.isFlipped !== undefined ? props.isFlipped : isFlippedInternal.value,
);
const imageUrl = computed(() =>
  getCardImageUrl(props.card.card_data, isFlipped.value),
);
const showAddToDeckModal = ref(false);
const showCommanderModal = ref(false);
const showClearCommanderModal = ref(false);
const showSetCopiesInput = ref(false);

function confirmSetCopies(numCopies: number) {
  emit(
    'updateNumCopies',
    props.card.card_data.name,
    numCopies,
    currentBoard.value,
  );
}

const boardOptions = ['Mainboard', 'Sideboard', 'Considering'] as const;
type Board = (typeof boardOptions)[number];
const currentBoard = ref<Board>((props.board as Board) || 'Mainboard');

watch(
  () => props.board,
  (val) => {
    currentBoard.value = (val as Board) || 'Mainboard';
  },
);

const isCommanderCardComputed = computed(() => {
  if (props.isCommanderCard !== undefined) return props.isCommanderCard;
  return isEligibleCommander.value;
});

const cardOverlayMenuItems = computed<CardActionMenu>(() => {
  const menu: CardActionMenu = {
    addToDeck: {
      label: 'Add to Another Deck',
      ...cardActionStyles.addToDeck,
      onSelect() {
        showAddToDeckModal.value = true;
      },
    },
  };

  if (props.card.card_data.tcgplayer_id) {
    menu.marketplace = {
      label: getUsdPrice(props.card.card_data.prices)
        ? `Buy on TCGPlayer · $${getUsdPrice(props.card.card_data.prices)}`
        : 'Buy on TCGPlayer',
      ...cardActionStyles.buy,
      to: getAffiliateLink(props.card.card_data.tcgplayer_id),
      target: '_blank',
      rel: 'noopener noreferrer',
    };
  }
  menu.similar = {
    ...findSimilarAction,
    onSelect: findSimilarCards,
  };
  if (isCommanderCardComputed.value) {
    menu.popular = {
      label: 'Popular Cards for this Commander',
      ...cardActionStyles.popularForCommander,
      onSelect: viewPopularCards,
    };
    menu.recommendations = {
      label: 'Get Deck Recommendations',
      ...cardActionStyles.recommendations,
      onSelect: getRecommendations,
    };
  }

  if (!props.isOwner) return menu;
  const copies = props.numCopies ?? 1;
  const copyActions = props.isDeckCommander
    ? []
    : [
        {
          label: 'Add a copy',
          group: 'copies' as const,
          icon: 'i-heroicons-plus',
          disabled: copies >= 100,
          onSelect() {
            emit(
              'updateNumCopies',
              props.card.card_data.name,
              copies + 1,
              currentBoard.value,
            );
          },
        },
        {
          label: 'Remove a copy',
          group: 'copies' as const,
          icon: 'i-lucide-minus',
          disabled: copies <= 1,
          onSelect() {
            emit(
              'updateNumCopies',
              props.card.card_data.name,
              copies - 1,
              currentBoard.value,
            );
          },
        },
        {
          label: 'Set Copies',
          group: 'copies' as const,
          icon: 'i-lucide-hash',
          onSelect() {
            showSetCopiesInput.value = true;
          },
        },
      ];

  const boardActions = (props.isDeckCommander ? [] : boardOptions)
    .filter((b) => b !== currentBoard.value)
    .map((b) => ({
      label: `Move to ${b}`,
      group: 'board' as const,
      icon:
        b === 'Mainboard'
          ? 'i-lucide-layout-grid'
          : b === 'Sideboard'
            ? 'i-lucide-columns-2'
            : 'i-lucide-help-circle',
      onSelect() {
        emit('changeBoard', props.card.card_data.name, b, currentBoard.value);
      },
    }));

  if (props.isDeckCommander)
    menu.commander = {
      label: 'Remove Commander',
      ...cardActionStyles.removeCommander,
      onSelect() {
        showClearCommanderModal.value = true;
      },
    };
  else if (isCommanderCardComputed.value)
    menu.commander = {
      label: 'Set as Commander',
      ...cardActionStyles.setCommander,
      onSelect() {
        showCommanderModal.value = true;
      },
    };

  const removeAction = props.isDeckCommander
    ? []
    : [
        {
          label: 'Remove',
          group: 'remove' as const,
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect() {
            emit('remove', props.card.card_data.oracle_id, currentBoard.value);
          },
        },
      ];

  menu.list = [...copyActions, ...boardActions, ...removeAction];
  return menu;
});

const legalityKey = computed(() => {
  return props.format ? formatToLegalityKey(props.format) : 'commander';
});

const formatLegality = computed(() => {
  return isLegal(
    props.card.card_data.legalities,
    legalityKey.value,
    props.legalityQuantity ?? props.numCopies ?? 1,
    props.card.card_data.type_line,
    props.card.card_data.oracle_text ??
      props.card.card_data.card_faces
        ?.map((face) => face.oracle_text)
        .join('\n'),
  );
});

const colorLegality = computed(() => {
  if (!props.commanderColorIdentity || props.isDeckCommander)
    return { legal: true };
  return isColorIdentityLegal(
    props.card.card_data.color_identity,
    props.commanderColorIdentity,
    props.card.card_data.type_line,
  );
});

const legalityWarning = computed(() => {
  if (!formatLegality.value.legal) return formatLegality.value.reason;
  if (!colorLegality.value.legal) return colorLegality.value.reason;
  return null;
});

const isEligibleCommander = computed(() => {
  return commanderQuery?.data.value?.has(props.card.card_data.name) ?? false;
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  const flippableLayouts = ['transform', 'modal_dfc', 'reversible_card'];
  return flippableLayouts.includes(cardData.layout);
});

function flipCard() {
  if (props.isFlipped === undefined) {
    // Uncontrolled mode: manage flip state internally
    isFlippedInternal.value = !isFlippedInternal.value;
  }
  emit('flip', props.card.card_data.id);
}

function confirmSetCommander() {
  emit('setCommander', props.card.card_data.name);
}

function confirmClearCommander() {
  emit('clearCommander', props.card.card_data.oracle_id);
}

function findSimilarCards() {
  if (!props.card) return;
  const queryParams = {
    card_name: props.card.card_name,
    filters: undefined,
    searchType: 'similarity',
  };
  router.push({ path: '/search/all/similarity', query: queryParams });
}

function getRecommendations() {
  if (!props.card?.card_data?.name) return;
  const commanderName = props.card.card_data.name;
  const decklist = props.decklistCardNames?.join('\n');
  const queryParams: Record<string, string> = { commander: commanderName };
  if (decklist) queryParams.decklist = decklist;
  saveSearchQuery('recommend', queryParams);
  router.push({ path: '/search/all/deckbuilder', query: queryParams });
  queueMicrotask(() => {
    saveSearchMutation.mutate({
      query: commanderName,
      searchType: 'recommend',
      filters: { commander: commanderName, decklist: decklist || undefined },
    });
  });
}

function viewPopularCards() {
  if (!props.card?.card_data?.name) return;
  const queryParams = { commander: props.card.card_data.name };
  saveSearchQuery('popular-by-commander', queryParams);
  router.push({ path: '/popular-by-commander/all', query: queryParams });
}

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}
</script>

<style scoped>
.card-root {
  max-width: 330px;
  width: 100%;
  margin: 0 auto;
  display: block;
  box-sizing: border-box;
  /* Reserve the image footprint before lazy images or offscreen content render. */
  aspect-ratio: 5 / 7;
  content-visibility: auto;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 7;
}

.card-large {
  aspect-ratio: 5/7;
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  border-radius: 14px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 5/7;
  width: 100%;
  background: linear-gradient(
    135deg,
    rgba(44, 44, 44, 0.9),
    rgba(66, 66, 66, 0.8)
  );
  border-radius: 10px;
  padding: 20px;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-top: 8px;
  text-align: center;
}

.legality-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 14px;
  z-index: 1;
  pointer-events: none;
}

.legality-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  max-width: 80%;
}

@media (hover: hover) and (pointer: fine) {
  .card-root:hover,
  .card-root:focus-within {
    /* Release paint containment so hover growth is not clipped. */
    content-visibility: visible;
  }
}
</style>

<style scoped>
progress {
  appearance: none;
  display: block;
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 0.5rem;
  overflow: hidden;
  border: 0;
  border-radius: 9999px;
  background: var(--ui-bg-accented);
}
progress::-webkit-progress-bar {
  background: var(--ui-bg-accented);
}
progress::-webkit-progress-value {
  background: var(--score-color);
  border-radius: 9999px;
}
progress::-moz-progress-bar {
  background: var(--score-color);
  border-radius: 9999px;
}
progress[data-color='success'] {
  --score-color: var(--ui-success);
}
progress[data-color='warning'] {
  --score-color: var(--ui-warning);
}
progress[data-color='error'] {
  --score-color: var(--ui-error);
}
</style>
