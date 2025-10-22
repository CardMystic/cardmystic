<template>
  <UCard variant="subtle" :class="['card-root', isSearched ? 'searched-card-bg' : '']" :ui="{ body: 'p-4 sm:p-4' }">
    <div class="card-image-wrapper">
      <!-- Card content: image + score -->
      <img :class="sizeClass" :src="getCardImageUrl(card.card_data)" :alt="card.card_data.name"
        @error="handleImageError" v-if="getCardImageUrl(card.card_data)" loading="lazy" decoding="async" :ui="{}"
        @click="navigateToCard(card.card_data.id)" class="cursor-pointer" />
      <div v-else class="image-placeholder">
        <p class="placeholder-text">{{ card.card_data.name }}</p>
      </div>

      <ClipboardButton v-if="showCardInfo" :card="card" />

      <!-- Score Bar -->
      <div class="mt-1 flex flex-row items-center justify-center text-center w-full">
        <UProgress v-if="!isSearched" v-model="normalizedScore" class="my-0 mr-2" size="md" />
        <p v-if="!isSearched" class="text-xs">
          {{ props.card.score !== undefined
            ? props.isSimilaritySearch
              ? `${normalizedScore.toFixed(2)}%`
              : normalizedScore.toFixed(2) + '%'
            : 'N/A' }}
        </p>
      </div>
    </div>

    <!-- Card Name and mana cost -->
    <div class="flex flex-col items-center justify-center text-center">

      <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full">
        <p class="whitespace-nowrap overflow-hidden truncate">
          {{ card.card_data.name.split(' // ')[0] }}
        </p>
        <ManaCost v-if="card.card_data.mana_cost" :manaCost="card.card_data.mana_cost.split(' // ')[0]"
          class="manacost-text whitespace-nowrap" />
      </div>
      <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full text-xs">
        <p class="whitespace-nowrap overflow-hidden truncate">
          <span
            :style="getSimpleCardType(card.card_data.type_line).toLowerCase().startsWith('legendary') ? 'color: orange;' : ''">
            {{ getSimpleCardType(card.card_data.type_line) ?? "N/A" }}
          </span>
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-row items-center justify-between text-center w-full">

        <!-- Left side buttons-->
        <div class="flex flex-row items-center">
          <!-- Buy on TCGPlayer button -->
          <UTooltip text="Buy on TCGPlayer" :popper="{ placement: 'top' }">
            <template #default>
              <UButton v-if="showCardInfo && card.card_data.tcgplayer_id"
                :to="getAffiliateLink(card.card_data.tcgplayer_id)" external color="success" variant="solid"
                class="mt-1 mr-2" icon="i-heroicons-shopping-cart" size="sm" target="_blank" rel="noopener noreferrer"
                aria-label="Buy on TCGPlayer">
                {{
                  card.card_data.prices.usd ? `$${card.card_data.prices.usd}` :
                    'Buy' }}
              </UButton>
            </template>
          </UTooltip>
          <!-- Similarity search button -->
          <UTooltip text="Search for similar cards" :popper="{ placement: 'top' }">
            <template #default>
              <UButton v-if="showCardInfo && !isSearched" color="neutral" variant="solid"
                class="mt-1 mr-2 cursor-pointer" icon="i-mdi-cards-outline" size="sm" @click="findSimilarCards"
                aria-label="Find Similar Cards">
              </UButton>
            </template>
          </UTooltip>
        </div>

        <!-- Right side buttons -->
        <div v-if="!isSearched && showCardInfo" class="flex flex-row items-center gap-2">

          <!-- Thumbs down button -->
          <UTooltip text="I disagree with this result!" :popper="{ placement: 'top' }">
            <template #default>
              <UButton class="cursor-pointer" :color="isThumbsDownClicked ? 'error' : 'primary'" variant="soft"
                icon="i-lucide-thumbs-down" size="sm" aria-label="Disagree with this result"
                @click="isThumbsDownClicked = !isThumbsDownClicked" />
            </template>
          </UTooltip>
        </div>
        <UButton v-if="isDev && showCardInfo" color="warning" variant="outline" class="ml-2" size="xs"
          @click="toggleShowAllData">
          {{ showAllData ? 'Hide Data' : 'Show Data' }}
        </UButton>
      </div>
    </div>
  </UCard>
  <div v-if="isDev && showAllData" class="card-data mt-2">
    <pre>
    {{ JSON.stringify(card.card_data, null, 2) }}
  </pre>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
