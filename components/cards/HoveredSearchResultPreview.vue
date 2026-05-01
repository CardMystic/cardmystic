<template>
  <UCard v-if="card" variant="subtle" class="preview-root" :ui="{ body: 'p-4' }">
    <LazyAddToDeckModal v-if="canShowDeckMenu" v-model:open="showAddToDeckModal" :card-ids="[card.card_data.id]" />

    <UModal v-model:open="showConfirmModal" title="Confirm Poor Result?"
      description="Please confirm if you believe this card does not match your search. We use your judgement to improve our models. Thank you for your feedback!"
      :ui="{ footer: 'justify-end' }">
      <template #footer="{ close }">
        <UButton label="Cancel" class="cursor-pointer" color="neutral" variant="outline" @click="close" />
        <UButton label="Yes, This is a Poor Result" class="cursor-pointer" color="error"
          @click="confirmDislike(close)" />
      </template>
    </UModal>

    <div class="preview-card-stack">
      <div class="preview-image-wrapper">
        <img :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
          class="preview-image cursor-pointer" loading="eager" decoding="async"
          @click="navigateToCard(card.card_data.id)" />
      </div>

      <div class="space-y-2">
        <div>
          <h3 class="preview-title">{{ card.card_data.name }}</h3>
          <p class="preview-subtitle">{{ simpleType }}</p>
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <UBadge v-if="isSearched" color="secondary" variant="subtle">Searched Card</UBadge>
          <UBadge v-if="isCommander" color="warning" variant="subtle">Commander</UBadge>
          <UBadge v-if="card.card_data.game_changer" color="primary" variant="subtle">Game Changer</UBadge>
        </div>

        <div v-if="!hideProgressBar" class="preview-scores">
          <template v-if="hasDualScores">
            <div class="preview-score-row">
              <span class="preview-score-label">AI</span>
              <UProgress :model-value="normalizedScore" class="flex-1" size="lg" :color="scoreColor" />
              <span class="preview-score-value">{{ Math.round(normalizedScore) }}%</span>
            </div>
            <div class="preview-score-row">
              <span class="preview-score-label">Deck</span>
              <UProgress :model-value="alsDisplayScore" class="flex-1" size="lg" :color="alsScoreColor" />
              <span class="preview-score-value">{{ Math.round(alsDisplayScore) }}%</span>
            </div>
          </template>
          <template v-else-if="hasAnyScore">
            <div class="preview-score-row">
              <span class="preview-score-label">{{ isAlsOnly ? 'Deck' : 'AI' }}</span>
              <UProgress :model-value="normalizedScore" class="flex-1" size="lg" :color="scoreColor" />
              <span class="preview-score-value">{{ Math.round(normalizedScore) }}%</span>
            </div>
          </template>
          <template v-if="hasPopularity">
            <div class="preview-score-row">
              <span class="preview-score-label">Pop</span>
              <UProgress :model-value="popularityPercent" class="flex-1" size="lg" :color="popularityColor" />
              <span class="preview-score-value">{{ popularityDisplay }}%</span>
            </div>
          </template>
        </div>
      </div>

      <HoveredCardActions :card="card" :buy-label="'Buy on TCGPlayer (' + priceLabel + ')'"
        :can-show-deck-menu="canShowDeckMenu" :find-similar-disabled="isSearched" :is-in-clipboard="isInClipboard"
        :is-dual-faced="isDualFaced" :show-commander-buttons="isCommander"
        :show-search-actions="!isSearched && (showAddToDeckbuilderButton || !hideThumbsDownButton)"
        :hide-thumbs-down-button="hideThumbsDownButton" :is-thumbs-down-clicked="isThumbsDownClicked"
        :show-add-to-deckbuilder-button="showAddToDeckbuilderButton" :is-in-decklist="isInDecklist"
        @find-similar="findSimilarCards" @open-add-to-deck="showAddToDeckModal = true"
        @toggle-clipboard="toggleClipboard" @flip-card="flipCard" @get-recommendations="getRecommendations"
        @view-popular-cards="viewPopularCards" @dislike="handleDislike"
        @add-to-deckbuilder="deckbuilderStore.addCard(card.card_data.name)" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import { getCardImageUrl } from '~/utils/scryfall';
import { useClipboard } from '~/composables/useClipboard';

