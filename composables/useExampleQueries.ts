import { useQuery } from '@tanstack/vue-query';
import type { ExampleQueryResponse } from '~/models/searchModel';

/**
 * Composable for fetching example queries
 */
export function useExampleQueries() {
  const config = useRuntimeConfig();

  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['search', 'example'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/search/example`,
        {
          method: 'GET',
        },
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json() as Promise<ExampleQueryResponse>;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  return {
    results,
    isLoading,
    error,
    refetch,
  };
}
