<template>
  <UCard variant="subtle" class="card-container px-0" :ui="{ body: 'sm:px-2 sm:py-2 w-full h-full' }">
    <!-- Card content: image + score -->
    <img :class="sizeClass" :src="getCardImageUrl(card.card_data)" :alt="card.card_data.name" @error="handleImageError"
      v-if="getCardImageUrl(card.card_data)" loading="lazy" decoding="async" :ui="{}" />
    <div v-else class="image-placeholder">
      <p class="placeholder-text">{{ card.card_data.name }}</p>
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
        <!-- <p class="whitespace-nowrap overflow-hidden truncate"><span v-if="card.card_data.prices.usd"
            class="text-green-500">$</span>{{
              card.card_data.prices.usd ?? "N/A"
            }}
        </p> -->
        <p class="whitespace-nowrap overflow-hidden truncate">
          {{ card.card_data.card_type ?? card.card_data.type_line ?? "N/A" }}
        </p>
      </div>
      <div class="flex flex-row items-center justify-center text-center w-full">
        <UProgress v-model="normalizedScore" class="my-0 mr-2" size="md" />
        <p class="text-xs">
          {{ props.card.score !== undefined
            ? props.isSimilaritySearch
              ? `${normalizedScore.toFixed(2)}%`
              : normalizedScore.toFixed(2) + '%'
            : 'N/A' }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { Card } from '~/models/cardModel';

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
});

const sizeClass = computed(() => `card-${props.size}`);

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

function getScoreColor(score: number | undefined): string {
  const normalizedScore = normalizeScore(score);
  const pct = Math.min(Math.max(normalizedScore / 100, 0), 1);

  const r = pct < 0.5 ? 200 : Math.floor(200 - (pct - 0.5) * 2 * 200); // red from 200 → 0
  const g =
    pct < 0.5
      ? Math.floor(pct * 2 * 160) // green from 0 → 160
      : 160;

  return `rgb(${r},${g},40)`; // add some darkness with fixed low blue
}

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

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
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
  border-radius: 8px;
}

/* Large Size Variant */
.card-large {
  border-radius: 14px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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
</style>
