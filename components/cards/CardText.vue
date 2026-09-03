<template>
  <div
    class="card-text-row"
    :class="{
      'commander-row': isDeckCommander,
      'illegal-row': legalityWarning,
      'searched-row': isSearched,
    }"
    role="group"
    :aria-label="`${displayName}, ${numCopies ?? 1} copies`"
    @mouseenter="emit('partner-hover', 0)"
    @mouseleave="emit('partner-hover', 0)"
  >
    <LazyAddToDeckModal
      v-if="canShowDeckMenu"
      v-model:open="showAddToDeckModal"
      :oracle-ids="[card.card_data.oracle_id]"
    />

    <SetCommanderModal
      :open="showCommanderModal"
      :card-name="card.card_data.name"
      @update:open="showCommanderModal = $event"
      @confirm="confirmSetCommander"
    />
    <RemoveCommanderModal
      :open="showClearCommanderModal"
      :card-name="card.card_data.name"
      @update:open="showClearCommanderModal = $event"
      @confirm="confirmClearCommander"
    />
    <SetCopiesModal
      :open="showSetCopiesInput"
      :card-name="card.card_data.name"
      :initial-copies="numCopies ?? 1"
      @update:open="showSetCopiesInput = $event"
      @confirm="confirmSetCopies"
    />

    <UModal
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

    <span class="copy-count" :title="`${numCopies ?? 1} copies`">
      {{ numCopies ?? 1 }}
    </span>

    <div class="min-w-0 flex-1 flex items-center gap-1.5">
      <button
        type="button"
        class="card-name"
        @click="navigateToCard(card.card_data.oracle_id)"
        @mouseenter="emit('partner-hover', 0)"
        @focus="emit('partner-hover', 0)"
      >
        {{ displayName }}
      </button>

      <template v-if="card.partner_card_data">
        <span class="text-muted text-xs">+</span>
        <button
          type="button"
          class="card-name partner-name"
          @click="navigateToCard(card.partner_card_data.oracle_id)"
          @mouseenter="emit('partner-hover', 1)"
          @focus="emit('partner-hover', 1)"
        >
          {{ card.partner_card_data.name }}
        </button>
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

    <UDropdownMenu :items="menuItems">
      <UButton
        class="card-options cursor-pointer shrink-0"
        icon="i-lucide-circle-chevron-down"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        aria-label="Card options"
        @click.stop
      />
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
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
import { useClipboard } from '~/composables/useClipboard';

type Board = 'Mainboard' | 'Sideboard' | 'Considering';

