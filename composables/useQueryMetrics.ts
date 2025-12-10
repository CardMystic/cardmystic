import { useQuery } from '@tanstack/vue-query';
import { useRuntimeConfig } from '#imports';

export function useQueryMetrics() {
  const config = useRuntimeConfig();

  const query = useQuery({
    queryKey: ['totalQueries'],
    queryFn: async () => {
      const response = await $fetch<{ totalQueries: number }>(
        `/api/metrics/query_count`,
      );
      console.log('Fetched total queries:', response);
      return response.totalQueries;
    },
    refetchInterval: 5000, // near-live updates every 5 seconds
    refetchIntervalInBackground: true,
    staleTime: 4000, // avoids unnecessary requests between intervals
  });

  return {
    totalQueries: query.data,
    isLoading: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
