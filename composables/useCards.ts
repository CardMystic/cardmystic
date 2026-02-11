import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';
import type { ScryfallCard } from '~/models/cardModel';

/**
 * Composable for fetching card details by IDs
 */
export function useCardsByIds(
  cardIds: ComputedRef<string[]> | Ref<string[]>,
  queryKeyPrefix: string = 'cards-by-ids',
) {
  const config = useRuntimeConfig();

  const {
    data: cards,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => [
      queryKeyPrefix,
      (cardIds as ComputedRef<string[]>).value ||
        (cardIds as Ref<string[]>).value,
    ]),
    queryFn: async () => {
      const ids =
        (cardIds as ComputedRef<string[]>).value ||
        (cardIds as Ref<string[]>).value;
      if (ids.length === 0) return [];

      const cardsData = await $fetch(
        `${config.public.backendUrl}/cards/cards-by-ids`,
        {
          method: 'POST',
          body: { cardIds: ids },
        },
      );

      return cardsData || [];
    },
    enabled: computed(() => {
      const ids =
        (cardIds as ComputedRef<string[]>).value ||
        (cardIds as Ref<string[]>).value;
      return ids.length > 0;
    }),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  return {
    cards,
    isLoading,
    error,
    refetch,
  };
}
