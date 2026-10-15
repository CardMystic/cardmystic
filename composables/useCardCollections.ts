import { useInfiniteQuery } from '@tanstack/vue-query';
import type { ComputedRef } from 'vue';
import type {
  CardCollectionCatalog,
  CardCollectionKind,
  CollectionCardsPage,
} from '~/models/collectionModel';
import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';

export function useCardCollections() {
  const request = useRequestFetch();
  const path = useRuntimeConfig().public.backendPath;
  return useAsyncData(
    'card-collections',
    () => request<CardCollectionCatalog>(`${path}/card-collections`),
    { dedupe: 'defer' },
  );
}

export function useCollectionCards(
  kind: CardCollectionKind,
  slug: string,
  enabled: ComputedRef<boolean>,
  filters: ComputedRef<CardSearchFilters>,
) {
  const request = useRequestFetch();
  const path = useRuntimeConfig().public.backendPath;
  const query = useInfiniteQuery({
    queryKey: computed(() => [
      'search',
      'collection',
      kind,
      slug,
      filters.value,
    ]),
    enabled,
    initialPageParam: { offset: 0, release: undefined as string | undefined },
    queryFn: async ({ pageParam, signal }) => {
      const result = await request<CollectionCardsPage>(
        `${path}/card-collections/${kind}/${slug}`,
        {
          query: {
            offset: pageParam.offset,
            limit: 100,
            filters: JSON.stringify(filters.value),
          },
          signal,
        },
      );
      if (pageParam.release && result.dataReleaseId !== pageParam.release)
        throw new Error(
          'The card catalog changed. Refresh this page before loading more cards.',
        );
      return result;
    },
    getNextPageParam: (page) => {
      const offset = page.offset + page.results.length;
      return page.results.length && offset < Math.min(page.total, 10000)
        ? { offset, release: page.dataReleaseId }
        : undefined;
    },
    staleTime: 300000,
    retry: false,
  });
  onServerPrefetch(() =>
    enabled.value ? query.suspense().catch(() => {}) : Promise.resolve(),
  );
  return {
    results: computed(() =>
      query.data.value?.pages.flatMap((page) => page.results),
    ),
    total: computed(() => query.data.value?.pages[0].total),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: computed(() =>
      query.isFetchNextPageError.value ? null : query.error.value,
    ),
    loadMoreError: computed(() =>
      query.isFetchNextPageError.value ? query.error.value : null,
    ),
    canLoadMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage({ cancelRefetch: false }),
    refetch: query.refetch,
  };
}