const props = withDefaults(
  defineProps<{
    card: Card;
    isDeckCommander?: boolean;
    isCommanderCard?: boolean;
    isCommander?: boolean;
    isOwner?: boolean;
    commanderColorIdentity?: string[] | null;
    numCopies?: number;
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
const clipboard = useClipboard();
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
    props.numCopies ?? 1,
    props.card.card_data.type_line,
    props.card.card_data.oracle_text,
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

const clipboardCard = computed(() => ({
  id: props.card.card_data.id,
  oracleId: props.card.card_data.oracle_id,
  name: props.card.card_data.name,
  set: props.card.card_data.set,
  imageUrl: getCardImageUrl(props.card.card_data),
  price: props.card.card_data.prices?.usd || '0',
}));
const isInClipboard = computed(() => clipboard.has(clipboardCard.value.id));

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

  if (props.card.ai_normalized_score !== undefined) {
    const score = toDisplayPercent(props.card.ai_normalized_score);
    indicators.push({
      label: 'Vector score',
      tooltip: 'Vector score: how relevant this card is to your query',
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
    return props.card.card_data.prices?.usd || null;

  let total = 0;
  let hasPrice = false;
  for (const card of [props.card.card_data, props.card.partner_card_data]) {
    const price = Number.parseFloat(card.prices?.usd ?? '');
    if (Number.isNaN(price)) continue;
    total += price;
    hasPrice = true;
  }
  return hasPrice ? total.toFixed(2) : null;
});

const genericActions = computed(() => {
  const actions: Record<string, unknown>[] = [
    {
      label: 'View Card',
      icon: 'i-lucide-external-link',
      onSelect: () => navigateToCard(props.card.card_data.oracle_id),
    },
  ];

  if (!props.isSearched) {
    actions.push({
      label: 'Find Similar',
      icon: 'i-mdi-cards-outline',
      onSelect: findSimilarCards,
    });
  }

  if (isCommanderCardComputed.value) {
    actions.push(
      {
        label: 'Recommend Cards',
        icon: 'i-lucide-box',
        onSelect: getRecommendations,
      },
      {
        label: 'Popular Cards',
        icon: 'i-lucide-flame',
        onSelect: viewPopularCards,
      },
    );
  }

  if (canShowDeckMenu.value) {
    actions.push({
      label: 'Add to Deck',
      icon: 'i-lucide-library-big',
      onSelect: () => {
        showAddToDeckModal.value = true;
      },
    });
  }

  actions.push({
    label: isInClipboard.value ? 'Remove from Clipboard' : 'Add to Clipboard',
    icon: isInClipboard.value ? 'i-lucide-check' : 'i-lucide-copy',
    onSelect: toggleClipboard,
  });

  if (isDualFaced.value) {
    actions.push({
      label: isFlipped.value ? 'Show Front Face' : 'Show Back Face',
      icon: 'i-lucide-refresh-cw',
      onSelect: flipCard,
    });
  }

  const tcgplayerId = buyTcgplayerId.value;
  if (tcgplayerId) {
    actions.push({
      label: buyPrice.value ? `Buy ($${buyPrice.value})` : 'Buy on TCGPlayer',
      icon: 'i-lucide-shopping-cart',
      to: getAffiliateLink(tcgplayerId),
      target: '_blank',
    });
  }

  return actions;
});

const searchActions = computed(() => {
  const actions: Record<string, unknown>[] = [];
  if (props.showAddToDeckbuilderButton && deckbuilderStore) {
    actions.push({
      label: isInDecklist.value
        ? 'Added to Deckbuilding Search'
        : 'Add to Deckbuilding Search',
      icon: isInDecklist.value ? 'i-lucide-check' : 'i-lucide-layers-plus',
      disabled: isInDecklist.value,
      onSelect: () => deckbuilderStore.addCard(props.card.card_data.name),
    });
  }
  if (props.showCardInfo && !props.isSearched && !props.hideThumbsDownButton) {
    actions.push({
      label: isThumbsDownClicked.value
        ? 'Feedback Submitted'
        : 'Disagree with this Result',
      icon: 'i-lucide-thumbs-down',
      disabled: isThumbsDownClicked.value,
      onSelect: handleDislike,
    });
  }
  return actions;
});

const ownerActions = computed(() => {
  if (!props.isOwner) return [];
  const copies = props.numCopies ?? 1;
  const actions: Record<string, unknown>[] = [];

  if (!props.isDeckCommander) {
    actions.push(
      {
        label: 'Add a Copy',
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
        icon: 'i-lucide-hash',
        onSelect: () => {
          showSetCopiesInput.value = true;
        },
      },
    );
  }

  for (const board of boardOptions) {
    if (board === currentBoard.value) continue;
    actions.push({
      label: `Move to ${board}`,
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
    actions.push({
      label: 'Remove as Commander',
      icon: 'i-lucide-crown',
      onSelect: () => {
        showClearCommanderModal.value = true;
      },
    });
  } else if (isCommanderCardComputed.value) {
    actions.push({
      label: 'Set as Commander',
      icon: 'i-lucide-crown',
      onSelect: () => {
        showCommanderModal.value = true;
      },
    });
  }

  actions.push({
    label: 'Remove Card',
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: () =>
      emit('remove', props.card.card_data.oracle_id, currentBoard.value),
  });
  return actions;
});

const menuItems = computed(() =>
  [genericActions.value, searchActions.value, ownerActions.value].filter(
    (group) => group.length > 0,
  ),
);

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
function navigateToCard(cardId: string | undefined) {
  if (route.path.startsWith('/search/')) saveCurrentSearchQuery(route.query);
  if (cardId) router.push(`/card/${cardId}`);
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
function toggleClipboard() {
  if (isInClipboard.value) {
    clipboard.remove(clipboardCard.value.id);
    return;
  }
  clipboard.add(clipboardCard.value);
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
