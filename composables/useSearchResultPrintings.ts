import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/vue-query';
import type { Card, ScryfallCard } from '~/models/cardModel';
import { fetchAllRows } from '~/utils/fetchAllRows';
import {
  guestDefaultPrintingNames,
  readGuestDefaultPrinting,
} from '~/utils/guestDefaultPrinting';
import { withPrinting, type Finish, type Printing } from '~/utils/printings';

type Preference = { key: string; printing_id: string; finish: string };
const preferenceKey = (account: string | null) =>
  ['search-printing-preferences', account] as const;

export async function cacheSearchPrintingChoice(
  client: QueryClient,
  account: string | null,
  card: ScryfallCard,
  printing: Printing | null,
  finish: Finish | null,
) {
  const queryKey = preferenceKey(account);
  await client.cancelQueries({ queryKey, exact: true });
  if (printing)
    client.setQueryData(['search-printing-row', printing.id], printing);
  const key = account ? card.oracle_id : card.name.trim().toLowerCase();
  // An inactive search must see this edit on its very next render.
  client.setQueryData<Preference[]>(queryKey, (previous) => {
    if (!previous) return undefined;
    const updated = previous.filter((pref) => pref.key !== key);
    if (printing && finish)
      updated.push({ key, printing_id: printing.id, finish });
    return updated;
  });
  if (!client.getQueryData(queryKey))
    await client.invalidateQueries({ queryKey, exact: true });
}

export function useSearchResultPrintings(
  results: Readonly<Ref<Card[] | undefined>>,
) {
  const db = import.meta.server ? null : useSupabase();
  const client = useQueryClient();
  const { userProfile, loading: loadingUser } = useUserProfile();
  const mounted = ref(false);
  onMounted(() => {
    mounted.value = true;
  });

  // Share this small index across search pages, including a cached empty list.
  const preferences = useQuery({
    queryKey: computed(() => preferenceKey(userProfile.value?.id ?? null)),
    enabled: computed(
      () =>
        mounted.value &&
        userProfile.value !== undefined &&
        !!results.value?.length,
    ),
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async ({ queryKey: [, account], signal }) => {
      if (!account) {
        return guestDefaultPrintingNames().flatMap((name) => {
          const choice = readGuestDefaultPrinting(name);
          return choice
            ? [
                {
                  key: name,
                  printing_id: choice.printingId,
                  finish: choice.finish,
                },
              ]
            : [];
        });
      }
      const { data, error } = await fetchAllRows((from, to) =>
        db!
          .from('user_default_printings')
          .select('oracle_id,printing_id,finish')
          .eq('user_id', account)
          .order('oracle_id')
          .range(from, to)
          .abortSignal(signal),
      );
      if (error) throw error;
      return data.map((row) => ({
        key: row.oracle_id,
        printing_id: row.printing_id,
        finish: row.finish,
      }));
    },
  });
  const byCard = computed(
    () =>
      new Map(preferences.data.value?.map((pref) => [pref.key, pref] as const)),
  );
  function preference(card: ScryfallCard) {
    return byCard.value.get(
      userProfile.value ? card.oracle_id : card.name.trim().toLowerCase(),
    );
  }
  const ids = computed(() => {
    const matches = new Set<string>();
    if (mounted.value && byCard.value.size) {
      for (const result of results.value ?? []) {
        for (const card of [result.card_data, result.partner_card_data]) {
          const id = card && preference(card)?.printing_id;
          if (id) matches.add(id);
        }
      }
    }
    return [...matches].sort();
  });
  const metadata = useQuery({
    queryKey: computed(() => ['search-result-printings', ids.value] as const),
    enabled: computed(() => ids.value.length > 0),
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async ({ queryKey: [, printingIds], signal }) => {
      const rows: Printing[] = [];
      const missing: string[] = [];
      for (const id of printingIds) {
        const cached = client.getQueryState<Printing>([
          'search-printing-row',
          id,
        ]);
        if (cached?.data && Date.now() - cached.dataUpdatedAt < 10 * 60_000)
          rows.push(cached.data);
        else missing.push(id);
      }
      for (let offset = 0; offset < missing.length; offset += 80) {
        const { data, error } = await db!
          .from('card_printings')
          .select('*,card_printing_sets(name)')
          .in('id', missing.slice(offset, offset + 80))
          .abortSignal(signal);
        if (error) throw error;
        for (const row of data)
          client.setQueryData(['search-printing-row', row.id], row);
        rows.push(...data);
      }
      return rows;
    },
  });
  const printings = computed(() => {
    const rows = new Map(
      metadata.data.value?.map((row) => [row.id, row] as const),
    );
    for (const id of ids.value) {
      const cached = client.getQueryData<Printing>(['search-printing-row', id]);
      if (cached && !rows.has(id)) rows.set(id, cached);
    }
    return rows;
  });
  function pending(result: Card) {
    if (!results.value?.length) return false;
    if (!mounted.value || loadingUser.value) return true;
    if (userProfile.value === undefined) return false;
    if (preferences.isPending.value) return true;
    return (
      metadata.isPending.value &&
      [result.card_data, result.partner_card_data].some((card) => {
        const id = card && preference(card)?.printing_id;
        return id && !printings.value.has(id);
      })
    );
  }
  function display(card: ScryfallCard) {
    const choice = preference(card);
    const row = choice && printings.value.get(choice.printing_id);
    if (!choice || !row || row.oracle_id !== card.oracle_id) return card;
    return withPrinting(card, { oracle_id: card.oracle_id, ...choice }, row);
  }
  const cards = computed(() => {
    if (!mounted.value || !byCard.value.size || !printings.value.size)
      return results.value;
    return results.value?.map((result) => {
      const card = display(result.card_data);
      const partner =
        result.partner_card_data && display(result.partner_card_data);
      return card === result.card_data && partner === result.partner_card_data
        ? result
        : { ...result, card_data: card, partner_card_data: partner };
    });
  });
  return { cards, pending };
}
