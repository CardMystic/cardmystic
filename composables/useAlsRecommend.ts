import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';
import type { Card } from '~/models/cardModel';

export interface AlsRecommendRequest {
  cards?: string[];
  limit: number;
  query?: string;
  commanders?: string[];
}

interface AlsRecommendResponse {
  not_found?: string[];
  results: Card[];
}

export function useAlsRecommend(
  searchParams: ComputedRef<AlsRecommendRequest | undefined>,
) {
  const config = useRuntimeConfig();
  const notFound: Ref<string[]> = ref([]);

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
      const body = (await response.json()) as AlsRecommendResponse;
      notFound.value = body.not_found ?? [];
      return body.results ?? [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: queryEnabled,
  });

  return {
    searchResults,
    isLoading,
    error,
    notFound,
    refetch,
  };
}
