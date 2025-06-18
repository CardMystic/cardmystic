import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IMagicCardsSearchFilters } from '~/types/IModelGateway';
import type { IColbertResponse, ICardResult } from '~/types/IColbert';

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
    selectedCardFormats: [{ format: null, status: null }],
  });

  const endpoints = [
    {
      name: 'A.I.',
      tooltip: 'Search by Meaning using AI',
      endpoint: '/colbert/vector_search',
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
    const endpoint = endpoints[selectedIndex].endpoint;
    const url = '/api/proxy' + endpoint;

    console.log('url', url);
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

      console.log('body', body);

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    const data: IColbertResponse = await response.json();
    console.log('results', data);

    if (data?.results && data.results.length > 0) {
      results.value = data.results;
      loading.value = false;
    } else {
      results.value = [];
    }
  };

  return {
    search,
    endpoints,
    query,
    imageFile,
    results,
    loading,
    filters,
  };
});
