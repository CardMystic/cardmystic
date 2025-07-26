<template>
  <div class="example-query-container mb-2">
    <div v-if="isLoading" class="text-center">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-primary text-2xl" />
      <p class="mt-2 text-white text-caption">Loading example...</p>
    </div>

    <div v-else-if="results && results.length > 0" class="example-content">
      <!-- Query display and TRY IT button -->
      <div class="query-header">
        <div class="query-text">
          <UIcon name="i-mdi-lightbulb-outline" class="mr-2" color="primary" />
          <span class="query-value">"{{ wordSearch.query }}"</span>
        </div>
        <div class="button-group">
          <UButton color="neutral" variant="outline" icon="i-mdi-refresh" @click="loadRandomExample"
            :loading="isLoading" class="refresh-button" size="sm" />
          <UButton color="primary" variant="outline" @click="tryQuery" class="try-button" icon="i-lucide-search">
            TRY
          </UButton>
        </div>
      </div>
      <!-- Horizontal scrolling results -->
      <div class="results-container">
        <UCarousel v-slot="{ item }" loop wheel-gestures :auto-scroll="{ speed: 1 }" :items="results"
          :ui="{ item: 'basis-1/6' }">
          <Card :card="item" :normalization-context="allScores" size="small" @click="goToCard(item.card_data.id)"
            class="hoverable-card" />
        </UCarousel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query'
import { type ExampleQueryResponse } from '~/models/searchModel';
const router = useRouter();

const currentQuery = ref<string>('creatures that draw cards');

const wordSearch = computed(() =>
  WordSearchSchema.parse({
    query: currentQuery.value,
    limit: 15, // Reduced from DefaultLimit for performance
    exclude_card_data: false, // Default to false, can be overridden by query param
  })
);

// Computed property to get all scores for normalization context
const allScores = computed(() => results.value?.cards.map((r) => r.score || 0) || []);

// Example queries to choose from
const exampleQueries = [
  "creatures that draw cards",
  "stax pieces",
  "blue cantrips",
  "adventure ramp",
  "orzhov removal",
  "black creatures with flying",
  "etb effects",
  "artifact removal",
  "x spell board wipes",
  "low cost sultai commanders",
  "mono white token finishers",
  "golgari elves that draw",
  "five color dragon commander",
  "red burn",
  "graveyard recursion",
];

onMounted(async () => {
  await loadRandomExample();
});


async function loadRandomExample() {
  const randomIndex = Math.floor(Math.random() * exampleQueries.length);
  currentQuery.value = exampleQueries[randomIndex];
}

const { data: results, isLoading } = useQuery({
  queryKey: [
    'search',
    'colbert',
    wordSearch,
  ],
  queryFn: async () => {
    const response = await fetch('/api/search/colbert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wordSearch.value),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json() as Promise<Array<Card>>;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
});


function tryQuery() {
  // Navigate to search page with the current query
  router.push({
    name: 'search',
    query: {
      query: wordSearch.value.query,
    },
  });
}

function goToCard(cardId: string | undefined) {
  if (!cardId) {
    console.warn('Cannot navigate to card: ID is undefined');
    return;
  }
  router.push(`/card/${cardId}`);
}
</script>

<style scoped lang="sass">
.example-query-container
  width: 100%
  margin: 0 auto

.example-content
  border-radius: 24px
  padding: 16px
  backdrop-filter: blur(20px) saturate(180%)
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
  border: 1px solid rgba(147, 114, 255, 0.3)
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)
  position: relative

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))
    pointer-events: none

.query-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 6px
  flex-wrap: wrap

.skeleton-carousel
  display: flex
  gap: 12px
  overflow-x: hidden
  padding: 4px 0

.skeleton-card
  flex: 0 0 155px
  min-width: 155px
  max-width: 180px
  padding: 8px
  border-radius: 8px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(147, 114, 255, 0.02))
  border: 1px solid rgba(147, 114, 255, 0.1)

.button-group
  display: flex
  align-items: center
  gap: 12px
  flex-shrink: 0

.query-value
  color: rgb(var(--v-theme-primary))
  font-size: 16px
  font-weight: bold
  font-style: italic
  @media (max-width: 768px)
    font-size: 12px

.hoverable-card
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important
  &:hover
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4)) saturate(110%) brightness(105%)
</style>