import type { Card } from '~/models/cardModel';
import { useRouter } from 'vue-router';
import { DefaultLimitSimilarity } from '~/models/searchModel';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';
import ClipboardButton from '~/components/ClipboardButton.vue';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  size: {
    type: String as PropType<'small' | 'large'>,
    default: 'large',
  },
  // Optional normalization context - if provided, use this instead of search store
  normalizationContext: {
    type: Array as PropType<number[]>,
    default: undefined,
  },
  // If true, treat score as 0-1 range for similarity search
  isSimilaritySearch: {
    type: Boolean,
    default: false,
  },
  showCardInfo: {
    type: Boolean,
    default: false,
  },
  isSearched: {
    type: Boolean,
    default: false,
  },
});

const sizeClass = computed(() => `card-${props.size}`);

const isThumbsDownClicked = ref(false);

// Navigation helper
function navigateToCard(cardId: string | undefined) {
  // Save current search query to sessionStorage
  if (route.query.searchType == 'ai') {
    sessionStorage.setItem('ai_search_query', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'commander') {
    sessionStorage.setItem('commander_search_query', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'similarity') {
    sessionStorage.setItem('similarity_search_card_name', JSON.stringify(route.query));
  }

  if (!cardId) {
    console.warn('Cannot navigate to card: ID is undefined');
    return;
  }
  router.push(`/card/${cardId}`);
}

function getSimpleCardType(type_line: string): string {
  if (!type_line) return 'Unknown';
  const faces = type_line.split('//');

  if (faces.length === 1) {
    // Single-faced card: get type before em-dash
    return faces[0].split(' — ')[0].trim();
  } else {
    // Double-faced card: get type before em-dash for both faces
    const frontType = faces[0].split(' — ')[0].trim();
    const backType = faces[1].split(' — ')[0].trim();
    return `${frontType} // ${backType}`;
  }
}

function normalizeScore(score: number | undefined): number {
  if (score === undefined) {
    return 0; // Default to 0 if score is undefined
  }

  // For similarity search, treat score as 0-1 range and convert to percentage
  if (props.isSimilaritySearch) {
    return Math.min(Math.max(score * 100, 0), 100);
  }

  // Use provided normalization context if available, otherwise fall back to search store
  const allScores =
    props.normalizationContext ||
    [props.card.score || 0];

  // If no context available, return score as-is (assume it's already normalized)
  if (allScores.length === 0) {
    return score;
  }

  const highestScore = Math.max(...allScores);

  // Default range is 30-5, but expand max if scores exceed 30
  const maxScore = Math.max(30, highestScore);
  const minScore = maxScore - 25; // Always 25 points below max

  // Clamp the score to the calculated range
  const clampedScore = Math.min(Math.max(score, minScore), maxScore);

  // Convert to 0-100 percentage
  const normalizedScore =
    ((clampedScore - minScore) / (maxScore - minScore)) * 100;

  return normalizedScore;
}

const normalizedScore = computed(() => normalizeScore(props.card.score));

function findSimilarCards() {
  if (!props.card) return;

  // Save current search query to sessionStorage
  if (route.query.searchType == 'ai') {
    sessionStorage.setItem('ai_search_query', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'commander') {
    sessionStorage.setItem('commander_search_query', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'similarity') {
    sessionStorage.setItem('similarity_search_card_name', JSON.stringify(route.query));
  }

  // Navigate to search page with similarity search endpoint
  const queryParams = {
    card_name: props.card.card_name,
    limit: DefaultLimitSimilarity,
    filters: undefined, // No additional filters for similarity search
    searchType: 'similarity'
  };
  navigateTo({ path: '/search/similarity', query: queryParams });
}

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}

const isDev = import.meta.env.VITE_IS_DEV === "true";
const showAllData = ref(false);
function toggleShowAllData() {
  showAllData.value = !showAllData.value;
}
</script>

<style scoped>
.card-data {
  position: fixed;
  z-index: 1;
  bottom: 10px;
  left: 10px;
  right: 10px;
  max-width: 100%;
  text-overflow: wrap;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Small Size Variant */

.card-small {
  aspect-ratio: 5/7;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* Large Size Variant */
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
  background: linear-gradient(135deg,
      rgba(44, 44, 44, 0.9),
      rgba(66, 66, 66, 0.8));
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

.searched-card-bg {
  background: #353a75 !important;
}

@media (max-width: 767px) {

  .searched-plus-btn,
  .searched-plus-btn.clipboard-added {
    opacity: 0.7 !important;
  }
}

.card-image-wrapper img {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-image-wrapper:hover img {
  transform: scale(1.03);
}

.card-root {
  max-width: 330px;
  width: 100%;
  margin: 0 auto;
  /* center horizontally within container */
  display: block;
  box-sizing: border-box;
}
</style>
