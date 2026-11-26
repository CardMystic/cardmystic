import { useQueryClient } from '@tanstack/vue-query';
import type { TransferCard } from '~/utils/deckTransfer';
import { printingFinishes, type Printing } from '~/utils/printings';
import type { ScryfallCard } from '~/models/cardModel';
import { fetchAllRows } from '~/utils/fetchAllRows';

/** Resolve and validate printing references before adding any quantities. */
export function usePrintingImport(listId: string) {
  const db = import.meta.server ? null : useSupabase();
  const browser = useBrowserDeckSource();
  const config = useRuntimeConfig();
  const client = useQueryClient();
  async function prepare(entries: TransferCard[]) {
    const wanted = entries.filter(
      (card) => card.printingId || (card.set && card.collectorNumber),
    );
    if (!wanted.length) return async () => {};
    const resolved: {
      entry: TransferCard;
      card: ScryfallCard;
      printing: Printing;
      finish: 'nonfoil' | 'foil' | 'etched';
    }[] = [];
    for (let offset = 0; offset < wanted.length; offset += 100) {
      const batch = wanted.slice(offset, offset + 100);
      const cards = await $fetch<ScryfallCard[]>(
        `${config.public.backendPath}/cards/cards-by-names`,
        { method: 'POST', body: { cardNames: batch.map((card) => card.name) } },
      );
      const rows: Printing[] = [];
      const ids = batch.flatMap((card) =>
        card.printingId ? [card.printingId] : [],
      );
      if (ids.length) {
        const { data, error } = await db!
          .from('card_printings')
          .select('*')
          .in('id', ids);
        if (error)
          throw new Error(
            'Could not resolve imported printings. Please retry.',
          );
        rows.push(...data);
      }
      const sets = [
        ...new Set(batch.flatMap((card) => (card.set ? [card.set] : []))),
      ];
      if (sets.length && cards.length) {
        const { data, error } = await fetchAllRows((from, to) =>
          db!
            .from('card_printings')
            .select('*')
            .in(
              'oracle_id',
              cards.map((card) => card.oracle_id),
            )
            .in('set_code', sets)
            .order('id')
            .range(from, to),
        );
        if (error)
          throw new Error(
            'Could not resolve imported printings. Please retry.',
          );
        rows.push(...(data ?? []));
      }
      for (const entry of batch) {
        const name = entry.name.toLowerCase();
        const card = cards.find((card) =>
          [
            card.name,
            ...(card.name_aliases ?? []),
            ...(card.card_faces?.map((face) => face.name) ?? []),
          ].some((alias) => alias.toLowerCase() === name),
        );
        if (!card) continue; // Normal import reports unknown card names.
        const printing = rows.find(
          (row) =>
            row.oracle_id === card.oracle_id &&
            (entry.printingId
              ? row.id === entry.printingId
              : row.set_code === entry.set &&
                row.collector_number === entry.collectorNumber),
        );
        const finish =
          entry.finish ??
          (printing ? printingFinishes(printing)[0] : undefined);
        if (
          !printing ||
          !finish ||
          !printingFinishes(printing).includes(finish)
        )
          throw new Error(
            `Printing or finish not found for ${entry.name}. No cards were added.`,
          );
        resolved.push({ entry, card, printing, finish });
      }
    }
    return async () => {
      if (!resolved.length) return;
      if (browser)
        await browser.edit((next) => {
          for (const { entry, card, printing, finish } of resolved) {
            const target = next.cards.find(
              (row) => row.name === card.name && row.board === entry.board,
            );
            if (!target) throw new Error(`Card not found: ${entry.name}`);
            target.printingId = printing.id;
            target.finish = finish;
          }
        });
      else {
        try {
          // Match the RPC limit; collections can contain more than 1,000 rows.
          for (let offset = 0; offset < resolved.length; offset += 1000) {
            const { error } = await db!.rpc('set_deck_printings', {
              p_list: listId,
              p_items: resolved
                .slice(offset, offset + 1000)
                .map(({ entry, card, printing, finish }) => ({
                  oracle_id: card.oracle_id,
                  board: entry.board,
                  printing_id: printing.id,
                  finish,
                })),
            });
            if (error)
              throw new Error(
                'Cards were added, but some printing choices could not be saved. Use Set Printing for the remaining cards.',
              );
          }
        } finally {
          // Show completed batches even if a later request failed.
          await client.invalidateQueries({ queryKey: ['list-items', listId] });
        }
      }
    };
  }
  return { prepare };
}
