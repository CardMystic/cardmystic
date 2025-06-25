import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IMagicCardsSearchFilters } from '~/types/IModelGateway';
import type { ICardResult } from '~/types/IColbert';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const imageFile = ref<File | null>(null);
  const results: Ref<ICardResult[]> = ref<any[]>([]);
  const loading = ref(false);

  // Filters
  const filters: Ref<IMagicCardsSearchFilters> = ref({
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
  });

  const endpoints = [
    {
      name: 'A.I.',
      tooltip: 'Search by Meaning using AI',
      endpoint: '/search/colbert',
    },
    {
      name: 'Similar Search',
      tooltip: 'Search For Similar Cards',
      endpoint: '/search/similarity',
    },
    {
      name: 'Keyword',
      tooltip: 'Traditional Keyword Search',
      endpoint: '/keyword_search',
    },
    {
      name: 'Image',
      tooltip: 'Search by Image using AI',
      endpoint: '/image_search',
    },
  ];

  const search = async (selectedIndex: number): Promise<void> => {
    loading.value = true;

    // Route to appropriate search function based on endpoint
    if (selectedIndex === 1) {
      await similarSearch();
    } else {
      await vectorSearch(selectedIndex);
    }
  };

  const vectorSearch = async (selectedIndex: number = 0): Promise<void> => {
    const endpoint = endpoints[selectedIndex].endpoint;
    const url = '/api/proxy' + endpoint;

    console.log('vector search url', url);
    console.log('filters', filters.value);

    let response;

    // If its an image upload, we need to handle the file differently
    if (endpoint == '/image_search' && imageFile.value) {
      const formData = new FormData();
      formData.append('image', imageFile.value);
      formData.append('filters', JSON.stringify(filters.value));
      formData.append('limit', '80');

      response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
    } else {
      const body = {
        query: query.value,
        limit: 80,
        filters: filters.value,
      };

      console.log('vector search body', body);

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    const data: ICardResult[] = await response.json();
    console.log('vector search results', data);

    if (data && data.length > 0) {
      results.value = data;
    } else {
      results.value = [];
    }

    loading.value = false;
  };

  const similarSearch = async (): Promise<void> => {
    const url = '/api/proxy/search/similarity';

    console.log('similar search url', url);

    const body = {
      card_name: query.value,
      limit: 80,
      filters: {},
    };

    console.log('similar search body', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data: ICardResult[] = await response.json();
    console.log('similar search results', data);

    if (data && data.length > 0) {
      results.value = data;
    } else {
      results.value = [];
    }

    loading.value = false;
  };

  return {
    search,
    vectorSearch,
    similarSearch,
    endpoints,
    query,
    imageFile,
    results,
    loading,
    filters,
  };
});