const router = useRouter();
const route = useRoute();
const { saveCurrentSearchQuery, saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();
const deckbuilderStore = useDeckbuilder();
const clipboard = useClipboard();

const props = defineProps<{
  card: Card | null;
  queryParam: string | null;
  isCommander: boolean;
  isSearched?: boolean;
  hideProgressBar?: boolean;
  hideThumbsDownButton?: boolean;
  showAddToDeckbuilderButton?: boolean;
  isFlipped?: boolean; // Controlled flip state synced from the grid card
}>();

const emit = defineEmits<{
  (e: 'flip', cardId: string): void;
}>();
const isThumbsDownClicked = ref(false);
const showConfirmModal = ref(false);
const showAddToDeckModal = ref(false);
const hasMounted = ref(false);

const canShowDeckMenu = computed(() =>
  hasMounted.value && Boolean(props.card)
);

// Reset per-card transient state when the previewed card changes
watch(() => props.card?.card_data.id, () => {
  isThumbsDownClicked.value = false;
});

onMounted(() => {
  hasMounted.value = true;
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  return ['transform', 'modal_dfc', 'reversible_card'].includes(cardData.layout);
});

const isInDecklist = computed(() => {
  if (!props.card?.card_data?.name) return false;
  return deckbuilderStore.hasCard(props.card.card_data.name);
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

const hasDualScores = computed(() =>
  props.card?.als_score !== undefined && props.card?.ai_normalized_score !== undefined
);

const isAlsOnly = computed(() =>
  props.card?.als_score !== undefined && props.card?.ai_normalized_score === undefined
);

const hasAnyScore = computed(() =>
  props.card?.ai_normalized_score !== undefined || props.card?.als_score !== undefined
);

const primaryScore = computed(() => {
  if (props.card?.ai_normalized_score !== undefined) return props.card.ai_normalized_score;
  if (props.card?.als_score !== undefined) return props.card.als_score;
  return undefined;
});

function toDisplayPercent(score: number | undefined): number {
  if (score === undefined) return 0;
  return Math.min(Math.max(score * 100, 0), 100);
}

function scoreToColor(value: number) {
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'error';
}

const normalizedScore = computed(() => toDisplayPercent(primaryScore.value));
const alsDisplayScore = computed(() => toDisplayPercent(props.card?.als_score));
const hasPopularity = computed(() => props.card?.popularity !== undefined);
const popularityPercent = computed(() => toDisplayPercent(props.card?.popularity));
const popularityDisplay = computed(() => {
  if (popularityPercent.value < 1) return popularityPercent.value.toFixed(2);
  return Math.round(popularityPercent.value).toString();
});
const scoreColor = computed(() => scoreToColor(normalizedScore.value));
const alsScoreColor = computed(() => scoreToColor(alsDisplayScore.value));
const popularityColor = computed(() => scoreToColor(popularityPercent.value));

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
  if (props.card) emit('flip', props.card.card_data.id);
}

function toggleClipboard() {
  if (!clipboardCard.value) return;

  if (isInClipboard.value) {
    clipboard.remove(clipboardCard.value.id);
    return;
  }

  clipboard.add(clipboardCard.value);
}

function navigateToCard(cardId: string | undefined) {
  saveCurrentSearchQuery(route.query);
  if (!cardId) return;
  router.push(`/card/${cardId}`);
}

function handleDislike() {
  if (isThumbsDownClicked.value || !props.queryParam || !props.card?.card_data?.name) return;
  showConfirmModal.value = true;
}

function confirmDislike(close: () => void) {
  if (!props.queryParam || !props.card?.card_data?.name) return;
  isThumbsDownClicked.value = true;
  showConfirmModal.value = false;
  close();
  useCardFeedback().dislikeMutation.mutate({
    query: props.queryParam,
    cardName: props.card.card_data.name,
  });
}

function findSimilarCards() {
  if (!props.card) return;
  saveCurrentSearchQuery(route.query);
  router.push({
    path: '/search/all/similarity',
    query: {
      card_name: props.card.card_name,
      filters: undefined,
      searchType: 'similarity',
    },
  });
}

function getRecommendations() {
  const commanderName = props.card?.card_data?.name;
  if (!commanderName) return;
  const queryParams = { commander: commanderName };
  saveSearchQuery('recommend', queryParams);
  router.push({ path: '/search/all/deckbuilder', query: queryParams });
  queueMicrotask(() => {
    saveSearchMutation.mutate({
      query: commanderName,
      searchType: 'recommend',
      filters: { commander: commanderName },
    });
  });
}

function viewPopularCards() {
  if (!props.card?.card_data?.name) return;
  const queryParams = { commander: props.card.card_data.name };
  saveSearchQuery('popular-by-commander', queryParams);
  router.push({ path: '/popular-by-commander/all', query: queryParams });
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

.preview-scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-score-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-score-label {
  min-width: 2.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(160, 160, 160, 0.9);
}

.preview-score-value {
  min-width: 2.75rem;
  text-align: right;
  font-size: 0.85rem;
  font-weight: 700;
}
</style>