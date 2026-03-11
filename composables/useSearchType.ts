import { ref } from 'vue';

type SearchType = 'ai' | 'similarity' | 'commander' | 'keyword' | 'recommend';

const searchType = ref<SearchType>('ai');

export const useSearchType = () => {
  const setSearchType = (type: SearchType) => {
    searchType.value = type;
  };

  const getSearchType = () => searchType.value;

  const isAiSearch = computed(() => searchType.value === 'ai');
  const isSimilaritySearch = computed(() => searchType.value === 'similarity');
  const isCommanderSearch = computed(() => searchType.value === 'commander');
  const isKeywordSearch = computed(() => searchType.value === 'keyword');
  const isRecommendSearch = computed(() => searchType.value === 'recommend');

  return {
    searchType: readonly(searchType),
    setSearchType,
    getSearchType,
    isAiSearch,
    isSimilaritySearch,
    isCommanderSearch,
    isKeywordSearch,
    isRecommendSearch,
  };
};
