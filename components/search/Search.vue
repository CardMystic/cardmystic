<template>
  <div class="search-container">
    <!-- Search type tabs -->
    <div class="flex gap-3 max-md:hidden mb-4 justify-center">
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'ai' }]"
        @click="setSearchType('ai')">
        <UIcon name="i-lucide-search" class="icon" size="18" />
        AI Search
      </button>
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'similarity' }]"
        @click="setSearchType('similarity')">
        <UIcon name="i-mdi-cards-outline" class="icon" size="18" />
        Similarity Search
      </button>
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'commander' }]"
        @click="setSearchType('commander')">
        <UIcon name="i-mdi-crown" class="icon" size="18" />
        Commander Search
      </button>
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'keyword' }]"
        @click="setSearchType('keyword')">
        <UIcon name="i-lucide-whole-word" class="icon" size="18" />
        Keyword Search
      </button>
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'recommend' }]"
        @click="setSearchType('recommend')">
        <UIcon name="i-lucide-box" class="icon" size="18" />
        Deck Recommender
      </button>
    </div>

    <!-- Mobile dropdown -->
    <div class="mb-2 md:hidden flex flex-col justify-center items-center">
      <p class="text-sm text-gray-400 mb-1 text-center">Select Search Type</p>
      <USelect label="select" class="w-50" :modelValue="searchType" placeholder="Select status" :icon="searchIcon"
        variant="outline"
        @update:modelValue="(val) => { if (typeof val === 'string') setSearchType(val as 'ai' | 'similarity' | 'commander' | 'keyword' | 'recommend') }"
        :items="items" />
    </div>

    <!-- <UForm class="search-form" @submit="onSubmit"> -->
    <div class="search-input-row">
      <!-- Regular search input -->
      <AISearch v-if="searchType === 'ai'" />

      <!-- Select Menu for similarity search -->
      <SimilaritySearch v-else-if="searchType === 'similarity'" />

      <!-- Commander Search -->
      <CommanderSearch v-else-if="searchType === 'commander'" />

      <!-- Keyword Search -->
      <KeywordSearch v-else-if="searchType === 'keyword'" />

      <!-- Deck Recommender -->
      <ALSSearch v-else-if="searchType === 'recommend'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SearchForm' });
import type { SelectItem } from '@nuxt/ui'
import { useRoute } from 'vue-router';

import AISearch from './AISearch.vue';
import SimilaritySearch from './SimilaritySearch.vue';
import CommanderSearch from './CommanderSearch.vue';
import KeywordSearch from './KeywordSearch.vue';
import ALSSearch from './ALSSearch.vue';

// Define props
const props = defineProps<{
  similarity?: boolean;
}>();


const route = useRoute();
const router = useRouter();

// Initialize search type based on props or route
const { searchType, setSearchType, getPath, saveCurrentSearchQuery, restoreSearchQuery } = useSearchType();

// Set initial search type
if (props.similarity) {
  setSearchType('similarity');
} else if (route.path === '/search/commander') {
  setSearchType('commander');
} else if (route.path === '/search') {
  setSearchType('ai');
} else if (route.path === '/search/keyword') {
  setSearchType('keyword');
} else if (route.path === '/search/recommend') {
  setSearchType('recommend');
}

// Compute icon based on search type
const searchIcon = computed(() => {
  const iconMap: Record<string, string> = {
    ai: 'i-lucide-search',
    similarity: 'i-mdi-cards-outline',
    commander: 'i-mdi-crown',
    keyword: 'i-lucide-whole-word',
    recommend: 'i-lucide-box'
  };
  return iconMap[searchType.value] || 'i-lucide-search';
});

// Items for mobile dropdown
const items = ref<SelectItem[]>([
  {
    label: 'AI Search',
    value: 'ai',
    icon: 'i-lucide-search'
  },
  {
    label: 'Similarity Search',
    value: 'similarity',
    icon: 'i-mdi-cards-outline'
  },
  {
    label: 'Commander Search',
    value: 'commander',
    icon: 'i-mdi-crown'
  },
  {
    label: 'Keyword Search',
    value: 'keyword',
    icon: 'i-lucide-whole-word'
  },
  {
    label: 'Deck Recommender',
    value: 'recommend',
    icon: 'i-lucide-box'
  }
])

// On mount, restore previous query from sessionStorage if the page has no active query params.
// This handles navigating via the Navbar dropdown, where the route changes but searchType may not.
onMounted(() => {
  const restored = restoreSearchQuery(searchType.value);
  if (!restored) return;

  // Only restore if the current route has no meaningful query
  const type = searchType.value;
  const hasQuery =
    (type === 'ai' && route.query.query) ||
    (type === 'similarity' && route.query.card_name) ||
    (type === 'commander' && route.query.query) ||
    (type === 'keyword' && route.query.query) ||
    (type === 'recommend' && (route.query.decklist || route.query.commanders));

  if (!hasQuery) {
    router.replace({ path: getPath(type), query: restored });
  }
});

// Watch for search type changes
watch(searchType, (newType) => {
  if (process.server) return;

  // Save the current query before navigating away
  saveCurrentSearchQuery(route.query);

  // Navigate to the new search type's path (onMounted will restore the saved query)
  const targetPath = getPath(newType);
  if (route.path !== targetPath && route.path !== '/') {
    router.push({ path: targetPath });
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

.search-tab-button-new {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 18px;
  border: none;
  border-radius: 18px;
  font-weight: 500;
  font-size: 0.98rem;
  cursor: pointer;
  white-space: nowrap;
  color: #e6e6fa;
  background: #23223a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
  border: 1.2px solid rgba(147, 114, 255, 0.22);
  backdrop-filter: blur(10px) saturate(160%);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, border 0.18s, transform 0.18s;
  position: relative;
  z-index: 1;
  outline: none;
  line-height: 1.2;
}

.search-tab-button-new.active {
  background: #a37aff;
  color: #fff;
  border-color: #a37aff;
  box-shadow: 0 6px 24px 0 rgba(147, 114, 255, 0.22), 0 2px 8px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.07);
}

.search-tab-button-new:hover:not(.active),
.search-tab-button-new:focus-visible:not(.active) {
  background: #3d375a;
  color: #fff;
  border-color: #a37aff;
  box-shadow: 0 6px 20px rgba(147, 114, 255, 0.13), 0 2px 8px rgba(0, 0, 0, 0.13);
  transform: translateY(-1px) scale(1.03);
}

@media (max-width: 768px) {
  .search-tabs-container {
    gap: 14px;
    margin-bottom: 10px;
    flex-wrap: wrap;
    /* Ensure wrapping on mobile */
    justify-content: flex-start;
  }

  .search-tab-button-new {
    padding: 6px 10px;
    font-size: 0.92rem;
    min-width: 120px;
    /* Optional: ensure buttons are readable */
    flex: 0 0 auto;
  }
}

.search-btn {
  margin-top: 0;
  align-self: flex-start;
  cursor: pointer;
}

.filters-section {
  width: 100%;
}

@media (max-width: 768px) {
  .search-input-row {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .search-btn {
    width: 100%;
    margin-left: 0 !important;
    align-self: flex-start;
    font-size: 18px;
    font-weight: 500;
  }

  .search-container {
    padding: 0 0px;
  }
}
</style>