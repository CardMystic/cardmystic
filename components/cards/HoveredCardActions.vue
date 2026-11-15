<template>
  <div class="grid gap-2">
    <CardActionList
      :oracle-id="card.card_data.oracle_id"
      :actions="menu"
      preview
      @view-card="emit('viewCard')"
      @select="(action) => action.onSelect?.()"
    />
  </div>
  <UButton
    v-bind="suggestDecksAction"
    variant="outline"
    block
    @click="showSuggestions = true"
  />
  <LazyCardActionsModal
    v-if="showSuggestions"
    v-model:open="showSuggestions"
    :card="card"
    :actions="menu"
    @view-card="emit('viewCard')"
    :board="board"
    :is-flipped="isFlipped"
    suggest-decks
    @flip="emit('flip')"
  />
</template>

<script setup lang="ts">
const deckbuilder = useDeckbuilder();
import {
  cardActionStyles,
  findSimilarAction,
  suggestDecksAction,
  type CardAction,
  type CardActionMenu,
} from '~/utils/card-actions';
import type { Card } from '~/models/cardModel';
import {
  getAffiliateLink,
  generateTCGPlayerSearchUrl,
} from '~/utils/tcgPlayer';

type Board = 'Mainboard' | 'Sideboard' | 'Considering';

const props = withDefaults(
  defineProps<{
    card: Card;
    board?: string;
    isFlipped?: boolean;
    buyLabel: string;
    canShowDeckMenu?: boolean;
    findSimilarDisabled?: boolean;
    isListCard?: boolean;
    showCommanderButtons?: boolean;
    showListActions?: boolean;
    numCopies?: number;
    availableBoards?: Board[];
    showSetCommander?: boolean;
    showClearCommander?: boolean;
    showEditCopiesButtons?: boolean;
    showSearchActions?: boolean;
    hideThumbsDownButton?: boolean;
    isThumbsDownClicked?: boolean;
    showAddToDeckbuilderButton?: boolean;
    isInDecklist?: boolean;
  }>(),
  {
    board: 'Search results',
    isFlipped: false,
    canShowDeckMenu: false,
    findSimilarDisabled: false,
    isListCard: false,
    showCommanderButtons: false,
    showListActions: false,
    numCopies: 1,
    availableBoards: () => [],
    showSetCommander: false,
    showClearCommander: false,
    showEditCopiesButtons: true,
    showSearchActions: false,
    hideThumbsDownButton: false,
    isThumbsDownClicked: false,
    showAddToDeckbuilderButton: false,
    isInDecklist: false,
  },
);

const emit = defineEmits<{
  (e: 'viewCard'): void;
  (e: 'flip'): void;
  (e: 'findSimilar'): void;
  (e: 'openAddToDeck'): void;
  (e: 'getRecommendations'): void;
  (e: 'viewPopularCards'): void;
  (e: 'addCopy'): void;
  (e: 'removeCopy'): void;
  (e: 'setCopies'): void;
  (e: 'changeBoard', board: Board): void;
  (e: 'setCommander'): void;
  (e: 'clearCommander'): void;
  (e: 'removeFromList'): void;
  (e: 'dislike'): void;
  (e: 'addToDeckbuilder'): void;
}>();

const listActions = computed<CardAction[]>(() => [
  ...(props.showEditCopiesButtons
    ? [
        {
          label: 'Add a copy',
          group: 'copies' as const,
          icon: 'i-heroicons-plus',
          disabled: props.numCopies >= 100,
          onSelect: () => emit('addCopy'),
        },
        {
          label: 'Remove a copy',
          group: 'copies' as const,
          icon: 'i-lucide-minus',
          disabled: props.numCopies <= 1,
          onSelect: () => emit('removeCopy'),
        },
        {
          label: 'Set Copies',
          group: 'copies' as const,
          icon: 'i-lucide-hash',
          onSelect: () => emit('setCopies'),
        },
      ]
    : []),
  ...(props.showClearCommander ? [] : props.availableBoards).map((board) => ({
    label: `Move to ${board}`,
    group: 'board' as const,
    icon: boardIcon(board),
    onSelect: () => emit('changeBoard', board),
  })),
  ...(props.showClearCommander
    ? []
    : [
        {
          label: 'Remove From List',
          group: 'remove' as const,
          onSelect: () => emit('removeFromList'),
        },
      ]),
]);

const showSuggestions = ref(false);
const menu = computed<CardActionMenu>(() => {
  const data = props.card.card_data;
  const actions: CardActionMenu = {
    marketplace: {
      label: data.tcgplayer_id ? props.buyLabel : 'Search on TCGPlayer',
      ...(data.tcgplayer_id
        ? cardActionStyles.buy
        : cardActionStyles.searchMarketplace),
      to: data.tcgplayer_id
        ? getAffiliateLink(data.tcgplayer_id)
        : generateTCGPlayerSearchUrl(data.name),
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    similar: {
      ...findSimilarAction,
      disabled: props.findSimilarDisabled,
      onSelect: () => emit('findSimilar'),
    },
  };
  if (props.canShowDeckMenu)
    actions.addToDeck = {
      label: props.isListCard ? 'Add to Another Deck' : 'Add to Deck',
      ...cardActionStyles.addToDeck,
      onSelect: () => emit('openAddToDeck'),
    };
  if (props.showCommanderButtons) {
    actions.recommendations = {
      label: 'Get Deck Recommendations',
      ...cardActionStyles.recommendations,
      onSelect: () => emit('getRecommendations'),
    };
    actions.popular = {
      label: 'Popular Cards For Commander',
      ...cardActionStyles.popularForCommander,
      onSelect: () => emit('viewPopularCards'),
    };
  }
  if (props.showListActions) actions.list = listActions.value;
  if (props.showListActions && props.showSetCommander)
    actions.commander = {
      label: 'Set As Commander',
      ...cardActionStyles.setCommander,
      onSelect: () => emit('setCommander'),
    };
  if (props.showListActions && props.showClearCommander)
    actions.commander = {
      label: 'Remove Commander',
      ...cardActionStyles.removeCommander,
      onSelect: () => emit('clearCommander'),
    };
  if (props.showSearchActions && !props.hideThumbsDownButton)
    actions.feedback = {
      label: props.isThumbsDownClicked
        ? 'Feedback Submitted'
        : 'Mark As Poor Result',
      ...cardActionStyles.feedback(props.isThumbsDownClicked),
      disabled: props.isThumbsDownClicked,
      onSelect: () => emit('dislike'),
    };
  if (props.showSearchActions && props.showAddToDeckbuilderButton)
    actions.addToSearch = {
      label: deckbuilder.selectedDeckId.value
        ? props.isInDecklist
          ? 'Added to deck'
          : 'Add to deck'
        : props.isInDecklist
          ? 'Added to search'
          : 'Add to search',
      ...cardActionStyles.addToSearch(props.isInDecklist),
      disabled:
        props.isInDecklist ||
        deckbuilder.pendingCards.value.length > 0 ||
        (!!deckbuilder.selectedDeckId.value &&
          !deckbuilder.savedDeckReady.value),
      onSelect: () => emit('addToDeckbuilder'),
    };
  return actions;
});

function boardIcon(board: Board) {
  if (board === 'Mainboard') return 'i-lucide-layout-grid';
  if (board === 'Sideboard') return 'i-lucide-columns-2';
  return 'i-lucide-help-circle';
}
</script>
