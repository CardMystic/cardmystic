import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IWeaviateMagicCardResponse } from '~/types/IVectorBackend';

export const useCardStore = defineStore('card', () => {
  const card: Ref<IWeaviateMagicCardResponse | null> = ref(null);

  return {
    card,
  };
});
