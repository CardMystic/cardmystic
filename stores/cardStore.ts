import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ICardResult } from '~/types/IColbert';

export const useCardStore = defineStore('card', () => {
  const card: Ref<ICardResult | null> = ref(null);

  return {
    card,
  };
});
