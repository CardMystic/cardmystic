<template>
  <UCard variant="subtle"
    :class="['card-root', isDeckCommander ? 'dark:bg-[#3a3520] bg-[#fef3c7] commander-card-bg' : '', legalityWarning ? 'illegal-card-bg' : '']"
    :ui="{ body: 'p-1 sm:p-2' }">

    <SetCommanderModal :open="showCommanderModal" :card-name="card.card_data.name"
      @update:open="showCommanderModal = $event" @confirm="confirmSetCommander" />

    <SetCopiesModal :open="showSetCopiesInput" :card-name="card.card_data.name" :initial-copies="numCopies ?? 1"
      @update:open="showSetCopiesInput = $event" @confirm="confirmSetCopies" />

    <RemoveCommanderModal :open="showClearCommanderModal" :card-name="card.card_data.name"
      @update:open="showClearCommanderModal = $event" @confirm="confirmClearCommander" />

    <div class="card-image-wrapper">
      <!-- Card image -->
      <img :class="'card-large'" :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
        @error="handleImageError" v-if="getCardImageUrl(card.card_data, isFlipped)" loading="lazy" decoding="async"
        @click="navigateToCard(card.card_data.id)" class="cursor-pointer" />
      <div v-else class="image-placeholder">
        <p class="placeholder-text">{{ card.card_data.name }}</p>
      </div>

      <LazyCardOverlayButtons :card="card" :isDualFaced="isDualFaced" :show-menu-button="true"
        :show-copy-count="!isDeckCommander" :num-copies="numCopies ?? 1" :menu-items="cardOverlayMenuItems"
        @flip="flipCard" />

      <!-- Legality Warning Overlay -->
      <div v-if="legalityWarning" class="legality-overlay">
        <div class="legality-overlay-content">
          <UIcon name="i-lucide-triangle-alert" class="text-amber-400" size="28" />
          <span class="text-xs text-amber-400 text-center font-medium leading-tight">{{ legalityWarning }}</span>
        </div>
      </div>
    </div>

    <!-- Card Name and mana cost -->
    <div class="flex flex-col items-center justify-center text-center mt-1">

      <!-- Action Buttons -->
      <div class="flex flex-row items-center text-center w-full">
        <!-- Buy on TCGPlayer -->
        <UTooltip text="Buy on TCGPlayer" :popper="{ placement: 'top' }">
          <UButton v-if="card.card_data.tcgplayer_id" :to="getAffiliateLink(card.card_data.tcgplayer_id)" external
            color="success" variant="outline" class="mt-1 mr-2" icon="i-heroicons-shopping-cart" size="sm"
            target="_blank" rel="noopener noreferrer" aria-label="Buy on TCGPlayer">
            {{ card.card_data.prices.usd ? `$${card.card_data.prices.usd}` : 'Buy' }}
          </UButton>
        </UTooltip>

        <!-- Similarity search -->
        <UTooltip text="Search for similar cards" :popper="{ placement: 'top' }">
          <UButton color="neutral" variant="outline" class="mt-1 mr-2 cursor-pointer" icon="i-mdi-cards-outline"
            size="sm" @click="findSimilarCards" aria-label="Find Similar Cards" />
        </UTooltip>

        <!-- Commander-card buttons -->
        <template v-if="isCommanderCardComputed">
          <UTooltip text="Get Deck Recommendations" :popper="{ placement: 'top' }">
            <UButton color="primary" variant="outline" class="mt-1 mr-2 cursor-pointer" icon="i-lucide-box" size="sm"
              @click="getRecommendations" aria-label="Get Deck Recommendations for this Commander" />
          </UTooltip>
          <UTooltip text="Popular Cards for this Commander" :popper="{ placement: 'top' }">
            <UButton color="error" variant="outline" class="mt-1 mr-2 cursor-pointer" icon="i-lucide-flame" size="sm"
              @click="viewPopularCards" aria-label="Popular Cards for this Commander" />
          </UTooltip>
        </template>
      </div>

    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';
import { isLegal, isColorIdentityLegal, formatToLegalityKey } from '~/utils/legality';
import { useCommandersSet } from '~/composables/useBulkData';
import { useSearchType } from '~/composables/useSearchType';
import { useSearchHistory } from '~/composables/useSearchHistory';

const router = useRouter();
const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();

const { data: commanders } = useCommandersSet();

