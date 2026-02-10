import { useQuery } from '@tanstack/vue-query';
import { useRuntimeConfig } from '#imports';

export function useQueryMetrics() {
  const config = useRuntimeConfig();
  const REFETCH_INTERVAL = 10000;

  const query = useQuery({
    queryKey: ['totalQueries'],
    queryFn: async () => {
      const response = await $fetch<{ totalQueries: number }>(
        `/api/metrics/query_count`,
      );
      return response.totalQueries;
    },
    refetchInterval: REFETCH_INTERVAL, // near-live updates every 10 seconds
    refetchIntervalInBackground: false, // pause updates when the app is not active
    staleTime: REFETCH_INTERVAL, // avoids unnecessary requests between intervals
  });

  return {
    totalQueries: query.data,
    isLoading: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
