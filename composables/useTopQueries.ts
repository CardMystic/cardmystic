import { useQuery } from '@tanstack/vue-query';
import type { TopQuery } from '~/models/topQueryModel';

/**
 * Composable for fetching top/popular queries
 */
export function useTopQueries() {
  const config = useRuntimeConfig();

  const {
    data: topQueries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cache', 'topQueries'],
    queryFn: async () => {
      const response = await fetch(`${config.public.backendUrl}/cache/top`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json() as Promise<TopQuery[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    topQueries,
    isLoading,
    error,
    refetch,
  };
}
