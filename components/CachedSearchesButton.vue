<template>
  <div>
    <v-menu
      v-model="menuOpen"
      :close-on-content-click="false"
      location="bottom end"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-history"
          class="cached-btn"
          size="small"
        >
          <span class="btn-text">Cached</span>
          <v-badge
            v-if="cacheSize > 0"
            :content="cacheSize"
            color="success"
            inline
            class="ml-1"
          />
        </v-btn>
      </template>

      <v-card
        class="cached-searches-menu"
        elevation="8"
        min-width="400"
        max-width="500"
      >
        <div class="menu-header">
          <v-icon color="primary" class="mr-2">mdi-history</v-icon>
          <span class="menu-title">Cached Searches</span>
          <v-btn
            @click="menuOpen = false"
            icon="mdi-close"
            size="x-small"
            variant="text"
            class="ml-auto"
          />
        </div>

        <v-divider />

        <div v-if="cacheEntries.length === 0" class="empty-state">
          <v-icon size="48" color="grey">mdi-history</v-icon>
          <p class="empty-text">No cached searches yet</p>
          <p class="empty-subtext">Your search history will appear here</p>
        </div>

        <div v-else class="cached-list">
          <div
            v-for="(entry, index) in cacheEntries"
            :key="`${entry.endpoint}-${entry.query}-${entry.timestamp}`"
            class="cached-item"
            @click="runCachedSearch(entry)"
          >
            <div class="cached-content">
              <div class="cached-header">
                <v-chip
                  :color="getEndpointColor(entry.endpoint)"
                  size="x-small"
                  variant="flat"
                  class="endpoint-chip"
                >
                  {{ getEndpointName(entry.endpoint) }}
                </v-chip>
                <span class="cached-age">{{ entry.age }}</span>
              </div>

              <div class="cached-query">"{{ entry.query }}"</div>

              <div class="cached-meta">
                <span class="result-count">{{ entry.size }} results</span>
                <v-icon size="16" color="success" class="ml-2"
                  >mdi-lightning-bolt</v-icon
                >
              </div>
            </div>
          </div>
        </div>

        <v-divider v-if="cacheEntries.length > 0" />

        <div v-if="cacheEntries.length > 0" class="menu-footer">
          <div class="cache-stats">
            <span class="stat-text">
              {{ cacheStats.totalQueries }} queries •
              {{ cacheStats.totalResults }} total results
            </span>
          </div>
          <v-btn
            @click="clearAllCache"
            color="warning"
            variant="text"
            size="small"
            prepend-icon="mdi-delete"
          >
            Clear All
          </v-btn>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSearchStore } from '~/stores/searchStore';
import { useCacheStore } from '~/stores/cacheStore';

const router = useRouter();
const route = useRoute();
const searchStore = useSearchStore();
const cacheStore = useCacheStore();
const menuOpen = ref(false);

const { cacheSize, cacheEntries, cacheStats } = storeToRefs(cacheStore);

function getEndpointName(endpoint: number): string {
  const endpointNames = ['A.I.', 'Similar'];
  return endpointNames[endpoint] || 'Unknown';
}

function getEndpointColor(endpoint: number): string {
  const colors = ['primary', 'info'];
  return colors[endpoint] || 'grey';
}

async function runCachedSearch(entry: any) {
  // Set the search store values
  searchStore.query = entry.query;
  searchStore.selectedChipIndex = entry.endpoint;

  // Close the menu
  menuOpen.value = false;

  // If we're already on the search page, run the search directly
  if (route.name === 'search') {
    await searchStore.search(entry.endpoint);
  } else {
    // Navigate to search page with query parameters
    router.push({
      name: 'search',
      query: {
        q: entry.query,
        endpoint: entry.endpoint,
        filters: JSON.stringify(searchStore.filters),
      },
    });
  }
}

function clearAllCache() {
  cacheStore.clear();
  menuOpen.value = false;
}
</script>

<style scoped lang="sass">
.cached-searches-button
  position: relative
  z-index: 1500

.cached-btn
  backdrop-filter: blur(10px)
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.9), rgba(147, 114, 255, 0.7)) !important
  border: 1px solid rgba(255, 255, 255, 0.2)
  box-shadow: 0 4px 12px rgba(147, 114, 255, 0.3)

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 6px 16px rgba(147, 114, 255, 0.4)

.btn-text
  font-weight: 600
  @media (max-width: 768px)
    display: none

.cached-searches-menu
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.98), rgba(66, 66, 66, 0.95)) !important
  border: 1px solid rgba(147, 114, 255, 0.3) !important
  backdrop-filter: blur(15px)

.menu-header
  display: flex
  align-items: center
  padding: 16px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.1), rgba(147, 114, 255, 0.05))

.menu-title
  color: white
  font-size: 1.1rem
  font-weight: 600

.empty-state
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 40px 20px
  text-align: center

.empty-text
  color: white
  font-size: 1.1rem
  font-weight: 500
  margin: 12px 0 4px 0

.empty-subtext
  color: rgba(255, 255, 255, 0.6)
  font-size: 0.9rem
  margin: 0

.cached-list
  max-height: 400px
  overflow-y: auto

.cached-item
  padding: 12px 16px
  cursor: pointer
  transition: all 0.2s ease
  border-bottom: 1px solid rgba(147, 114, 255, 0.1)

  &:hover
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.1), rgba(147, 114, 255, 0.05))

  &:last-child
    border-bottom: none

.cached-content
  display: flex
  flex-direction: column
  gap: 8px

.cached-header
  display: flex
  justify-content: space-between
  align-items: center

.endpoint-chip
  font-size: 10px !important
  font-weight: 600
  min-width: 40px

.cached-age
  color: rgba(255, 255, 255, 0.6)
  font-size: 0.8rem

.cached-query
  color: rgb(var(--v-theme-primary))
  font-size: 0.95rem
  font-weight: 500
  font-style: italic
  line-height: 1.3

.cached-meta
  display: flex
  align-items: center
  justify-content: space-between

.result-count
  color: rgba(255, 255, 255, 0.8)
  font-size: 0.8rem

.menu-footer
  display: flex
  justify-content: space-between
  align-items: center
  padding: 12px 16px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(147, 114, 255, 0.02))
</style>
