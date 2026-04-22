<template>
  <UCard v-if="card" variant="outline" class="preview-root" :ui="{ body: 'p-4' }">
    <UModal v-model:open="showCommanderModal" title="Set Commander">
      <template #body>
        <p class="text-sm">
          Set <span class="font-bold">{{ card.card_data.name }}</span> as your commander?
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
          <UButton label="Set Commander" color="primary" icon="i-lucide-crown" @click="confirmSetCommander(close)" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showClearCommanderModal" title="Remove Commander">
      <template #body>
        <p class="text-sm">
          Remove <span class="font-bold">{{ card.card_data.name }}</span> as your commander?
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
          <UButton label="Remove Commander" color="error" icon="i-lucide-crown" @click="confirmClearCommander(close)" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showSetCopiesInput" title="Set Copies">
      <template #body>
        <p class="text-sm mb-3">How many copies of <span class="font-bold">{{ card.card_data.name }}</span>?</p>
        <UInput v-model="setCopiesInputValue" type="number" min="1" max="100" autofocus @keyup.enter="confirmSetCopies"
          @keyup.escape="showSetCopiesInput = false" />
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
          <UButton label="Set Copies" color="primary" icon="i-lucide-hash" @click="confirmSetCopies" />
        </div>
      </template>
    </UModal>

    <div class="preview-card-stack">
      <div class="preview-image-wrapper">
        <img :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
          class="preview-image cursor-pointer" loading="eager" decoding="async"
          @click="navigateToCard(card.card_data.id)" />
        <ClipboardButton :card="card" :isDualFaced="isDualFaced" @flip="flipCard" />
        <span v-if="!isDeckCommander" class="copy-count-pill">x{{ numCopies ?? 1 }}</span>
      </div>

      <div class="space-y-2">
        <div>
          <h3 class="preview-title">{{ card.card_data.name }}</h3>
          <p class="preview-subtitle">{{ simpleType }}</p>
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <UBadge color="neutral" variant="subtle">{{ currentBoard }}</UBadge>
          <UBadge v-if="isDeckCommander" color="warning" variant="subtle">Commander</UBadge>
          <UBadge v-else-if="isCommanderCardComputed" color="primary" variant="subtle">Commander Eligible</UBadge>
          <UBadge v-if="format" color="neutral" variant="outline">{{ format }}</UBadge>
        </div>

        <p v-if="priceLabel" class="preview-price">{{ priceLabel }}</p>
      </div>

      <div class="preview-actions">
        <UButton v-if="card.card_data.tcgplayer_id" :to="getAffiliateLink(card.card_data.tcgplayer_id)" external
          color="success" variant="solid" icon="i-heroicons-shopping-cart" size="lg" target="_blank"
          rel="noopener noreferrer" label="Buy on TCGPlayer" block />
        <UButton v-else :to="generateTCGPlayerSearchUrl(card.card_data.name)" external color="primary" variant="outline"
          icon="i-heroicons-magnifying-glass" size="lg" label="Search on TCGPlayer" block />
        <UButton color="neutral" variant="outline" icon="i-mdi-cards-outline" size="lg" label="Find Similar Cards" block
          @click="findSimilarCards" />
        <UButton v-if="isCommanderCardComputed" color="primary" variant="outline" icon="i-lucide-box" size="lg"
          label="Get Deck Recommendations" block @click="getRecommendations" />
        <UButton v-if="isCommanderCardComputed" color="error" variant="outline" icon="i-lucide-flame" size="lg"
          label="Popular Cards For Commander" block @click="viewPopularCards" />
      </div>

      <div class="preview-actions">
        <p class="preview-section-label">List Actions</p>
        <div v-if="!isDeckCommander" class="grid grid-cols-2 gap-2">
          <UButton color="neutral" variant="outline" icon="i-lucide-plus" label="Add Copy"
            :disabled="(numCopies ?? 1) >= 100"
            @click="emit('updateNumCopies', card.card_data.name, (numCopies ?? 1) + 1)" />
          <UButton color="neutral" variant="outline" icon="i-lucide-minus" label="Remove Copy"
            :disabled="(numCopies ?? 1) <= 1"
            @click="emit('updateNumCopies', card.card_data.name, (numCopies ?? 1) - 1)" />
        </div>
        <UButton v-if="!isDeckCommander" color="neutral" variant="outline" icon="i-lucide-hash" label="Set Copies" block
          @click="openSetCopiesModal" />
        <UButton v-for="boardOption in availableBoards" :key="boardOption" color="neutral" variant="outline"
          :icon="boardIcon(boardOption)" :label="`Move to ${boardOption}`" block
          @click="emit('changeBoard', card.card_data.name, boardOption)" />
        <UButton v-if="isCommanderCardComputed && !isDeckCommander" color="warning" variant="outline"
          icon="i-lucide-crown" label="Set As Commander" block @click="showCommanderModal = true" />
        <UButton v-if="isDeckCommander" color="warning" variant="outline" icon="i-lucide-crown" label="Remove Commander"
          block @click="showClearCommanderModal = true" />
        <UButton color="error" variant="outline" icon="i-lucide-trash-2" label="Remove From List" block
          @click="emit('remove', card.card_data.id)" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import ClipboardButton from '~/components/clipboard/ClipboardButton.vue';
