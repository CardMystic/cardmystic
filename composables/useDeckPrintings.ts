import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Card } from '~/models/cardModel';
import {
  withPrinting,
  type Printing,
  type PrintingSelection,
  type Finish,
} from '~/utils/printings';
import type { GuestBoard } from '~/utils/guestDeck';

export const printingPickerKey: InjectionKey<
  (card: Card, board: string) => void
> = Symbol('printing-picker');

export const printingEditorKey: InjectionKey<{
  selection: (oracleId: string, board: string) => PrintingSelection | undefined;
  save: (
    card: Card,
    board: string,
    printing: Printing | null,
    finish: Finish | null,
  ) => Promise<void>;
}> = Symbol('printing-editor');

export function useDeckPrintings(
  listId: string,
  items: Ref<PrintingSelection[]>,
  isOwner: Ref<boolean>,
) {
  const db = import.meta.server ? null : useSupabase();
  const browser = useBrowserDeckSource();
  const client = useQueryClient();
  const ids = computed(() =>
    [
      ...new Set(
        items.value.flatMap((item) =>
          item.printing_id ? [item.printing_id] : [],
        ),
      ),
    ].sort(),
  );
  const query = useQuery({
    queryKey: computed(() => ['deck-printings', ids.value] as const),
    enabled: computed(() => !!db && ids.value.length > 0),
    staleTime: 10 * 60_000,
    queryFn: async ({ queryKey: [, requestedIds], signal }) => {
      const result: Printing[] = [];
      for (let offset = 0; offset < requestedIds.length; offset += 100) {
        const { data, error } = await db!
          .from('card_printings')
          .select('*,card_printing_sets(name)')
          .in('id', requestedIds.slice(offset, offset + 100))
          .abortSignal(signal);
        if (error)
          throw new Error('Could not load selected printings. Please retry.');
        result.push(...data);
      }
      if (result.length !== requestedIds.length)
        throw new Error(
          'Some selected printings are unavailable. Please retry.',
        );
      return result;
    },
  });
  const byId = computed(
    () => new Map((query.data.value ?? []).map((row) => [row.id, row])),
  );
  const target = ref<{ card: Card; board: string } | null>(null);
  const selection = computed(() =>
    items.value.find(
      (item) =>
        item.oracle_id === target.value?.card.card_data.oracle_id &&
        item.board === target.value?.board,
    ),
  );
  provide('printingPickerEnabled', isOwner);
  provide(printingPickerKey, (card, board) => {
    if (isOwner.value) target.value = { card, board };
  });
  provide(printingEditorKey, {
    selection: (oracleId, board) =>
      items.value.find(
        (item) => item.oracle_id === oracleId && item.board === board,
      ),
    save: saveForCard,
  });
  function display(
    card: Card | undefined,
    item: PrintingSelection,
  ): Card | undefined {
    if (!card) return;
    return {
      ...card,
      card_data: withPrinting(
        card.card_data,
        item,
        item.printing_id ? byId.value.get(item.printing_id) : undefined,
      ),
    };
  }
  async function save(printing: Printing | null, finish: Finish | null) {
    if (!target.value || !isOwner.value)
      throw new Error('This deck is read-only.');
    const { card, board } = target.value;
    await saveForCard(card, board, printing, finish);
    target.value = null;
  }
  async function saveForCard(
    card: Card,
    board: string,
    printing: Printing | null,
    finish: Finish | null,
  ) {
    if (!isOwner.value) throw new Error('This deck is read-only.');
    const update = {
      oracle_id: card.card_data.oracle_id,
      board,
      printing_id: printing?.id ?? null,
      finish,
    };
    if (browser)
      await browser.edit((next) => {
        const entry = next.cards.find(
          (entry) =>
            entry.name === card.card_data.name &&
            entry.board === (board as GuestBoard),
        );
        if (!entry) throw new Error('Card not found in this board.');
        entry.printingId = printing?.id;
        entry.finish = finish ?? undefined;
      });
    else {
      const { error } = await db!.rpc('set_deck_printings', {
        p_list: listId,
        p_items: [update],
      });
      if (error) throw new Error('Could not save this printing. Please retry.');
    }
    // Seed the new batch before refreshing deck rows to avoid briefly showing default art.
    const nextIds = [
      ...new Set(
        items.value.flatMap((item) => {
          const id =
            item.oracle_id === update.oracle_id && item.board === board
              ? update.printing_id
              : item.printing_id;
          return id ? [id] : [];
        }),
      ),
    ].sort();
    const known = new Map(byId.value);
    if (printing) known.set(printing.id, printing);
    if (nextIds.every((id) => known.has(id)))
      client.setQueryData(
        ['deck-printings', nextIds],
        nextIds.map((id) => known.get(id)!),
      );
    await Promise.all([
      client.invalidateQueries({ queryKey: ['list-items', listId] }),
      client.invalidateQueries({
        queryKey: ['discovery', 'public-decklist', listId],
      }),
      client.invalidateQueries({ queryKey: ['user-lists'] }),
    ]);
  }
  return {
    target,
    selection,
    byId,
    display,
    save,
    error: query.error,
    retry: query.refetch,
    loading: query.isFetching,
  };
}
