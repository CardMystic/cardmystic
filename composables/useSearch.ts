import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref, type ComputedRef } from 'vue';
import type { Card } from '~/models/cardModel';
import type {
  WordSearch,
  SimilaritySearch,
  KeywordSearch,
} from '~/models/searchModel';

export type SearchType = 'colbert' | 'similarity' | 'keyword';

interface UseSearchOptions<T> {
  searchParams: ComputedRef<T | undefined>;
  searchType: SearchType;
  staleTime?: number;
}

/**
 * Composable for AI/Colbert search
 */
export function useColbertSearch(
  searchParams: ComputedRef<WordSearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value?.query);

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['search', 'colbert', searchParams.value]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/search/colbert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json() as Promise<Array<Card>>;
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

/**
 * Composable for similarity search
 */
export function useSimilaritySearch(
  searchParams: ComputedRef<SimilaritySearch | undefined>,
) {
  const config = useRuntimeConfig();

  const queryEnabled = computed(() => !!searchParams.value?.card_name);

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['search', 'similarity', searchParams.value]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/search/similarity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json() as Promise<Array<Card>>;
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
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['search', 'keyword', searchParams.value]),
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/search/keyword`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams.value),
        },
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json() as Promise<Array<Card>>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: queryEnabled,
  });

  return {
    searchResults,
    isLoading,
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

  const {
    data: similarCards,
    isLoading: isSimilarCardsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: computed(() => ['card-details-similar-cards', cardId.value]),
    queryFn: async () => {
      if (!cardName.value) return [];

      const response = await fetch(
        `${config.public.backendUrl}/search/similarity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_name: cardName.value,
            limit: 41, // Request 41 so we have 40 after removing the first card
            filters: undefined,
            exclude_card_data: false,
          }),
        },
      );

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
    error,
    refetch,
  };
}
