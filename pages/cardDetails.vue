<template>
  <navbar />

  <v-container class="py-8 d-flex justify-center">
    <v-row>
      <!-- Left: Card Image -->
      <v-col
        cols="12"
        md="4"
        class="d-flex justify-start align-center flex-column"
      >
        <v-img
          :src="card.url"
          style="border-radius: 16px"
          max-width="300"
          min-width="300"
          max-height="420"
          min-height="420"
          rounded
        />
        <v-progress-linear
          rounded
          :color="getScoreColor(metadata.score)"
          :model-value="metadata.score * 100"
          :height="20"
          class="mt-6"
          style="border: 1px solid black; max-width: 300px"
        >
          <template v-slot:default="{ value }">
            <p class="confidence-text">{{ Math.ceil(value) }}%</p>
          </template>
        </v-progress-linear>
      </v-col>

      <!-- Center: Card Details -->
      <v-col cols="12" md="5">
        <h2 class="text-h5 font-weight-bold mb-2">
          {{ card.name }}
          <span v-if="card.manaCost">({{ card.manaCost }})</span>
        </h2>
        <p class="text-subtitle-1 mb-2">
          Creature — {{ card.subtypes || card.types }}
        </p>

        <div
          class="text-body-1 mb-4"
          v-html="card.cardText.replace(/\n/g, '<br/>')"
        ></div>

        <em v-if="card.flavorText">{{ card.flavorText }}</em>

        <div class="mt-4 font-weight-bold">
          Power / Toughness: {{ card.power }}/{{ card.toughness }}
        </div>

        <div v-if="card.artist" class="mt-2">
          <span class="text-caption"
            >Illustrated by <strong>{{ card.artist }}</strong></span
          >
        </div>
        <v-card elevation="2" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Legalities</h3>

          <v-row dense>
            <v-col v-for="(format, name) in legalities" :key="name" cols="6">
              <v-chip class="chip" :color="getLegalityColor(format)" dark>{{
                format
              }}</v-chip>
              <span class="ml-1 format-text">{{ formatName(name) }}</span>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IWeaviateMagicCardSchema } from '~/types/IVectorBackend';

const cardStore = useCardStore();
const card = computed(
  () => cardStore.card?.properties ?? ({} as IWeaviateMagicCardSchema),
);
const metadata = computed(() => cardStore.card?.metadata ?? ({} as any));
const formatsToIgnore = [
  'OldSchool',
  'StandardBrawl',
  'Explorer',
  'HistoricBrawl',
  'Gladiator',
  'Premodern',
  'Predh',
  'PauperCommander',
];
useHead({ title: `${card.value.name}` });

const legalities = computed(() => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(card.value)) {
    if (key.startsWith('legalityIn')) {
      const format = key.replace('legalityIn', '').replace('Format', '');
      if (!formatsToIgnore.includes(format)) {
        result[format] = (value as string).toUpperCase(); // normalize casing
      }
    }
  }
  return result;
});

console.log('legalities', legalities.value);

function getScoreColor(score: number): string {
  const pct = Math.min(Math.max(score, 0), 1);

  const r = pct < 0.5 ? 200 : Math.floor(200 - (pct - 0.5) * 2 * 200); // red from 200 → 0
  const g =
    pct < 0.5
      ? Math.floor(pct * 2 * 160) // green from 0 → 160
      : 160;

  return `rgb(${r},${g},40)`; // add some darkness with fixed low blue
}

const getLegalityColor = (status: string) => {
  const s = status.toUpperCase();
  switch (s) {
    case 'LEGAL':
      return 'green';
    case 'BANNED':
      return 'red';
    case 'NOT LEGAL':
      return 'grey';
    default:
      return 'blue';
  }
};

const formatName = (raw: string) => {
  return raw.replace(/([A-Z])/g, ' $1').trim();
};
</script>

<style scoped lang="sass">
.chip
  font-size: 10px !important
  min-width: 76px
  text-align: center
  justify-content: center
  padding: 0px !important
  margin: 0px !important

h2,
p,
em
  color: white

.v-img
  border-radius: 12px
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5)

.v-card
  background-color: #2c2c2c
  color: white

.confidence-text
  color: white
  font-size: 14px
  font-weight: bold
  text-align: center
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1)

.format-text
  color: white
  font-size: 12px
  text-align: center
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1)
</style>
