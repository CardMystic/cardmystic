<template>
  <div class="search-container">
    <!-- Search type tabs -->
    <SearchTabs @select="selectSearchType" />

    <!-- <UForm class="search-form" @submit="onSubmit"> -->
    <div class="search-input-row">
      <!-- Regular search input -->
      <AISearch
        v-if="searchType === 'smart'"
        :platform="platform"
        :show-suggested-searches="showSuggestedSearches"
      />

      <!-- Select Menu for similarity search -->
      <SimilaritySearch
        v-else-if="searchType === 'similarity'"
        :platform="platform"
      />

      <!-- Commander Search -->
      <CommanderSearch
        v-else-if="searchType === 'commander'"
        :platform="platform"
      />

      <!-- Keyword Search -->
      <KeywordSearch v-else-if="searchType === 'keyword'" />

      <!-- Deck Recommender -->
      <ALSSearch v-else-if="searchType === 'recommend'" :platform="platform" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SearchForm' });
import { useRoute } from 'vue-router';

import AISearch from './AISearch.vue';
import type { SearchTabType } from './SearchTabs.vue';
import {
  detectPlatformFromFilters,
  type Platform,
} from '~/utils/platformConfig';

// Keep the initial Smart Search ready while loading other modes only when used.
// Async components still render on the server when their mode is selected.
const SimilaritySearch = defineAsyncComponent(
  () => import('./SimilaritySearch.vue'),
);
const CommanderSearch = defineAsyncComponent(
  () => import('./CommanderSearch.vue'),
);
const KeywordSearch = defineAsyncComponent(() => import('./KeywordSearch.vue'));
const ALSSearch = defineAsyncComponent(() => import('./ALSSearch.vue'));

// Define props
const props = defineProps<{
  similarity?: boolean;
  defaultSearchType?:
    'smart' | 'similarity' | 'commander' | 'keyword' | 'recommend';
  platform?: 'arena' | 'mtgo' | 'paper';
  /** Show the curated "Suggested Searches" pills under the Smart Search bar (home hero only). */
  showSuggestedSearches?: boolean;
}>();

const route = useRoute();
const router = useRouter();

// Initialize search type based on props or route
const {
  searchType,
  setSearchType,
  getPath,
  getPlatformFromPath,
  restoreSearchQuery,
} = useSearchType();

// Derive the current platform from the route (e.g. /search/arena/smart → 'arena')
const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

// Set initial search type
if (props.defaultSearchType) {
  setSearchType(props.defaultSearchType);
} else if (props.similarity) {
  setSearchType('similarity');
} else if (route.path.includes('/commander')) {
  setSearchType('commander');
} else if (route.path.includes('/keyword')) {
  setSearchType('keyword');
} else if (route.path.includes('/deckbuilder')) {
  setSearchType('recommend');
} else if (route.path.includes('/similarity')) {
  setSearchType('similarity');
} else if (route.path.includes('/smart') || route.path === '/') {
  setSearchType('smart');
}

// On mount, restore previous query from sessionStorage if the page has no active query params.
// This handles navigating via the Navbar dropdown, where the route changes but searchType may not.
onMounted(() => {
  // Don't restore searches on the home page or SEO slug pages
  if (
    route.path === '/' ||
    !route.path.startsWith('/search') ||
    route.params.slug
  )
    return;

  const restored = restoreSearchQuery(searchType.value);
  if (!restored) return;

  // Only restore if the current route has no meaningful query
  const type = searchType.value;
  const hasQuery =
    (type === 'smart' && route.query.query) ||
    (type === 'similarity' && route.query.card_name) ||
    (type === 'commander' && route.query.query) ||
    (type === 'keyword' && route.query.query) ||
    (type === 'recommend' && (route.query.decklist || route.query.commander));

  if (!hasQuery) {
    const restoredFilters = restored.filters
      ? JSON.parse(String(restored.filters))
      : undefined;
    const targetPlatform = detectPlatformFromFilters(
      restoredFilters,
      currentPlatform.value as Platform,
    );
    router.replace({ path: getPath(type, targetPlatform), query: restored });
  }
});

// Only an explicit tab selection should navigate. Page setup also updates the
// shared search type, including while the previous page is still mounted.
function selectSearchType(newType: SearchTabType) {
  if (newType === searchType.value) return;
  setSearchType(newType);
  if (route.path === '/') return;

  // Navigate to the new search type's path.
  // Only preserve the current platform if the saved filters explicitly contain a platform flag;
  // otherwise default to 'all' (no filters means the search wasn't platform-specific).
  const savedQuery = restoreSearchQuery(newType);
  const savedFilters = savedQuery?.filters
    ? JSON.parse(String(savedQuery.filters))
    : undefined;
  const targetPlatform = detectPlatformFromFilters(savedFilters);
  const targetPath = getPath(newType, targetPlatform);
  if (route.path !== targetPath) {
    router.push({ path: targetPath, query: savedQuery });
  }
}
</script>

<style scoped>
.search-container {
  width: 100%;
  margin: 0 auto;
}

.search-form {
  width: 100%;
}

.search-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

@media (max-width: 768px) {
  .search-input-row {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .search-container {
    padding: 0 0px;
  }
}
</style>