const props = defineProps<{
  card: Card;
  isDeckCommander: boolean;
  isCommanderCard?: boolean;
  commanderColorIdentity?: string[] | null;
  numCopies?: number;
  board?: string;
  format?: string;
  decklistCardNames?: string[]; // Full decklist for pre-filling the deckbuilder
}>();

const emit = defineEmits<{
  (e: 'remove', cardId: string): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
  (e: 'updateNumCopies', cardName: string, numCopies: number): void;
  (e: 'changeBoard', cardName: string, board: 'Mainboard' | 'Sideboard' | 'Considering'): void;
  (e: 'flip', cardId: string): void;
}>();

const isFlipped = ref(false);
const showCommanderModal = ref(false);
const showClearCommanderModal = ref(false);
const showSetCopiesInput = ref(false);

function confirmSetCopies(numCopies: number) {
  emit('updateNumCopies', props.card.card_data.name, numCopies);
}

const boardOptions = ['Mainboard', 'Sideboard', 'Considering'] as const;
type Board = typeof boardOptions[number];
const currentBoard = ref<Board>((props.board as Board) || 'Mainboard');

watch(() => props.board, (val) => {
  currentBoard.value = (val as Board) || 'Mainboard';
});

const isCommanderCardComputed = computed(() => {
  if (props.isCommanderCard !== undefined) return props.isCommanderCard;
  return isEligibleCommander.value;
});

const cardOverlayMenuItems = computed(() => {
  const copies = props.numCopies ?? 1;
  const copyActions = props.isDeckCommander ? [] : [
    {
      label: 'Add a copy',
      icon: 'i-lucide-plus',
      disabled: copies >= 100,
      onSelect() {
        emit('updateNumCopies', props.card.card_data.name, copies + 1);
      },
    },
    {
      label: 'Remove a copy',
      icon: 'i-lucide-minus',
      disabled: copies <= 1,
      onSelect() {
        emit('updateNumCopies', props.card.card_data.name, copies - 1);
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
    .filter(b => b !== currentBoard.value)
    .map(b => ({
      label: `Move to ${b}`,
      icon: b === 'Mainboard' ? 'i-lucide-layout-grid' : b === 'Sideboard' ? 'i-lucide-columns-2' : 'i-lucide-help-circle',
      onSelect() {
        emit('changeBoard', props.card.card_data.name, b);
      },
    }));

  const commanderActions = isCommanderCardComputed.value && !props.isDeckCommander
    ? [{
      label: 'Set as Commander',
      icon: 'i-lucide-crown',
      onSelect() {
        showCommanderModal.value = true;
      },
    }]
    : [];

  const removeAction = [{
    label: 'Remove',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect() {
      emit('remove', props.card.card_data.id);
    },
  }];

  return [copyActions, boardActions, commanderActions, removeAction].filter(g => g.length > 0);
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
  if (!props.commanderColorIdentity || props.isDeckCommander) return { legal: true };
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
  if (!commanders.value || commanders.value.size === 0) return false;
  const name = props.card.card_data.name;
  return commanders.value.has(name);
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  const flippableLayouts = ['transform', 'modal_dfc', 'reversible_card'];
  return flippableLayouts.includes(cardData.layout);
});

function flipCard() {
  isFlipped.value = !isFlipped.value;
  emit('flip', props.card.card_data.id);
}

function confirmSetCommander() {
  emit('setCommander', props.card.card_data.name);
}

function confirmClearCommander() {
  emit('clearCommander', props.card.card_data.id);
}

function navigateToCard(cardId: string | undefined) {
  if (!cardId) return;
  router.push(`/card/${cardId}`);
}

function findSimilarCards() {
  if (!props.card) return;
  const queryParams = {
    card_name: props.card.card_name,
    filters: undefined,
    searchType: 'similarity'
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
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.card-large {
  aspect-ratio: 5/7;
  width: 100%;
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
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8));
  border-radius: 10px;
  padding: 20px;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-top: 8px;
  text-align: center;
}

.manacost-text {
  font-size: 14px;
}

.commander-card-bg {
  border: 1.5px solid rgba(234, 179, 8, 0.4);
}

.illegal-card-bg {
  background: #3a2020 !important;
  border: 1.5px solid rgba(239, 68, 68, 0.3);
}

.legality-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 14px;
  z-index: 3;
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

.card-image-wrapper img {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-image-wrapper:hover img {
  transform: scale(1.03);
}
</style>
