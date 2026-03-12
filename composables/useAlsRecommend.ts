import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import type { Card } from '~/models/cardModel';

export interface AlsRecommendRequest {
  cards?: string[];
  limit: number;
  query?: string;
  commanders?: string[];
}

export function useAlsRecommend(
  searchParams: ComputedRef<AlsRecommendRequest | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(
    () =>
      !!searchParams.value &&
      ((searchParams.value.cards && searchParams.value.cards.length > 0) ||
        (searchParams.value.commanders &&
          searchParams.value.commanders.length > 0)),
  );

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['als-recommend', searchParams.value]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/als/recommend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to fetch recommendations');
      }
      return response.json() as Promise<Card[]>;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: queryEnabled,
  });

  return {
    searchResults,
    isLoading,
    error,
    refetch,
  };
}
