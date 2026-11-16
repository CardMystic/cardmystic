import { useQuery } from '@tanstack/vue-query';
import type { Printing } from '~/utils/printings';
import { parseMarkdownCardReference } from '~/utils/markdownCardReference';

export function useMarkdownPrintings(references: Ref<string[]>) {
  const db = import.meta.server ? null : useSupabase();
  const ids = computed(() =>
    [
      ...new Set(
        references.value.flatMap((value) => {
          const id = parseMarkdownCardReference(value).printingId;
          return id ? [id] : [];
        }),
      ),
    ].sort(),
  );
  const chosen = shallowRef(new Map<string, Printing>());
  const query = useQuery({
    queryKey: computed(() => ['markdown-printings', ids.value]),
    enabled: computed(() => !!db && ids.value.length > 0),
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const rows: Printing[] = [];
      for (let offset = 0; offset < ids.value.length; offset += 100) {
        const { data, error } = await db!
          .from('card_printings')
          .select('*,card_printing_sets(name)')
          .in('id', ids.value.slice(offset, offset + 100));
        if (error) throw new Error('Could not load selected printings.');
        rows.push(...data);
      }
      return rows;
    },
  });
  return {
    byId: computed(
      () =>
        new Map([
          ...chosen.value,
          ...(query.data.value ?? []).map((row) => [row.id, row] as const),
        ]),
    ),
    remember: (printing: Printing) => {
      chosen.value = new Map([...chosen.value, [printing.id, printing]]);
    },
  };
}
