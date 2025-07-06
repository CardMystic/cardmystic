<template>
  <div class="top-queries-container">
    <div v-if="loading" class="text-center py-4">
      <v-progress-circular
        indeterminate
        color="primary"
        size="24"
      ></v-progress-circular>
      <p class="mt-2 text-white text-caption">Loading popular queries...</p>
    </div>

    <div v-else-if="topQueries.length > 0" class="top-queries-content">
      <div class="queries-header">
        <v-icon class="mr-2" color="primary" size="20">mdi-trending-up</v-icon>
        <h3 class="queries-title">Top Searches This Week</h3>
      </div>

      <div class="queries-grid">
        <div class="queries-column">
          <div
            v-for="(queryData, index) in leftColumnQueries"
            :key="queryData.query"
            class="query-item"
          >
            <div class="query-rank">#{{ index + 1 }}</div>
            <div class="query-text">{{ queryData.query }}</div>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              @click="tryQuery(queryData.query)"
              prepend-icon="mdi-magnify"
              class="try-btn"
            >
              Try
            </v-btn>
          </div>
        </div>

        <div class="queries-column">
          <div
            v-for="(queryData, index) in rightColumnQueries"
            :key="queryData.query"
            class="query-item"
          >
            <div class="query-rank">#{{ index + 6 }}</div>
            <div class="query-text">{{ queryData.query }}</div>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              @click="tryQuery(queryData.query)"
              prepend-icon="mdi-magnify"
              class="try-btn"
            >
              Try
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-state">
      <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
      <span class="error-text">Failed to load popular queries</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

interface TopQuery {
  query: string;
  hitCount: number;
  lastAccessed: string;
  isCached: boolean;
}

const router = useRouter();
const topQueries = ref<TopQuery[]>([]);
const loading = ref(false);
const error = ref(false);

onMounted(async () => {
  await fetchTopQueries();
});

async function fetchTopQueries() {
  loading.value = true;
  error.value = false;

  try {
    const response = await fetch('/api/proxy/cache/top');

    if (!response.ok) {
      throw new Error('Failed to fetch top queries');
    }

    const data = await response.json();
    topQueries.value = data.topUserQueries || [];
  } catch (err) {
    console.error('Error fetching top queries:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const leftColumnQueries = computed(() => topQueries.value.slice(0, 5));
const rightColumnQueries = computed(() => topQueries.value.slice(5, 10));

function tryQuery(query: string) {
  // Navigate to search page with the selected query
  router.push({
    name: 'search',
    query: {
      q: query,
      endpoint: 0, // A.I. search endpoint
      filters: JSON.stringify({
        selectedCardTypes: [],
        selectedColorFilterOption: 'Contains At Most',
        selectedColors: {
          Red: true,
          Blue: true,
          Green: true,
          White: true,
          Black: true,
        },
        selectedRarities: {
          Common: false,
          Uncommon: false,
          Rare: false,
          Mythic: false,
        },
        selectedCMCOption: 'Equal To',
        selectedPowerOption: 'Equal To',
        selectedToughnessOption: 'Equal To',
        selectedCMC: '',
        selectedPower: '',
        selectedToughness: '',
        selectedCardFormats: [],
      }),
    },
  });
}
</script>

<style scoped lang="sass">
.top-queries-container
  width: 100%
  max-width: 768px
  margin: 0 auto

.top-queries-content
  border-radius: 16px
  padding: 20px
  backdrop-filter: blur(10px)
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8))
  border: 1px solid rgba(147, 114, 255, 0.2)

.queries-header
  display: flex
  align-items: center
  margin-bottom: 16px

.queries-title
  color: white
  font-size: 1.3rem
  font-weight: 600
  margin: 0

.queries-grid
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 16px

  @media (max-width: 768px)
    grid-template-columns: 1fr
    gap: 8px

.queries-column
  display: flex
  flex-direction: column
  gap: 8px

.query-item
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 16px
  border-radius: 12px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.1), rgba(147, 114, 255, 0.05))
  border: 1px solid rgba(147, 114, 255, 0.2)
  cursor: pointer
  transition: all 0.3s ease

  &:hover
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.2), rgba(147, 114, 255, 0.1))
    border-color: rgba(147, 114, 255, 0.4)
    transform: translateY(-2px)
    box-shadow: 0 4px 12px rgba(147, 114, 255, 0.3)

.query-rank
  display: flex
  align-items: center
  justify-content: center
  width: 24px
  height: 24px
  border-radius: 50%
  background-color: black
  color: white
  font-size: 12px
  font-weight: 600
  flex-shrink: 0

.query-text
  color: white
  font-size: 0.95rem
  font-weight: 500
  flex: 1
  line-height: 1.2

  @media (max-width: 768px)
    font-size: 0.9rem

.try-btn
  min-width: 50px !important
  font-size: 0.8rem !important

.error-state
  display: flex
  align-items: center
  justify-content: center
  padding: 16px
  color: rgba(255, 255, 255, 0.7)

.error-text
  font-size: 0.9rem
</style>
