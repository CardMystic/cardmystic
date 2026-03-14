import { ref } from 'vue';
import type { LocationQuery } from 'vue-router';

type SearchType = 'ai' | 'similarity' | 'commander' | 'keyword' | 'recommend';

const searchType = ref<SearchType>('ai');

const storageKeys: Record<SearchType, string> = {
  ai: 'ai_search_query',
  similarity: 'similarity_search_card_name',
  commander: 'commander_search_query',
  keyword: 'keyword_search_query',
  recommend: 'recommend_search_query',
};

const paths: Record<SearchType, string> = {
  ai: '/search',
  similarity: '/search/similarity',
  commander: '/search/commander',
  keyword: '/search/keyword',
  recommend: '/search/recommend',
};

const requiredFields: Record<SearchType, string[]> = {
  ai: ['query'],
  similarity: ['card_name'],
  commander: ['query'],
  keyword: ['query'],
  recommend: ['decklist', 'commanders'],
};

export const useSearchType = () => {
  const setSearchType = (type: SearchType) => {
    searchType.value = type;
  };

  const getSearchType = () => searchType.value;

  const getPath = (type: SearchType) => paths[type];

  /** Save the current route query to sessionStorage for a given search type. */
  const saveSearchQuery = (type: SearchType, query: LocationQuery) => {
    if (process.server) return;
    sessionStorage.setItem(storageKeys[type], JSON.stringify(query));
  };

  /** Save the current route query using its searchType query param. */
  const saveCurrentSearchQuery = (query: LocationQuery) => {
    const type = query.searchType as SearchType | undefined;
    if (type && storageKeys[type]) {
      saveSearchQuery(type, query);
    }
  };

  /** Restore saved query params from sessionStorage for a search type. Returns parsed query or undefined. */
  const restoreSearchQuery = (type: SearchType): LocationQuery | undefined => {
    if (process.server) return undefined;
    const stored = sessionStorage.getItem(storageKeys[type]);
    if (!stored) return undefined;
    try {
      const parsed = JSON.parse(stored);
      const hasRequired = requiredFields[type].some((f) => parsed[f]);
      return hasRequired ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  const isAiSearch = computed(() => searchType.value === 'ai');
  const isSimilaritySearch = computed(() => searchType.value === 'similarity');
  const isCommanderSearch = computed(() => searchType.value === 'commander');
  const isKeywordSearch = computed(() => searchType.value === 'keyword');
  const isRecommendSearch = computed(() => searchType.value === 'recommend');

  return {
    searchType: readonly(searchType),
    setSearchType,
    getSearchType,
    getPath,
    saveSearchQuery,
    saveCurrentSearchQuery,
    restoreSearchQuery,
    isAiSearch,
    isSimilaritySearch,
    isCommanderSearch,
    isKeywordSearch,
    isRecommendSearch,
  };
};