import { DefaultLimitSimilarity } from '~/models/searchModel';
import { useSearchType } from '~/composables/useSearchType';
import { useSearchHistory } from '~/composables/useSearchHistory';
import { useCommandersSet } from '~/composables/useBulkData';
import { getAffiliateLink, generateTCGPlayerSearchUrl } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';

const router = useRouter();
const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();
const { data: commanders } = useCommandersSet();

const props = defineProps<{
  card: Card | null;
  isDeckCommander: boolean;
  isCommanderCard?: boolean;
  numCopies?: number;
  board?: string;
  format?: string;
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
const showClearCommanderModal = ref(false);
const showSetCopiesInput = ref(false);
const setCopiesInputValue = ref('');

const boardOptions = ['Mainboard', 'Sideboard', 'Considering'] as const;

const currentBoard = computed(() => (props.board as typeof boardOptions[number]) || 'Mainboard');

const availableBoards = computed(() => boardOptions.filter(board => board !== currentBoard.value));

const isCommanderCardComputed = computed(() => {
  if (!props.card) return false;
  if (props.isCommanderCard !== undefined) return props.isCommanderCard;
  return commanders.value?.has(props.card.card_data.name) ?? false;
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  return ['transform', 'modal_dfc', 'reversible_card'].includes(cardData.layout);
});

const simpleType = computed(() => {
  const typeLine = props.card?.card_data.type_line;
  if (!typeLine) return 'Unknown';
  const faces = typeLine.split('//');
  if (faces.length === 1) return faces[0].split(' — ')[0].trim();
  return `${faces[0].split(' — ')[0].trim()} // ${faces[1].split(' — ')[0].trim()}`;
});

const priceLabel = computed(() => {
  const prices = props.card?.card_data.prices;
  if (!prices) return '';
  if (prices.usd) return `$${prices.usd}`;
  if (prices.usd_foil) return `$${prices.usd_foil} foil`;
  if (prices.eur) return `EUR ${prices.eur}`;
  return '';
});

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function openSetCopiesModal() {
  setCopiesInputValue.value = String(props.numCopies ?? 1);
  showSetCopiesInput.value = true;
}

function confirmSetCopies() {
  if (!props.card) return;
  const nextValue = parseInt(setCopiesInputValue.value, 10);
  if (!Number.isNaN(nextValue) && nextValue >= 1 && nextValue <= 100) {
    emit('updateNumCopies', props.card.card_data.name, nextValue);
  }
  showSetCopiesInput.value = false;
}

function confirmSetCommander(close: () => void) {
  if (!props.card) return;
  emit('setCommander', props.card.card_data.name);
  close();
}

function confirmClearCommander(close: () => void) {
  if (!props.card) return;
  emit('clearCommander', props.card.card_data.id);
  close();
}

function boardIcon(board: 'Mainboard' | 'Sideboard' | 'Considering') {
  if (board === 'Mainboard') return 'i-lucide-layout-grid';
  if (board === 'Sideboard') return 'i-lucide-columns-2';
  return 'i-lucide-help-circle';
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
      limit: DefaultLimitSimilarity,
    },
  });
}

function getRecommendations() {
  if (!props.card?.card_data.name) return;
  const queryParams = { commander: props.card.card_data.name };
  saveSearchQuery('recommend', queryParams);
  saveSearchMutation.mutate({
    query: props.card.card_data.name,
    searchType: 'recommend',
    filters: { commander: props.card.card_data.name },
  });
  router.push({ path: '/search/all/deckbuilder', query: queryParams });
}

function viewPopularCards() {
  if (!props.card?.card_data.name) return;
  router.push({ path: '/popular-by-commander/all', query: { commander: props.card.card_data.name } });
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
}

.copy-count-pill {
  position: absolute;
  top: 14px;
  left: 14px;
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

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-section-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(160, 160, 160, 0.9);
}
</style>