<template>
  <UCard v-if="card" variant="outline" class="preview-root" :ui="{ body: 'p-4' }">
    <LazyAddToDeckModal v-if="canShowDeckMenu" v-model:open="showAddToDeckModal" :card-ids="[card.card_data.id]" />

    <SetCommanderModal :open="showCommanderModal" :card-name="card.card_data.name"
      @update:open="showCommanderModal = $event" @confirm="confirmSetCommander" />

    <RemoveCommanderModal :open="showClearCommanderModal" :card-name="card.card_data.name"
      @update:open="showClearCommanderModal = $event" @confirm="confirmClearCommander" />

    <SetCopiesModal :open="showSetCopiesInput" :card-name="card.card_data.name" :initial-copies="numCopies ?? 1"
      @update:open="showSetCopiesInput = $event" @confirm="confirmSetCopies" />

    <div class="preview-card-stack">
      <div class="preview-image-wrapper">
        <img :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
          class="preview-image cursor-pointer" loading="eager" decoding="async"
          @click="navigateToCard(card.card_data.id)" />
        <span v-if="!isCommanderOfDecklist" class="copy-count-pill">x{{ numCopies ?? 1 }}</span>
      </div>

      <div class="space-y-2">
        <div>
          <h3 class="preview-title">{{ card.card_data.name }}</h3>
          <p class="preview-subtitle">{{ simpleType }}</p>
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <UBadge color="neutral" variant="subtle">{{ currentBoard }}</UBadge>
        </div>
      </div>

      <HoveredCardActions :card="card"
        :buy-label="card.card_data.prices.usd ? `Buy on TCGPlayer ($${card.card_data.prices.usd})` : 'Buy on TCGPlayer'"
        :can-show-deck-menu="canShowDeckMenu" :is-in-clipboard="isInClipboard" :is-dual-faced="isDualFaced"
        :show-commander-buttons="isCommanderCardComputed" :show-list-actions="true" :num-copies="numCopies ?? 1"
        :available-boards="availableBoards" :show-set-commander="isCommanderCardComputed && !isCommanderOfDecklist"
        :show-clear-commander="isCommanderOfDecklist" :show-edit-copies-buttons="!isCommanderOfDecklist"
        @find-similar="findSimilarCards" @open-add-to-deck="showAddToDeckModal = true"
        @toggle-clipboard="toggleClipboard" @flip-card="flipCard" @get-recommendations="getRecommendations"
        @view-popular-cards="viewPopularCards"
        @add-copy="emit('updateNumCopies', card.card_data.name, (numCopies ?? 1) + 1)"
        @remove-copy="emit('updateNumCopies', card.card_data.name, (numCopies ?? 1) - 1)"
        @set-copies="openSetCopiesModal" @change-board="handleChangeBoard" @set-commander="showCommanderModal = true"
        @clear-commander="showClearCommanderModal = true" @remove-from-list="emit('remove', card.card_data.id)" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import { useSearchType } from '~/composables/useSearchType';
import { useSearchHistory } from '~/composables/useSearchHistory';
import { useCommandersSet } from '~/composables/useBulkData';
import { useClipboard } from '~/composables/useClipboard';
import { getCardImageUrl } from '~/utils/scryfall';

const router = useRouter();
const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();
const { data: commanders } = useCommandersSet();
const clipboard = useClipboard();

const props = defineProps<{
  card: Card | null;
  isCommanderOfDecklist: boolean; // Whether this card is the commander of the deck list
  canBeACommander?: boolean; // Whether this card CAN be a commander of a deck list
  numCopies?: number;
  board?: string;
  showEditCopiesButtons?: boolean;
  decklistCardNames?: string[]; // Full decklist for pre-filling the deckbuilder
}>();

const emit = defineEmits<{
  (e: 'remove', cardId: string): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
  (e: 'updateNumCopies', cardName: string, numCopies: number): void;
  (e: 'changeBoard', cardName: string, board: 'Mainboard' | 'Sideboard' | 'Considering'): void;
}>();

