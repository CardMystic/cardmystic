import { useQuery } from '@tanstack/vue-query';
import { useRuntimeConfig } from '#imports';

export function useQueryMetrics() {
  const config = useRuntimeConfig();

  const query = useQuery({
    queryKey: ['totalQueries'],
    queryFn: async () => {
      const response = await $fetch<{ totalQueries: number }>(
        `${config.public.backendUrl}/metrics/query_count`,
      );
      return response.totalQueries;
    },
    // A snapshot is enough for this decorative counter; no background polling.
    staleTime: 1000 * 60 * 5, // Refresh an old snapshot on a later visit.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    totalQueries: query.data,
    isLoading: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
