<template>
  <div class="card-container" :class="sizeClass">
    <!-- Left side: image + score -->
    <v-col class="card" cols="3">
      <v-img
        class="card-image"
        :src="card.card_data.image_uris?.normal"
        alt="Card Image"
      ></v-img>

      <v-progress-linear
        rounded
        :color="getScoreColor(card.score)"
        :model-value="card.score"
        :height="progressHeight"
        class="confidence-bar"
        style="border: 1px solid black"
      >
        <template v-slot:default="{ value }">
          <p class="confidence-text">{{ Math.ceil(value) }}%</p>
        </template>
      </v-progress-linear>
    </v-col>
  </div>
</template>

<script setup lang="ts">
import type { ICardResult } from '~/types/IColbert';
import type { PropType } from 'vue';
import { computed } from 'vue';

const props = defineProps({
  card: {
    type: Object as PropType<ICardResult>,
    required: true,
  },
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'large',
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

function getScoreColor(score: number): string {
  const pct = Math.min(Math.max(score / 100, 0), 1);

  const r = pct < 0.5 ? 200 : Math.floor(200 - (pct - 0.5) * 2 * 200); // red from 200 → 0
  const g =
    pct < 0.5
      ? Math.floor(pct * 2 * 160) // green from 0 → 160
      : 160;

  return `rgb(${r},${g},40)`; // add some darkness with fixed low blue
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
}

.card {
  flex-shrink: 0;
  padding: 0px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: auto;
  aspect-ratio: 5/7; /* MTG card aspect ratio */
  object-fit: cover;
  flex: 1;
}

.confidence-bar {
  margin: 0;
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
</style>
