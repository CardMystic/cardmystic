import { ref } from 'vue';

type SearchType = 'ai' | 'similarity';

const searchType = ref<SearchType>('ai');

export const useSearchType = () => {
  const setSearchType = (type: SearchType) => {
    searchType.value = type;
  };

  const getSearchType = () => searchType.value;

  const isAiSearch = computed(() => searchType.value === 'ai');
  const isSimilaritySearch = computed(() => searchType.value === 'similarity');

  return {
    searchType: readonly(searchType),
    setSearchType,
    getSearchType,
    isAiSearch,
    isSimilaritySearch,
  };
};
