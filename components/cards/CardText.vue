<template>
  <div
    class="card-text-row relative"
    :class="{
      'commander-row': isDeckCommander,
      'illegal-row': legalityWarning,
      'searched-row': isSearched,
    }"
    role="group"
    :aria-label="`${displayName}, ${numCopies ?? 1} copies`"
    :aria-description="highlight.status.value ?? undefined"
    @mouseenter="emit('partner-hover', 0)"
    @mouseleave="emit('partner-hover', 0)"
  >
    <span
      v-if="highlight.status.value"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-10 rounded-md"
      :class="highlight.classes.value"
    />
    <LazyAddToDeckModal
      v-if="canShowDeckMenu && showAddToDeckModal"
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
    <LazyRemoveCommanderModal
      v-if="showClearCommanderModal"
      :open="showClearCommanderModal"
      :card-name="card.card_data.name"
      @update:open="showClearCommanderModal = $event"
      @confirm="confirmClearCommander"
    />
    <LazySetCopiesModal
      v-if="showSetCopiesInput"
      :open="showSetCopiesInput"
      :card-name="card.card_data.name"
      :initial-copies="numCopies ?? 1"
      @update:open="showSetCopiesInput = $event"
      @confirm="confirmSetCopies"
    />

    <UModal
      v-if="showConfirmModal"
      v-model:open="showConfirmModal"
      title="Confirm Poor Result?"
      description="Please confirm if you believe this card does not match your search. We use your feedback to improve our models."
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer="{ close }">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="close"
        />
        <UButton
          label="Yes, This is a Poor Result"
          color="error"
          @click="confirmDislike"
        />
      </template>
    </UModal>

    <CardTagCheckbox
      :oracle-id="card.card_data.oracle_id"
      :name="card.card_data.name"
      class="relative z-20 mr-1"
    />
    <span class="copy-count" :title="`${numCopies ?? 1} copies`">
      {{ numCopies ?? 1 }}
    </span>

    <div class="min-w-0 flex-1 flex items-center gap-1.5">
      <button
        type="button"
        aria-haspopup="dialog"
        :aria-expanded="showActions"
        class="card-name"
        :disabled="printingPending"
        @click="showActions = true"
        @mouseenter="emit('partner-hover', 0)"
        @focus="emit('partner-hover', 0)"
      >
        {{ displayName }}
      </button>

      <template v-if="card.partner_card_data">
        <span class="text-muted text-xs">+</span>
        <NuxtLink
          :to="`/card/${card.partner_card_data.oracle_id}`"
          no-prefetch
          class="card-name partner-name"
          @click="rememberSearch"
          @mouseenter="emit('partner-hover', 1)"
          @focus="emit('partner-hover', 1)"
        >
          {{ card.partner_card_data.name }}
        </NuxtLink>
      </template>

      <UTooltip v-if="isDeckCommander" text="Commander">
        <UIcon
          name="i-lucide-crown"
          class="size-3.5 shrink-0 text-warning"
          aria-label="Commander"
        />
      </UTooltip>

      <UTooltip v-if="legalityWarning" :text="legalityWarning">
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-4 shrink-0 text-warning"
          :aria-label="legalityWarning"
        />
      </UTooltip>
      <UTooltip v-if="card.card_data.game_changer" text="Game Changer">
        <UIcon
          name="i-lucide-sparkles"
          class="size-3.5 shrink-0 text-primary"
          aria-label="Game Changer"
        />
      </UTooltip>
    </div>

    <ManaCost
      v-if="displayManaCost"
      :mana-cost="displayManaCost"
      role="img"
      :aria-label="`Casting cost ${displayManaCost}`"
      class="mana-cost shrink-0"
    />

    <div v-if="scoreIndicators.length" class="score-indicators">
      <UTooltip
        v-for="indicator in scoreIndicators"
        :key="indicator.label"
        :text="indicator.tooltip"
      >
        <span class="score-indicator" :class="`score-${indicator.tone}`">
          <UIcon :name="indicator.icon" class="size-3" />
          {{ indicator.display }}%
        </span>
      </UTooltip>
    </div>

    <DeckCardMetadata v-if="isListCard" :card="card.card_data" :face="displayedFace" text-view class="basis-full" />
    <DeckCardLabels v-if="isListCard" :oracle-id="card.card_data.oracle_id" class="basis-full" />
    <LazyCardActionsModal
      v-if="showActions"
      v-model:open="showActions"
      :is-flipped="isFlipped"
      @flip="flipCard"
      :card="card"
      :actions="menuItems"
      @view-card="rememberSearch"
      :board="isListCard ? currentBoard : 'Search results'"
    />
  </div>
