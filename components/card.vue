<template>
  <div class="card-container" :class="sizeClass">
    <!-- Card content: image + score -->
    <div class="card">
      <div class="card-image-wrapper">
        <v-img class="card-image" :src="getCardImageUrl(card.card_data)" alt="Card Image" @error="handleImageError">
          <template v-slot:placeholder>
            <div class="image-placeholder">
              <p class="placeholder-text">{{ card.card_data.name }}</p>
            </div>
          </template>
        </v-img>
      </div>

      <v-progress-linear rounded :color="getScoreColor(card.score)" :model-value="normalizeScore(card.score)"
        :height="progressHeight" class="confidence-bar" style="border: 1px solid black">
        <template v-slot:default="{ value }">
          <p class="confidence-text">{{ Math.ceil(value) }}%</p>
        </template>
      </v-progress-linear>
    </div>
  </div>
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
    type: String as PropType<'small' | 'medium' | 'large'>,
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
});


const sizeClass = computed(() => `card-${props.size}`);
const progressHeight = computed(() => {
  switch (props.size) {
    case 'small':
      return 12;
    case 'medium':
      return 16;
    case 'large':
      return 20;
    default:
      return 20;
  }
});

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

function handleImageError(value: string | undefined) {
  console.warn('Card image failed to load:', value);
}
</script>

<style scoped>
.confidence-text {
  color: white;
  font-weight: bold;
  text-align: center;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1);
}

.card-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: visible;
}

.card {
  flex-shrink: 0;
  padding: 0px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
}

.card-image {
  width: 100%;
  height: auto;
  aspect-ratio: 5/7;
  /* MTG card aspect ratio */
  object-fit: cover;
  flex: 1;
}

/* Remove the old GC badge styles since they're now in the component */

.confidence-bar {
  margin-top: 2px;
}

/* Size variants */
.card-small .card {
  min-width: 150px;
  max-width: 150px;
}

.card-small .card-image {
  max-height: 210px;
  border-radius: 10px;
}

.card-small .confidence-text {
  font-size: 11px;
}

.card-medium .card {
  min-width: 200px;
  max-width: 200px;
}

.card-medium .card-image {
  max-height: 280px;
  border-radius: 16px;
}

.card-medium .confidence-text {
  font-size: 12px;
}

.card-large .card {
  min-width: 268px;
  max-width: 268px;
}

.card-large .card-image {
  max-height: 375px;
  border-radius: 20px;
}

.card-large .confidence-text {
  font-size: 14px;
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
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}
</style>
