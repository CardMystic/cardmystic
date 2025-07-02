<template>
  <navbar></navbar>
  <v-container class="fill-height d-flex align-start justify-center pt-0">
    <v-col justify="center" align="center" class="col-container pt-4">
      <!-- Basic Search Component -->
      <BasicSearch ref="basicSearchRef" max-width="705px" @search="search" />

      <!-- Results -->
      <div style="max-width: 1072px" class="mt-6">
        <!-- Cache Stats (development only) -->
        <div v-if="showCacheStats" class="cache-stats mb-4">
          <v-card class="cache-stats-card" elevation="2">
            <div class="cache-stats-header">
              <v-icon class="mr-2" color="info">mdi-database</v-icon>
              <span class="cache-stats-title">Cache Stats</span>
              <v-btn
                @click="showCacheStats = false"
                icon="mdi-close"
                size="x-small"
                variant="text"
                class="ml-auto"
              ></v-btn>
            </div>
            <div class="cache-stats-content">
              <div class="cache-stat">
                <span class="stat-label">Cached Queries:</span>
                <span class="stat-value">{{ cacheInfo.size }}</span>
              </div>
              <div class="cache-stat">
                <span class="stat-label">Total Results:</span>
                <span class="stat-value">{{
                  cacheInfo.stats.totalResults
                }}</span>
              </div>
              <div class="cache-stat">
                <span class="stat-label">Avg Results:</span>
                <span class="stat-value">{{ cacheInfo.stats.avgResults }}</span>
              </div>
              <v-btn
                @click="clearCache"
                color="warning"
                size="small"
                variant="outlined"
                prepend-icon="mdi-delete"
                class="mt-2"
              >
                Clear Cache
              </v-btn>
            </div>
          </v-card>
        </div>

        <template v-if="searchStore.results.length > 0">
          <v-row>
            <v-col
              class="px-0 py-0 flex-grow-1 mb-2"
              v-for="result in searchStore.results"
              :key="result.card_data.id"
            >
              <card
                :card="result"
                @click="
                  router.push({
                    name: 'cardDetails',
                    query: { id: result.card_data.id },
                  })
                "
              />
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <div class="no-results-container">
            <v-btn to="/" class="mt-4" color="primary">Home</v-btn>
          </div>
        </template>
      </div>

      <div v-if="showFilters" class="mt-0">
        <filters
          ref="filterRef"
          :search-text="searchStore.query"
          @search="search"
          @close="toggleFilters"
        ></filters>
      </div>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useSearchStore } from '~/stores/searchStore';
const router = useRouter();
const route = useRoute();

const searchStore = useSearchStore();
const { loading } = storeToRefs(searchStore);
const basicSearchRef = ref();
const showFilters = ref(false);
const showCacheStats = ref(false);

useHead({
  title: 'CardMystic',
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
  ],
});

onMounted(async () => {
  // Check if we have query parameters to perform a search
  const query = route.query.q as string;
  const endpoint = parseInt(route.query.endpoint as string) || 0;
  const filtersParam = route.query.filters as string;
  const hasImage = route.query.hasImage === 'true';

  if (query || hasImage) {
    // Set the search parameters and update store
    searchStore.query = query || '';
    searchStore.selectedChipIndex = endpoint;

    // Set the chip index in the BasicSearch component
    basicSearchRef.value?.setChipIndex(endpoint);

    // Parse and apply filters if provided
    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(filtersParam);
        Object.assign(searchStore.filters, parsedFilters);
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }

    // Perform the search
    await performSearch();
  }
});

async function search(selectedIndex: number) {
  // Update store with selected index
  searchStore.selectedChipIndex = selectedIndex;

  // Update URL with new search parameters
  const queryParams: any = {
    q: searchStore.query,
    endpoint: selectedIndex,
    filters: JSON.stringify(searchStore.filters),
  };

  // Update the URL without triggering navigation
  await router.replace({
    name: 'search',
    query: queryParams,
  });

  await performSearch();
}

async function performSearch() {
  try {
    await searchStore.search(searchStore.selectedChipIndex);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

// Computed property for cache info
const cacheInfo = computed(() => searchStore.getCacheInfo());

// Add keyboard shortcut to show cache stats (development helper)
onMounted(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      showCacheStats.value = !showCacheStats.value;
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
});

function clearCache() {
  searchStore.clearCache();
  showCacheStats.value = false;
}
</script>

<style lang="sass" scoped>
.title::after
  content: '|'
  animation: blink 1s infinite
  margin-left: 5px

@keyframes blink
  0%, 100%
    opacity: 1
  50%
    opacity: 0

.image
  position: relative
  bottom: -35px

.col-container
  position: relative

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  top: 160px
  left: 0
  right: 0
  margin: auto

.title
  font-size: 3.5rem
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)

.subtitle
  font-size: 1.05rem
  color: white
  position: relative
  top: -14px

.subtitle2
  font-size: 1.01rem
  color: white
  position: relative
  top: -14px


.important-text
  color: rgb(var(--v-theme-primary))
  font-style: italic

.chip
  display: flex
  justify-content: center
  align-content: center
  background-color: black

.primary
  color: rgb(var(--v-theme-primary))

.glow-wrapper
  position: relative
  display: inline-block

.glow-wrapper::after
  content: ''
  position: absolute
  top: 72%
  left: 49%
  width: 100px
  height: 100px
  background: radial-gradient(circle at center, rgba(147,114,255,0.6) 0%, rgba(147,114,255,0.3) 40%, rgba(147,114,255,0.1) 70%, rgba(147,114,255,0) 100%)
  border-radius: 50%
  transform: translate(-50%, -50%)
  animation: glowPulse 5s ease-in-out infinite
  pointer-events: none
  z-index: 1

@keyframes glowPulse
  0%, 100%
    opacity: 0.6
    transform: translate(-50%, -50%) scale(1)
  50%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.4)

.no-results-container
  margin-top: 40px
  display: flex
  align-items: center
  justify-content: center
  text-align: center
  color: white
  font-size: 1.5rem
  display: flex
  flex-direction: column

.filters-btn
  width: 40px
  height: 56px
  border-radius: 4px
  margin-left: 12px

.cache-stats-card
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.95), rgba(66, 66, 66, 0.9)) !important
  border: 1px solid rgba(33, 150, 243, 0.3) !important
  border-radius: 12px !important
  padding: 16px !important

.cache-stats-header
  display: flex
  align-items: center
  margin-bottom: 12px

.cache-stats-title
  color: white
  font-size: 1.1rem
  font-weight: 600

.cache-stats-content
  display: flex
  flex-direction: column
  gap: 8px

.cache-stat
  display: flex
  justify-content: space-between
  align-items: center

.stat-label
  color: rgba(255, 255, 255, 0.8)
  font-size: 0.9rem

.stat-value
  color: rgb(var(--v-theme-primary))
  font-weight: 600
</style>
