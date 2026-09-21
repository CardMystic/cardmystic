<template>
  <div class="card-root list-card">
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

    <div class="card-image-wrapper">
      <!-- Card image -->
      <NuxtLink
        :to="`/card/${card.card_data.oracle_id}`"
        no-prefetch
        class="block"
      >
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
          <p class="placeholder-text">{{ card.card_data.name }}</p>
        </div>
      </NuxtLink>

      <LazyCardOverlayButtons
        :card="card"
        :isDualFaced="isDualFaced"
        :show-flip-button="true"
        :show-menu-button="true"
        :show-copy-count="!isDeckCommander"
        :num-copies="numCopies ?? 1"
        :menu-items="cardOverlayMenuItems"
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
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
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
const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();

const props = defineProps<{
  card: Card;
  isDeckCommander: boolean;
  isCommanderCard?: boolean;
  isOwner?: boolean; // List actions (copies, boards, remove) are owner-only
  commanderColorIdentity?: string[] | null;
  numCopies?: number;
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

const cardOverlayMenuItems = computed<DropdownMenuItem[][]>(() => {
  const generalActions: DropdownMenuItem[] = [
    {
      label: 'Add to Deck',
      icon: 'i-lucide-library-big',
      onSelect() {
        showAddToDeckModal.value = true;
      },
    },
  ];

  if (props.card.card_data.tcgplayer_id) {
    generalActions.push({
      label: props.card.card_data.prices.usd
        ? `Buy on TCGPlayer · $${props.card.card_data.prices.usd}`
        : 'Buy on TCGPlayer',
      icon: 'i-heroicons-shopping-cart',
      to: getAffiliateLink(props.card.card_data.tcgplayer_id),
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  }
  generalActions.push({
    label: 'Find Similar Cards',
    icon: 'i-mdi-cards-outline',
    onSelect: findSimilarCards,
  });
  if (isCommanderCardComputed.value) {
    generalActions.push(
      {
        label: 'Popular Cards for this Commander',
        icon: 'i-lucide-flame',
        onSelect: viewPopularCards,
      },
      {
        label: 'Get Deck Recommendations',
        icon: 'i-lucide-box',
        onSelect: getRecommendations,
      },
    );
  }

  if (!props.isOwner) return [generalActions];
  const copies = props.numCopies ?? 1;
  const copyActions = props.isDeckCommander
    ? []
    : [
        {
          label: 'Add a copy',
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
          icon: 'i-lucide-hash',
          onSelect() {
            showSetCopiesInput.value = true;
          },
        },
      ];

  const boardActions = boardOptions
    .filter((b) => b !== currentBoard.value)
    .map((b) => ({
      label: `Move to ${b}`,
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

  const commanderActions = props.isDeckCommander
    ? [
        {
          label: 'Remove Commander',
          icon: 'i-lucide-crown',
          onSelect() {
            showClearCommanderModal.value = true;
          },
        },
      ]
    : isCommanderCardComputed.value
      ? [
          {
            label: 'Set as Commander',
            icon: 'i-lucide-crown',
            onSelect() {
              showCommanderModal.value = true;
            },
          },
        ]
      : [];

  const removeAction = [
    {
      label: 'Remove',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect() {
        emit('remove', props.card.card_data.oracle_id, currentBoard.value);
      },
    },
  ];

  return [
    generalActions,
    copyActions,
    boardActions,
    commanderActions,
    removeAction,
  ].filter((group) => group.length > 0);
});

const legalityKey = computed(() => {
  return props.format ? formatToLegalityKey(props.format) : 'commander';
});

const formatLegality = computed(() => {
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
  height: 100%;
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

  .card-root .card-image-wrapper img {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-root .card-image-wrapper:hover img {
    transform: scale(1.03);
  }
}
</style>
