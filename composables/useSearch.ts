import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import type { Card } from '~/models/cardModel';
import type {
  WordSearch,
  SimilaritySearch,
  KeywordSearch,
} from '~/models/searchModel';

export type SearchType = 'colbert' | 'similarity' | 'keyword';

/**
 * Composable for Smart/ColBERT search
 */
export function useColbertSearch(
  searchParams: ComputedRef<WordSearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value?.query);
  const queryKey = computed(() => ['search', 'colbert', searchParams.value]);

  const {
    data: searchResults,
    isLoading: isQueryLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendPath}/search/colbert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (response.status === 204 || response.status === 404) return [];
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Network response was not ok');
      }
      if (import.meta.client) {
        window.gtag?.('event', 'conversion', {
          send_to: 'AW-17812762149/ZPjKCMa5u8EcEKXc5K1C',
        });
      }
      return response.json() as Promise<Array<Card>>;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: queryEnabled,
  });

  const isLoading = computed(
    () =>
      isQueryLoading.value ||
      (queryEnabled.value && !searchResults.value && !error.value),
  );

  return {
    searchResults,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Composable for similarity search
 */
export function useSimilaritySearch(
  searchParams: ComputedRef<SimilaritySearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value?.card_name);
  const queryKey = computed(() => ['search', 'similarity', searchParams.value]);

  const {
    data: searchResults,
    isLoading: isQueryLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendPath}/search/similarity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (response.status === 204 || response.status === 404) return [];
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Network response was not ok');
      }
      if (import.meta.client) {
        window.gtag?.('event', 'conversion', {
          send_to: 'AW-17812762149/ZPjKCMa5u8EcEKXc5K1C',
        });
      }
      return response.json() as Promise<Array<Card>>;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: queryEnabled,
  });

  const isLoading = computed(
    () =>
      isQueryLoading.value ||
      (queryEnabled.value && !searchResults.value && !error.value),
  );

  return {
    searchResults,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Composable for keyword search
 */
export function useKeywordSearch(
  searchParams: ComputedRef<KeywordSearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value?.query);

  const {
    data: searchResults,
    isLoading: isQueryLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['search', 'keyword', searchParams.value]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendPath}/search/keyword`,
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
      if (import.meta.client) {
        window.gtag?.('event', 'conversion', {
          send_to: 'AW-17812762149/ZPjKCMa5u8EcEKXc5K1C',
        });
      }
      return response.json() as Promise<Array<Card>>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: queryEnabled,
  });

  const isLoading = computed(
    () =>
      isQueryLoading.value ||
      (queryEnabled.value && !searchResults.value && !error.value),
  );

  return {
    searchResults,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Composable for fetching similar cards (used on card detail page)
 */
export function useSimilarCards(
  cardId: ComputedRef<string>,
  cardName: ComputedRef<string | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!cardName.value);
  const queryKey = computed(() => ['card-details-similar-cards', cardId.value]);

  const {
    data: similarCards,
    isLoading: isSimilarCardsLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!cardName.value) return [];

      const response = await fetch(
        `${config.public.backendPath}/search/similarity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_name: cardName.value,
            limit: 100,
            filters: undefined,
            exclude_card_data: false,
          }),
        },
      );

      if (response.status === 204 || response.status === 404) return [];
      if (!response.ok) {
        throw new Error('Failed to fetch similar cards');
      }

      return response.json() as Promise<Array<Card>>;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: queryEnabled,
  });

  return {
    similarCards,
    isSimilarCardsLoading,
    isFetching,
    error,
    refetch,
  };
}
