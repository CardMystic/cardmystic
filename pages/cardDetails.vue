<template>
  <navbar />

  <!-- Back to Results button -->
  <v-container v-if="searchStore.results.length > 0" class="pt-4 pb-0">
    <v-btn 
      to="/search" 
      color="primary" 
      variant="outlined"
      prepend-icon="mdi-arrow-left"
      class="mb-4"
    >
      Back to Results
    </v-btn>
  </v-container>

  <v-container class="py-8 d-flex justify-center">
    <div v-if="loading" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-4 text-white">Loading card details...</p>
    </div>

    <div v-else-if="error" class="text-center">
      <v-icon color="error" size="48">mdi-alert-circle</v-icon>
      <p class="mt-4 text-white">{{ error }}</p>
      <v-btn to="/search" color="primary" class="mt-4">Back to Search</v-btn>
    </div>

    <v-row v-else-if="card">
      <!-- Left: Card Image -->
      <v-col
        cols="12"
        md="4"
        class="d-flex justify-start align-center flex-column"
      >
        <v-img
          :src="card.image_uris?.normal"
          style="border-radius: 16px"
          max-width="300"
          min-width="300"
          max-height="420"
          min-height="420"
          rounded
        />
      </v-col>

      <!-- Center: Card Details -->
      <v-col cols="12" md="5">
        <h2 class="text-h5 font-weight-bold mb-2">
          {{ card.name }}
          <span v-if="card.mana_cost">({{ card.mana_cost }})</span>
        </h2>
        <p class="text-subtitle-1 mb-2">
          {{ card.type_line }}
        </p>

        <div
          class="text-body-1 mb-4"
          v-html="card.oracle_text?.replace(/\n/g, '<br/>') || ''"
        ></div>

        <em v-if="card.flavor_text">{{ card.flavor_text }}</em>

        <div class="mt-4 font-weight-bold" v-if="card.power && card.toughness">
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
import { computed, ref, onMounted } from 'vue';
import type { IScryfallCard } from '~/types/IScryfall';
import { useSearchStore } from '~/stores/searchStore';

const route = useRoute();
const searchStore = useSearchStore();
const cardData = ref<IScryfallCard | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const cardId = route.query.id as string;
  if (!cardId) {
    error.value = 'No card ID provided';
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `/api/proxy/scryfall/card_search?id=${cardId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch card data');
    }
    cardData.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
});

const card = computed(() => cardData.value as IScryfallCard | null);

const formatsToIgnore = [
  'oldschool',
  'standardbrawl',
  'explorer',
  'historicbrawl',
  'gladiator',
  'premordern',
  'predh',
  'paupercommander',
];

useHead({
  title: computed(() => card.value?.name || 'CardMystic'),
});

const legalities = computed(() => {
  if (!card.value?.legalities) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(card.value.legalities)) {
    const format = key.charAt(0).toUpperCase() + key.slice(1);
    if (!formatsToIgnore.includes(format)) {
      result[format] = (value as string).toUpperCase(); // normalize casing
    }
  }
  return result;
});

console.log('legalities', legalities.value);

function getScoreColor(score: number): string {
  const pct = Math.min(Math.max(score / 100, 0), 1);

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