const isFlipped = ref(false);
const showCommanderModal = ref(false);
const showAddToDeckModal = ref(false);
const hasMounted = ref(false);

const canShowDeckMenu = computed(() =>
  hasMounted.value && Boolean(props.card)
);

// Reset flip state when the previewed card changes
watch(() => props.card?.card_data.id, () => {
  isFlipped.value = false;
});

onMounted(() => {
  hasMounted.value = true;
});
const showClearCommanderModal = ref(false);
const showSetCopiesInput = ref(false);

const boardOptions = ['Mainboard', 'Sideboard', 'Considering'] as const;

const currentBoard = computed(() => (props.board as typeof boardOptions[number]) || 'Mainboard');

const availableBoards = computed(() => boardOptions.filter(board => board !== currentBoard.value));

const isCommanderCardComputed = computed(() => {
  if (!props.card) return false;
  if (props.canBeACommander !== undefined) return props.canBeACommander;
  return commanders.value?.has(props.card.card_data.name) ?? false;
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  return ['transform', 'modal_dfc', 'reversible_card'].includes(cardData.layout);
});

const clipboardCard = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData) return null;

  return {
    id: cardData.id || '',
    name: cardData.name || '',
    set: cardData.set || '',
    imageUrl: getCardImageUrl(cardData),
    price: cardData.prices?.usd || '0',
  };
});

const isInClipboard = computed(() => {
  if (!clipboardCard.value) return false;
  return clipboard.has(clipboardCard.value.id);
});

const simpleType = computed(() => {
  const typeLine = props.card?.card_data.type_line;
  if (!typeLine) return 'Unknown';
  const faces = typeLine.split('//');
  if (faces.length === 1) return faces[0].split(' — ')[0].trim();
  return `${faces[0].split(' — ')[0].trim()} // ${faces[1].split(' — ')[0].trim()}`;
});

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function toggleClipboard() {
  if (!clipboardCard.value) return;

  if (isInClipboard.value) {
    clipboard.remove(clipboardCard.value.id);
    return;
  }

  clipboard.add(clipboardCard.value);
}

function openSetCopiesModal() {
  showSetCopiesInput.value = true;
}

function confirmSetCopies(nextValue: number) {
  if (!props.card) return;
  emit('updateNumCopies', props.card.card_data.name, nextValue);
}

function confirmSetCommander() {
  if (!props.card) return;
  emit('setCommander', props.card.card_data.name);
}

function confirmClearCommander() {
  if (!props.card) return;
  emit('clearCommander', props.card.card_data.id);
}

function navigateToCard(cardId: string | undefined) {
  if (!cardId) return;
  router.push(`/card/${cardId}`);
}

function findSimilarCards() {
  if (!props.card) return;
  router.push({
    path: '/search/all/similarity',
    query: {
      card_name: props.card.card_data.name,
    },
  });
}

function getRecommendations() {
  const commanderName = props.card?.card_data.name;
  if (!commanderName) return;
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
  if (!props.card?.card_data.name) return;
  const queryParams = { commander: props.card.card_data.name };
  saveSearchQuery('popular-by-commander', queryParams);
  router.push({ path: '/popular-by-commander/all', query: queryParams });
}

function handleChangeBoard(board: 'Mainboard' | 'Sideboard' | 'Considering') {
  if (!props.card) return;
  emit('changeBoard', props.card.card_data.name, board);
}
</script>

<style scoped>
.preview-root {
  width: 100%;
}

.preview-card-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-image-wrapper {
  position: relative;
}

.preview-image {
  width: 100%;
  aspect-ratio: 5 / 7;
  object-fit: cover;
  border-radius: 16px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-image-wrapper:hover .preview-image {
  transform: scale(1.03);
}

.copy-count-pill {
  position: absolute;
  top: 45px;
  left: 22px;
  padding: 3px 10px;
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  background: rgba(0, 0, 0, 0.68);
  border-radius: 999px;
}

.preview-title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
}

.preview-subtitle {
  font-size: 0.9rem;
  color: rgba(160, 160, 160, 0.95);
}

.preview-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(120, 200, 120, 0.95);
}
</style>