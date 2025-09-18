<template>
  <UCard variant="subtle" :class="['card-container px-0', isSearched ? 'searched-card-bg' : '']"
    :ui="{ body: 'sm:px-2 sm:py-2 w-full h-full' }">
    <!-- Card content: image + score -->
    <img :class="sizeClass" :src="getCardImageUrl(card.card_data)" :alt="card.card_data.name" @error="handleImageError"
      v-if="getCardImageUrl(card.card_data)" loading="lazy" decoding="async" :ui="{}"
      @click="navigateToCard(card.card_data.id)" class="cursor-pointer" />
    <div v-else class="image-placeholder">
      <p class="placeholder-text">{{ card.card_data.name }}</p>
    </div>

    <!-- Card Name and mana cost -->
    <div class="flex flex-col items-center justify-center text-center">
      <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full">
      </div>

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
      <div class="flex flex-row items-center justify-center text-center w-full">
        <UButton v-if="showCardInfo && card.card_data.tcgplayer_id" :to="getAffiliateLink(card.card_data.tcgplayer_id)"
          external color="success" variant="solid" class="mt-1 mr-2" icon="i-heroicons-shopping-cart" size="sm"
          target="_blank" rel="noopener noreferrer">{{ card.card_data.prices.usd ? `$${card.card_data.prices.usd}` :
            'Buy' }}
        </UButton>
        <UButton v-if="showCardInfo && !isSearched" color="neutral" variant="solid" class="mt-1 mr-2 cursor-pointer"
          icon="i-mdi-cards-outline" size="sm" @click="findSimilarCards"></UButton>
        <UProgress v-if="!isSearched" v-model="normalizedScore" class="my-0 mr-2" size="md" />
        <p v-if="!isSearched" class="text-xs">
          {{ props.card.score !== undefined
            ? props.isSimilaritySearch
              ? `${normalizedScore.toFixed(2)}%`
              : normalizedScore.toFixed(2) + '%'
            : 'N/A' }}
        </p>
        <UButton v-if="isDev && showCardInfo" color="warning" variant="outline" class="ml-2" size="xs"
          @click="toggleShowAllData">
          {{ showAllData ? 'Hide Data' : 'Show Data' }}
        </UButton>
      </div>
      <div v-if="isDev && showAllData" class="dev-card-json mt-2">
        <pre
          style="max-width:100%;overflow-x:auto;font-size:12px;background:#181818;color:#fff;padding:8px;border-radius:6px;">
          {{ JSON.stringify(card.card_data, null, 2) }}
        </pre>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
import type { Card } from '~/models/cardModel';
import { useRouter } from 'vue-router';
import { DefaultLimitSimilarity } from '~/models/searchModel';
import { getAffiliateLink } from '#imports';

const router = useRouter();

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

// Navigation helper
function navigateToCard(cardId: string | undefined) {
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

function getCardImageUrl(cardData: any): string {
  // Try different image URI options in order of preference

  // Check for small image first, if the size is small
  if (cardData.image_uris?.small && props.size === 'small') {
    return cardData.image_uris.small;
  }
  if (cardData.image_uris?.normal) {
    return cardData.image_uris.normal;
  }
  if (cardData.image_uris?.large) {
    return cardData.image_uris.large;
  }
  if (cardData.image_uris?.small) {
    return cardData.image_uris.small;
  }
  if (cardData.image_uris?.png) {
    return cardData.image_uris.png;
  }

  // For double-faced cards, try the first face
  if (cardData.card_faces && cardData.card_faces[0]?.image_uris) {
    const firstFace = cardData.card_faces[0].image_uris;
    if (firstFace.small && props.size === 'small') return firstFace.small;
    if (firstFace.normal) return firstFace.normal;
    if (firstFace.large) return firstFace.large;
    if (firstFace.small) return firstFace.small;
    if (firstFace.png) return firstFace.png;
  }

  // Fallback to a placeholder or empty string
  return '';
}

function findSimilarCards() {
  if (!props.card) return;

  // Navigate to search page with similarity search endpoint
  const queryParams = {
    card_name: props.card.card_name,
    limit: DefaultLimitSimilarity,
    filters: undefined, // No additional filters for similarity search
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
.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
</style>