</template>

<script setup lang="ts">
import { getUsdPrice } from '~/utils/cardPrice';
const highlight = useDeckHighlight(() => props.card.card_data);
import type { Card } from '~/models/cardModel';
import { cardActionStyles, findSimilarAction, type CardAction, type CardActionMenu } from '~/utils/card-actions';
const showActions = ref(false);
import { getAffiliateLink } from '~/utils/tcgPlayer';
import {
  isLegal,
  isColorIdentityLegal,
  formatToLegalityKey,
} from '~/utils/legality';
import { useCommandersSet } from '~/composables/useBulkData';
import { useSearchType } from '~/composables/useSearchType';
import { useSearchHistory } from '~/composables/useSearchHistory';

type Board = 'Mainboard' | 'Sideboard' | 'Considering';

const props = withDefaults(
  defineProps<{
    card: Card;
    printingPending?: boolean;
    isDeckCommander?: boolean;
    isCommanderCard?: boolean;
    isCommander?: boolean;
    isOwner?: boolean;
    isListCard?: boolean;
    commanderColorIdentity?: string[] | null;
    numCopies?: number;
    legalityQuantity?: number;
    board?: Board | string;
    format?: string;
    decklistCardNames?: string[];
    isFlipped?: boolean;
    showCardInfo?: boolean;
    isSearched?: boolean;
    hideProgressBar?: boolean;
    hideThumbsDownButton?: boolean;
    showAddToDeckbuilderButton?: boolean;
  }>(),
  {
    isDeckCommander: false,
    isOwner: false,
    board: 'Mainboard',
    showCardInfo: false,
    isSearched: false,
    hideProgressBar: false,
    hideThumbsDownButton: false,
    showAddToDeckbuilderButton: false,
  },
);

const emit = defineEmits<{
  (e: 'remove', cardId: string, fromBoard: Board): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
  (
    e: 'updateNumCopies',
    cardName: string,
    numCopies: number,
    fromBoard: Board,
  ): void;
  (e: 'changeBoard', cardName: string, board: Board, fromBoard: Board): void;
  (e: 'flip', cardId: string): void;
  (e: 'partner-hover', index: 0 | 1): void;
}>();

