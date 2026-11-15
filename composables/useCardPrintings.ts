import { useInfiniteQuery } from '@tanstack/vue-query';
import type { Printing } from '~/utils/printings';

/** Begin loading on mount, independently of whether the selection menu is open. */
export function useCardPrintings(oracleId: Ref<string>, search: Ref<string>) {
  const db = import.meta.server ? null : useSupabase();
  const queryText = refDebounced(search, 250);
  const pageSize = 48;
  const query = useInfiniteQuery({
    queryKey: computed(() => [
      'card-printings',
      oracleId.value,
      queryText.value,
    ]),
    initialPageParam: 0,
    enabled: computed(() => !!db && !!oracleId.value),
    staleTime: 10 * 60_000,
    queryFn: async ({ pageParam, signal }) => {
      if (!db) throw new Error('Printings are only loaded in the browser.');
      let request = db
        .from('card_printings')
        .select('*,card_printing_sets!inner(name)')
        .eq('oracle_id', oracleId.value);
      if (queryText.value.trim())
        request = request.ilike(
          'card_printing_sets.name',
          `%${queryText.value.trim().replace(/[%_]/g, '')}%`,
        );
      const { data, error } = await request
        .order('released_at', { ascending: false })
        .order('id')
        .range(pageParam, pageParam + pageSize - 1)
        .abortSignal(signal);
      if (error) throw new Error('Could not load printings.');
      return data as Printing[];
    },
    getNextPageParam: (last, pages) =>
      last.length === pageSize ? pages.length * pageSize : undefined,
  });
  return {
    ...query,
    printings: computed(() => query.data.value?.pages.flat() ?? []),
  };
}
