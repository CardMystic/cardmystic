import { useQuery } from '@tanstack/vue-query';

/** The backend's curated cache list also powers homepage and input suggestions. */
export function usePopularQueries() {
  const config = useRuntimeConfig();
  const {
    data: popularQueries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cache', 'popularQueries'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch(
        `${config.public.backendPath}/cache/popular`,
      );
      if (!response.ok) throw new Error('Failed to load popular searches');
      return response.json();
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return { popularQueries, isLoading, error };
}
