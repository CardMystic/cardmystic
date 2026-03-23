import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import type {
  TopCardsSearch,
  TopCommandersSearch,
  DeckStatsResponse,
} from '~/models/deckStatsModel';

export function useTopCardsSearch(
  searchParams: ComputedRef<TopCardsSearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value);

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['deck-stats', 'top-cards', searchParams.value]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/deck-stats/top-cards`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Network response was not ok');
      }
      const data = (await response.json()) as DeckStatsResponse;
      return data.results;
    },
    staleTime: 1000 * 60 * 15,
    enabled: queryEnabled,
  });

  return {
    searchResults,
    isLoading,
    error,
    refetch,
  };
}

export function useTopCommandersSearch(
  searchParams: ComputedRef<TopCommandersSearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value);

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => [
      'deck-stats',
      'top-commanders',
      searchParams.value,
    ]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/deck-stats/top-commanders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Network response was not ok');
      }
      const data = (await response.json()) as DeckStatsResponse;
      return data.results;
    },
    staleTime: 1000 * 60 * 15,
    enabled: queryEnabled,
  });

  return {
    searchResults,
    isLoading,
    error,
    refetch,
  };
}
