import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import type { Card } from '~/models/cardModel';
import type {
  TopCardsSearch,
  TopCommandersSearch,
  TopCardsResponse,
  TopCommandersResponse,
  PopularByCommanderSearch,
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
      const data = (await response.json()) as TopCardsResponse;
      return data.results.map(
        (result): Card => ({
          card_name: result.card_name,
          card_data: result.card_data,
          rank: result.count,
          popularity: result.popularity,
          ai_raw_score: result.ai_raw_score,
          ai_normalized_score: result.ai_normalized_score,
        }),
      );
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
      const data = (await response.json()) as TopCommandersResponse;
      return data.results.map(
        (result): Card => ({
          card_name: result.card_data[0]?.name ?? result.commanders[0],
          card_data: result.card_data[0],
          partner_card_data:
            result.card_data.length > 1 ? result.card_data[1] : undefined,
          rank: result.count,
          popularity: result.popularity,
          ai_raw_score: result.ai_raw_score,
          ai_normalized_score: result.ai_normalized_score,
        }),
      );
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

export function usePopularByCommander(
  searchParams: ComputedRef<PopularByCommanderSearch | undefined>,
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
      'popular-by-commander',
      searchParams.value,
    ]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/deck-stats/popular-by-commander`,
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
      const data = (await response.json()) as TopCardsResponse;
      return data.results.map(
        (result): Card => ({
          card_name: result.card_name,
          card_data: result.card_data,
          rank: result.count,
          popularity: result.popularity,
          ai_raw_score: result.ai_raw_score,
          ai_normalized_score: result.ai_normalized_score,
        }),
      );
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
