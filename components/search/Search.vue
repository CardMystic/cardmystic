<template>
  <div class="search-container">
    <!-- Search type tabs -->
    <div class="flex gap-4 max-md:hidden mb-4 justify-center">
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
    </div>

    <!-- Mobile dropdown -->
    <div class="mb-2 md:hidden flex flex-col justify-center items-center">
      <p class="text-sm text-gray-400 mb-1 text-center">Select Search Type</p>
      <USelect label="select" class="w-[200px]" :modelValue="searchType" placeholder="Select status" :icon="searchIcon"
        variant="outline"
        @update:modelValue="(val) => setSearchType(val as 'ai' | 'similarity' | 'commander' | 'keyword')"
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

// Define props
const props = defineProps<{
  similarity?: boolean;
}>();


const route = useRoute();
const router = useRouter();

// Initialize search type based on props or route
const { searchType, setSearchType } = useSearchType();

// Set initial search type
if (props.similarity) {
  setSearchType('similarity');
} else if (route.path === '/search/commander') {
  setSearchType('commander');
} else if (route.path === '/search') {
  setSearchType('ai');
} else if (route.path === '/search/keyword') {
  setSearchType('keyword');
}

// Compute icon based on search type
const searchIcon = computed(() => {
  const iconMap: Record<string, string> = {
    ai: 'i-lucide-search',
    similarity: 'i-mdi-cards-outline',
    commander: 'i-mdi-crown',
    keyword: 'i-lucide-whole-word'
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
  }
])

// Watch for search type changes
watch(searchType, async (newType) => {
  // Save the entire query object to sessionStorage
  if (process.server) return;
  if (route.query.searchType == 'ai') {
    sessionStorage.setItem('ai_search_query', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'commander') {
    sessionStorage.setItem('commander_search_query', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'similarity') {
    sessionStorage.setItem('similarity_search_card_name', JSON.stringify(route.query));
  }
  if (route.query.searchType == 'keyword') {
    sessionStorage.setItem('keyword_search_query', JSON.stringify(route.query));
  }

  // Navigate to the appropriate route based on the selected search type, and reload saved session query if available
  if (newType === 'similarity' && route.path !== '/search/similarity' && route.path !== '/') {
    let query: any = undefined;
    if (route.query.card_name) {
      query = { ...route.query };
    } else {
      const stored = sessionStorage.getItem('similarity_search_card_name');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.card_name) query = parsed;
        } catch { }
      }
    }
    router.push({ path: '/search/similarity', query });
  } else if (newType === 'ai' && route.path !== '/search' && route.path !== '/') {
    let query: any = undefined;
    if (route.query.query && route.query.searchType === 'ai') {
      query = { ...route.query };
    } else {
      const stored = sessionStorage.getItem('ai_search_query');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.query) query = parsed;
        } catch { }
      }
    }
    router.push({ path: '/search', query });
  }
  else if (newType === 'commander' && route.path !== '/search/commander' && route.path !== '/') {
    let query: any = undefined;
    if (route.query.query && route.query.searchType === 'commander') {
      query = { ...route.query };
    } else {
      const stored = sessionStorage.getItem('commander_search_query');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.query) query = parsed;
        } catch { }
      }
    }
    router.push({ path: '/search/commander', query });
  }
  else if (newType === 'keyword' && route.path !== '/search/keyword' && route.path !== '/') {
    let query: any = undefined;
    if (route.query.query && route.query.searchType === 'keyword') {
      query = { ...route.query };
    } else {
      const stored = sessionStorage.getItem('keyword_search_query');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.query) query = parsed;
        } catch { }
      }
    }
    router.push({ path: '/search/keyword', query });
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