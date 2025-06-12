<template>
  <div class="card-container">
    <!-- Left side: image + score -->
    <v-col class="card" cols="3">
      <v-img
        class="card-image"
        :src="card.properties.url"
        alt="Card Image"
      ></v-img>

      <v-progress-linear
        rounded
        :color="getScoreColor(card.metadata.score)"
        :model-value="card.metadata.score * 100"
        :height="20"
        class="mt-2"
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
defineProps({
  card: {
    type: Object,
    required: true,
  },
});

function getScoreColor(score: number): string {
  const pct = Math.min(Math.max(score, 0), 1);

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
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1);
}

.card-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  max-height: 410px;
}

.card {
  flex-shrink: 0;
  min-width: 268px;
  max-width: 268px;
  padding: 0px;
  padding-bottom: 12px;
}

.card-image {
  border-radius: 12px;
  width: 100%;
}
</style>