const router = useRouter();
const route = useRoute();
const { saveCurrentSearchQuery, saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();
const { data: commanders } = useCommandersSet();
const cardFeedback = props.showCardInfo ? useCardFeedback() : null;

const deckbuilderStore = props.showAddToDeckbuilderButton
  ? useDeckbuilder()
  : null;

const boardOptions = ['Mainboard', 'Sideboard', 'Considering'] as const;
const currentBoard = ref<Board>((props.board as Board) || 'Mainboard');
const isFlippedInternal = ref(false);
const showCommanderModal = ref(false);
const showClearCommanderModal = ref(false);
const showSetCopiesInput = ref(false);
const showAddToDeckModal = ref(false);
const showConfirmModal = ref(false);
const isThumbsDownClicked = ref(false);
const hasMounted = ref(false);

onMounted(() => {
  hasMounted.value = true;
});

watch(
  () => props.board,
  (value) => {
    currentBoard.value = (value as Board) || 'Mainboard';
  },
);

const isFlipped = computed(() =>
  props.isFlipped !== undefined ? props.isFlipped : isFlippedInternal.value,
);

const isDualFaced = computed(() => {
  const cardData = props.card.card_data;
  return (
    (cardData.card_faces?.length ?? 0) > 1 &&
    ['transform', 'modal_dfc', 'reversible_card'].includes(cardData.layout)
  );
});

const displayedFace = computed(() => {
  if (!isDualFaced.value) return undefined;
  if (!isFlipped.value) return props.card.card_data.card_faces?.[0];
  return props.card.card_data.card_faces?.[1];
});

const displayName = computed(
  () => displayedFace.value?.name ?? props.card.card_data.name,
);
const displayManaCost = computed(
  () => displayedFace.value?.mana_cost ?? props.card.card_data.mana_cost,
);

const isEligibleCommander = computed(() => {
  const name = props.card.card_data.name;
  return !!commanders.value?.has(name);
});

const isCommanderCardComputed = computed(
  () => props.isCommander || props.isCommanderCard || isEligibleCommander.value,
);

const legalityKey = computed(() =>
  props.format ? formatToLegalityKey(props.format) : null,
);
const formatLegality = computed(() => {
  if (!legalityKey.value) return { legal: true };
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

const canShowDeckMenu = computed(() => hasMounted.value);
const isInDecklist = computed(
  () => !!deckbuilderStore?.hasCard(props.card.card_data.name),
);

function toDisplayPercent(score: number | undefined): number {
  if (score === undefined) return 0;
  return Math.min(Math.max(score * 100, 0), 100);
}

function scoreTone(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
}

const scoreIndicators = computed(() => {
  if (props.hideProgressBar || props.isSearched) return [];
  const indicators: Array<{
    label: string;
    tooltip: string;
    icon: string;
    display: string;
    tone: 'success' | 'warning' | 'error';
  }> = [];

  const semanticScore =
    props.card.ai_rerank_score ?? props.card.ai_normalized_score;
  if (semanticScore !== undefined) {
    const score = toDisplayPercent(semanticScore);
    const label =
      props.card.ai_rerank_score != null ? 'Rerank score' : 'Vector score';
    indicators.push({
      label,
      tooltip: `${label}: how relevant this card is to your query`,
      icon: 'i-lucide-brain',
      display: Math.round(score).toString(),
      tone: scoreTone(score),
    });
  }
  if (props.card.als_score !== undefined) {
    const score = toDisplayPercent(props.card.als_score);
    indicators.push({
      label: 'Synergy score',
      tooltip: 'Synergy score: how relevant this card is to your decklist',
      icon: 'i-lucide-layers-2',
      display: Math.round(score).toString(),
      tone: scoreTone(score),
    });
  }
  if (props.card.popularity !== undefined) {
    const score = toDisplayPercent(props.card.popularity);
    indicators.push({
      label: 'Popularity',
      tooltip: `In ${score.toFixed(2)}% of decks that match your filters`,
      icon: 'i-lucide-flame',
      display: score < 1 ? score.toFixed(2) : Math.round(score).toString(),
      tone: scoreTone(score),
    });
  }
  return indicators;
});

const buyTcgplayerId = computed(
  () =>
    props.card.card_data.tcgplayer_id ??
    props.card.partner_card_data?.tcgplayer_id,
);
const buyPrice = computed(() => {
  if (!props.card.partner_card_data)
    return getUsdPrice(props.card.card_data.prices) || null;

  let total = 0;
  let hasPrice = false;
  for (const card of [props.card.card_data, props.card.partner_card_data]) {
    const price = Number.parseFloat(getUsdPrice(card.prices) ?? '');
    if (Number.isNaN(price)) continue;
    total += price;
    hasPrice = true;
  }
  return hasPrice ? total.toFixed(2) : null;
});

const menuItems = computed<CardActionMenu>(() => {
  const menu: CardActionMenu = {};

  if (!props.isSearched) {
    menu.similar = {
      ...findSimilarAction,
      onSelect: findSimilarCards,
    };
  }

  if (isCommanderCardComputed.value) {
    menu.recommendations = {
      label: 'Recommend Cards',
      ...cardActionStyles.recommendations,
      onSelect: getRecommendations,
    };
    menu.popular = {
      label: 'Popular Cards',
      ...cardActionStyles.popularForCommander,
      onSelect: viewPopularCards,
    };
  }

  if (canShowDeckMenu.value) {
    menu.addToDeck = {
      label: props.isListCard ? 'Add to Another Deck' : 'Add to Deck',
      ...cardActionStyles.addToDeck,
      onSelect: () => {
        showAddToDeckModal.value = true;
      },
    };
  }

  const tcgplayerId = buyTcgplayerId.value;
  if (tcgplayerId) {
    menu.marketplace = {
      label: buyPrice.value ? `Buy ($${buyPrice.value})` : 'Buy on TCGPlayer',
      ...cardActionStyles.buy,
      to: getAffiliateLink(tcgplayerId),
      target: '_blank',
    };
  }

  if (props.showAddToDeckbuilderButton && deckbuilderStore) {
    menu.addToSearch = {
      label: deckbuilderStore.selectedDeckId.value
        ? isInDecklist.value
          ? 'Added to deck'
          : 'Add to deck'
        : isInDecklist.value
          ? 'Added to search'
          : 'Add to search',
      ...cardActionStyles.addToSearch(isInDecklist.value),
      disabled:
        isInDecklist.value ||
        deckbuilderStore.pendingCards.value.includes(
          props.card.card_data.name,
        ) ||
        (!!deckbuilderStore.selectedDeckId.value &&
          !deckbuilderStore.savedDeckReady.value),
      onSelect: () => deckbuilderStore.addCard(props.card.card_data.name),
    };
  }
  if (props.showCardInfo && !props.isSearched && !props.hideThumbsDownButton) {
    menu.feedback = {
      label: isThumbsDownClicked.value
        ? 'Feedback Submitted'
        : 'Disagree with this Result',
      ...cardActionStyles.feedback(isThumbsDownClicked.value),
      disabled: isThumbsDownClicked.value,
      onSelect: handleDislike,
    };
  }

  if (!props.isOwner) return menu;
  const copies = props.numCopies ?? 1;
  const actions: CardAction[] = [];

  if (!props.isDeckCommander) {
    actions.push(
      {
        label: 'Add a Copy',
        group: 'copies' as const,
        icon: 'i-heroicons-plus',
        disabled: copies >= 100,
        onSelect: () =>
          emit(
            'updateNumCopies',
            props.card.card_data.name,
            copies + 1,
            currentBoard.value,
          ),
      },
      {
        label: 'Remove a Copy',
        group: 'copies' as const,
        icon: 'i-lucide-minus',
        disabled: copies <= 1,
        onSelect: () =>
          emit(
            'updateNumCopies',
            props.card.card_data.name,
            copies - 1,
            currentBoard.value,
          ),
      },
      {
        label: 'Set Copies',
        group: 'copies' as const,
        icon: 'i-lucide-hash',
        onSelect: () => {
          showSetCopiesInput.value = true;
        },
      },
    );
  }

  for (const board of props.isDeckCommander ? [] : boardOptions) {
    if (board === currentBoard.value) continue;
    actions.push({
      label: `Move to ${board}`,
      group: 'board' as const,
      icon:
        board === 'Mainboard'
          ? 'i-lucide-layout-grid'
          : board === 'Sideboard'
            ? 'i-lucide-columns-2'
            : 'i-lucide-help-circle',
      onSelect: () =>
        emit(
          'changeBoard',
          props.card.card_data.name,
          board,
          currentBoard.value,
        ),
    });
  }

  if (props.isDeckCommander) {
    menu.commander = {
      label: 'Remove as Commander',
      ...cardActionStyles.removeCommander,
      onSelect: () => {
        showClearCommanderModal.value = true;
      },
    };
  } else if (isCommanderCardComputed.value) {
    menu.commander = {
      label: 'Set as Commander',
      ...cardActionStyles.setCommander,
      onSelect: () => {
        showCommanderModal.value = true;
      },
    };
  }

  if (!props.isDeckCommander)
    actions.push({
      label: 'Remove Card',
      group: 'remove' as const,
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () =>
        emit('remove', props.card.card_data.oracle_id, currentBoard.value),
    });
  menu.list = actions;
  return menu;
});

function confirmSetCopies(numCopies: number) {
  emit(
    'updateNumCopies',
    props.card.card_data.name,
    numCopies,
    currentBoard.value,
  );
}
function confirmSetCommander() {
  emit('setCommander', props.card.card_data.name);
}
function confirmClearCommander() {
  emit('clearCommander', props.card.card_data.oracle_id);
}
function flipCard() {
  if (props.isFlipped === undefined)
    isFlippedInternal.value = !isFlippedInternal.value;
  emit('flip', props.card.card_data.id);
}
function rememberSearch() {
  if (route.path.startsWith('/search/')) saveCurrentSearchQuery(route.query);
}

function findSimilarCards() {
  if (route.path.startsWith('/search/')) saveCurrentSearchQuery(route.query);
  router.push({
    path: '/search/all/similarity',
    query: {
      card_name: props.card.card_name,
      searchType: 'similarity',
    },
  });
}
function getRecommendations() {
  const commanderName = props.card.card_data.name;
  const decklist = props.decklistCardNames?.join('\n');
  const query: Record<string, string> = { commander: commanderName };
  if (decklist) query.decklist = decklist;
  saveSearchQuery('recommend', query);
  router.push({ path: '/search/all/deckbuilder', query });
  queueMicrotask(() => {
    saveSearchMutation.mutate({
      query: commanderName,
      searchType: 'recommend',
      filters: { commander: commanderName, decklist: decklist || undefined },
    });
  });
}
function viewPopularCards() {
  const query = { commander: props.card.card_data.name };
  saveSearchQuery('popular-by-commander', query);
  router.push({ path: '/popular-by-commander/all', query });
}
function handleDislike() {
  if (isThumbsDownClicked.value) return;
  showConfirmModal.value = true;
}
function confirmDislike() {
  showConfirmModal.value = false;
  const searchQuery = String(route.query.query ?? route.query.card_name ?? '');
  if (!searchQuery) return;
  isThumbsDownClicked.value = true;
  cardFeedback?.dislikeMutation.mutate({
    query: searchQuery,
    cardName: props.card.card_data.name,
  });
}
</script>

<style scoped>
.card-text-row {
  min-height: 2.25rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.375rem;
  background: var(--ui-bg);
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 0.375rem;
  transition:
    background-color 120ms ease,
    border-color 120ms ease;
}

.card-text-row:hover,
.card-text-row:focus-within {
  background: var(--ui-bg-elevated);
  outline: none;
}

.card-text-row:has(> dl) {
  flex-wrap: wrap;
}

.commander-row {
  border: 1px solid#eab308;
}

.illegal-row {
  border: 1px solid#ef4444;
}

.searched-row {
  border-color: color-mix(in srgb, var(--ui-primary) 45%, transparent);
}

.copy-count {
  width: 1.5rem;
  flex: 0 0 1.5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
}

.card-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text-highlighted);
  cursor: pointer;
}

.card-name:hover,
.card-name:focus-visible {
  color: var(--ui-primary);
  text-decoration: underline;
  outline: none;
}

.partner-name {
  flex-shrink: 1;
}

.mana-cost {
  font-size: 0.875rem;
  line-height: 1;
}

.score-indicators {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.score-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.score-success {
  color: var(--ui-success);
}

.score-warning {
  color: var(--ui-warning);
}

.score-error {
  color: var(--ui-error);
}

.card-options {
  opacity: 0.7;
}

.card-text-row:hover .card-options,
.card-text-row:focus-within .card-options {
  opacity: 1;
}
</style>
