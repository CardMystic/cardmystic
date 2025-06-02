import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  IMagicCardsSearchFilters,
  IWeaviateMagicCardResponse,
} from '@/types/IVectorBackend';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const imageFile = ref<File | null>(null);
  const results: Ref<IWeaviateMagicCardResponse[]> = ref<any[]>([]);
  const loading = ref(false);

  // Filters
  const filters: Ref<IMagicCardsSearchFilters> = ref({
    selectedCardTypes: [] as string[],
    selectedColorFilterOption: 'Match Exactly',
    selectedColors: {
      Red: false,
      Blue: false,
      Green: false,
      White: false,
      Black: false,
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
      name: 'Vector',
      tooltip: 'Search by Meaning using AI',
      endpoint: '/vector_search',
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

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();

    if (data?.objects) {
      const resultsWithConfidence = data.objects.map((result: any) => {
        result.metadata.confidence = 1 - result.metadata.distance;
        return result;
      });

      results.value = resultsWithConfidence.sort(
        (a: any, b: any) => b.metadata.confidence - a.metadata.confidence,
      );
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
