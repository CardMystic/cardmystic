import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';
import type { Card, ScryfallCard } from '~/models/cardModel';

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

/**
 * Composable for fetching cards by name using a single batch request.
 */
export function useCardsByName(names: ComputedRef<string[]> | Ref<string[]>) {
  const config = useRuntimeConfig();

  const queryOptions = {
    queryKey: computed(() => [
      'cards-by-name',
      (names as ComputedRef<string[]>).value ?? (names as Ref<string[]>).value,
    ]),
    queryFn: async (): Promise<Card[]> => {
      const nameList =
        (names as ComputedRef<string[]>).value ??
        (names as Ref<string[]>).value;
      const scryfallCards = await $fetch<ScryfallCard[]>(
        `${config.public.backendUrl}/cards/cards-by-names`,
        {
          method: 'POST',
          body: { cardNames: nameList },
        },
      );
      return (scryfallCards || []).map(
        (cardData) =>
          ({
            card_name: cardData.name,
            card_data: cardData,
          }) as Card,
      );
    },
    enabled: computed(() => {
      const nameList =
        (names as ComputedRef<string[]>).value ??
        (names as Ref<string[]>).value;
      return nameList.length > 0;
    }),
    staleTime: 1000 * 60 * 15,
  };

  const { data, isLoading, error, refetch } = useQuery(queryOptions);

  return {
    cards: data,
    isLoading,
    error,
    refetch,
  };
}
