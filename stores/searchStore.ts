import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  IMagicCardsSearchFilters,
  IWeaviateMagicCardResponse,
  IWeaviateMagicCardSchema,
} from '@/types/IVectorBackend';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
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

  return {
    query,
    results,
    loading,
    filters,
  };
});
