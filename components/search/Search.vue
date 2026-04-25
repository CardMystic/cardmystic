<template>
  <div class="search-container">
    <!-- Search type tabs -->
    <SearchTabs @select="setSearchType" />

    <!-- <UForm class="search-form" @submit="onSubmit"> -->
    <div class="search-input-row">
      <!-- Regular search input -->
      <AISearch v-if="searchType === 'ai'" :platform="platform" />

      <!-- Select Menu for similarity search -->
      <SimilaritySearch v-else-if="searchType === 'similarity'" :platform="platform" />

      <!-- Commander Search -->
      <CommanderSearch v-else-if="searchType === 'commander'" :platform="platform" />

      <!-- Keyword Search -->
      <KeywordSearch v-else-if="searchType === 'keyword'" />

      <!-- Deck Recommender -->
      <ALSSearch v-else-if="searchType === 'recommend'" :platform="platform" />
    </div>

    <SearchAbout v-show="showAbout" :type="searchType" :use-h1="false" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SearchForm' });
import { useRoute } from 'vue-router';

import AISearch from './AISearch.vue';
import SimilaritySearch from './SimilaritySearch.vue';
import CommanderSearch from './CommanderSearch.vue';
import KeywordSearch from './KeywordSearch.vue';
import ALSSearch from './ALSSearch.vue';
import { detectPlatformFromFilters, type Platform } from '~/utils/platformConfig';

// Define props
const props = defineProps<{
  similarity?: boolean;
  showAbout?: boolean;
  defaultSearchType?: 'ai' | 'similarity' | 'commander' | 'keyword' | 'recommend';
  platform?: 'arena' | 'mtgo' | 'paper';
}>();


const route = useRoute();
const router = useRouter();

// Initialize search type based on props or route
const { searchType, setSearchType, getPath, getPlatformFromPath, restoreSearchQuery } = useSearchType();

// Derive the current platform from the route (e.g. /search/arena/ai → 'arena')
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
} else if (route.path.includes('/ai') || route.path === '/') {
  setSearchType('ai');
}

// On mount, restore previous query from sessionStorage if the page has no active query params.
// This handles navigating via the Navbar dropdown, where the route changes but searchType may not.
onMounted(() => {
  // Don't restore searches on the home page or SEO slug pages
  if (route.path === '/' || !route.path.startsWith('/search')) return;

  const restored = restoreSearchQuery(searchType.value);
  if (!restored) return;

  // Only restore if the current route has no meaningful query
  const type = searchType.value;
  const hasQuery =
    (type === 'ai' && route.query.query) ||
    (type === 'similarity' && route.query.card_name) ||
    (type === 'commander' && route.query.query) ||
    (type === 'keyword' && route.query.query) ||
    (type === 'recommend' && (route.query.decklist || route.query.commander));

  if (!hasQuery) {
    const restoredFilters = restored.filters ? JSON.parse(String(restored.filters)) : undefined;
    const targetPlatform = detectPlatformFromFilters(restoredFilters, currentPlatform.value as Platform);
    router.replace({ path: getPath(type, targetPlatform), query: restored });
  }
});

// Watch for search type changes
watch(searchType, (newType) => {
  if (process.server) return;

  // Navigate to the new search type's path.
  // Only preserve the current platform if the saved filters explicitly contain a platform flag;
  // otherwise default to 'all' (no filters means the search wasn't platform-specific).
  const savedQuery = restoreSearchQuery(newType);
  const savedFilters = savedQuery?.filters ? JSON.parse(String(savedQuery.filters)) : undefined;
  const targetPlatform = detectPlatformFromFilters(savedFilters);
  const targetPath = getPath(newType, targetPlatform);
  if (route.path !== targetPath && route.path !== '/') {
    router.push({ path: targetPath, query: savedQuery });
  }
});

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