<template>
  <UCard v-if="card" variant="subtle" class="preview-root" :ui="{ body: 'p-4' }">
    <UModal v-model:open="showConfirmModal" title="Confirm Poor Result?"
      description="Please confirm if you believe this card does not match your search. We use your judgement to improve our models. Thank you for your feedback!"
      :ui="{ footer: 'justify-end' }">
      <template #footer="{ close }">
        <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
        <UButton label="Yes, This is a Poor Result" color="error" @click="confirmDislike(close)" />
      </template>
    </UModal>

    <div class="preview-card-stack">
      <div class="preview-image-wrapper">
        <img :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
          class="preview-image cursor-pointer" loading="eager" decoding="async"
          @click="navigateToCard(card.card_data.id)" />
        <ClipboardButton :card="card" :isDualFaced="isDualFaced" @flip="flipCard" />
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

      <div class="preview-actions">
        <UButton v-if="card.card_data.tcgplayer_id" :to="getAffiliateLink(card.card_data.tcgplayer_id)" external
          color="success" variant="solid" icon="i-heroicons-shopping-cart" size="lg" target="_blank"
          rel="noopener noreferrer" :label="'Buy on TCGPlayer (' + priceLabel + ')'" block />
        <UButton v-else :to="generateTCGPlayerSearchUrl(card.card_data.name)" external color="primary" variant="solid"
          icon="i-heroicons-magnifying-glass" size="lg" label="Search on TCGPlayer" block />
        <UButton color="neutral" variant="solid" icon="i-mdi-cards-outline" size="lg" label="Find Similar Cards" block
          :disabled="isSearched" @click="findSimilarCards" />
        <UButton v-if="isCommander" color="primary" variant="solid" icon="i-lucide-box" size="lg"
          label="Get Deck Recommendations" block @click="getRecommendations" />
        <UButton v-if="isCommander" color="error" variant="solid" icon="i-lucide-flame" size="lg"
          label="Popular Cards For Commander" block @click="viewPopularCards" />
      </div>

      <div v-if="!isSearched && (showAddToDeckbuilderButton || !hideThumbsDownButton)" class="preview-actions">
        <p class="preview-section-label">Search Actions</p>
        <UButton v-if="!hideThumbsDownButton" :color="isThumbsDownClicked ? 'error' : 'primary'" variant="outline"
          icon="i-lucide-thumbs-down" size="lg"
          :label="isThumbsDownClicked ? 'Feedback Submitted' : 'Mark As Poor Result'" block
          :disabled="isThumbsDownClicked" @click="handleDislike" />
        <UButton v-if="showAddToDeckbuilderButton" :color="isInDecklist ? 'success' : 'primary'" variant="outline"
          :icon="isInDecklist ? 'i-lucide-check' : 'i-lucide-layers-plus'" size="lg"
          :label="isInDecklist ? 'Added To Deckbuilder' : 'Add To Deckbuilder'" block
          @click="deckbuilderStore.addCard(card.card_data.name)" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import ClipboardButton from '~/components/clipboard/ClipboardButton.vue';
import { DefaultLimitSimilarity } from '~/models/searchModel';
import { getAffiliateLink, generateTCGPlayerSearchUrl } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';

const router = useRouter();
const route = useRoute();
const { saveCurrentSearchQuery, saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();
const deckbuilderStore = useDeckbuilder();

const props = defineProps<{
  card: Card | null;
  queryParam: string | null;
  isCommander: boolean;
  isSearched?: boolean;
  hideProgressBar?: boolean;
  hideThumbsDownButton?: boolean;
  showAddToDeckbuilderButton?: boolean;
}>();

const isFlipped = ref(false);
const isThumbsDownClicked = ref(false);
const showConfirmModal = ref(false);

// Reset per-card transient state when the previewed card changes
watch(() => props.card?.card_data.id, () => {
  isFlipped.value = false;
  isThumbsDownClicked.value = false;
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
  isFlipped.value = !isFlipped.value;
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
      limit: DefaultLimitSimilarity,
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