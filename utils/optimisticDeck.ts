import { shallowReactive } from 'vue';
import type { QueryClient } from '@tanstack/vue-query';
import type { Database } from '~/database.types';
import type { Board } from '~/models/cardListModel';

export type DeckItem = Database['public']['Tables']['card_list_items']['Row'];
export type DeckEdit = (items: DeckItem[]) => DeckItem[];
type Operation = { edit: DeckEdit; pending: boolean };
type Journal = { base: DeckItem[]; operations: Operation[] };

/** Keep edits in order so a failed request cannot undo a later edit. */
export function createOptimisticDeck(client: QueryClient) {
  const journals = shallowReactive(new Map<string, Journal>());
  function items(listId: string, fallback: DeckItem[] | undefined) {
    const journal = journals.get(listId);
    return journal
      ? journal.operations.reduce(
          (rows, operation) => operation.edit(rows),
          journal.base,
        )
      : fallback;
  }
  function begin(listId: string, edit: DeckEdit) {
    void client.cancelQueries({ queryKey: ['list-items', listId] });
    const journal = journals.get(listId) ?? {
      base: client.getQueryData<DeckItem[]>(['list-items', listId]) ?? [],
      operations: [],
    };
    const operation = { edit, pending: true };
    journals.set(listId, {
      ...journal,
      operations: [...journal.operations, operation],
    });
    return operation;
  }
  async function finish(
    listId: string,
    operation: Operation | undefined,
    failed: boolean,
  ) {
    if (!operation) return;
    const current = journals.get(listId);
    if (!current) return;
    operation.pending = false;
    const journal = {
      ...current,
      operations: current.operations.filter(
        (entry) => !failed || entry !== operation,
      ),
    };
    journals.set(listId, journal);
    if (journal.operations.some((entry) => entry.pending)) return;
    // Commit the successful edits locally before refreshing. A failed refresh
    // must not resurrect removed cards or discard confirmed additions.
    client.setQueryData(['list-items', listId], items(listId, []));
    await client.invalidateQueries({ queryKey: ['list-items', listId] });
    if (journals.get(listId) === journal) journals.delete(listId);
    void client.invalidateQueries({ queryKey: ['user-lists'] });
    void client.invalidateQueries({ queryKey: ['card-deck-matches'] });
  }
  return { items, begin, finish };
}

const managers = new WeakMap<
  QueryClient,
  ReturnType<typeof createOptimisticDeck>
>();
export function optimisticDeck(client: QueryClient) {
  let manager = managers.get(client);
  if (!manager) {
    manager = createOptimisticDeck(client);
    managers.set(client, manager);
  }
  return manager;
}

export function addDeckItems(
  listId: string,
  oracleIds: string[],
  board = 'Mainboard',
): DeckEdit {
  return (items) => {
    const next = items.map((item) => ({ ...item }));
    for (const oracleId of oracleIds) {
      const existing = next.find(
        (item) => item.oracle_id === oracleId && item.board === board,
      );
      if (existing) {
        if (!existing.is_commander)
          existing.num_copies = Math.min((existing.num_copies ?? 1) + 1, 100);
      } else
        next.unshift({
          id: `pending:${board}:${oracleId}`,
          list_id: listId,
          oracle_id: oracleId,
          card_id: oracleId,
          board,
          num_copies: 1,
          is_commander: false,
          printing_id: null,
          finish: null,
          created_at: '',
        });
    }
    return next;
  };
}

export function moveDeckItem(
  oracleId: string,
  board: Board,
  fromBoard?: Board,
): DeckEdit {
  return (items) => {
    const sources = items.filter(
      (item) =>
        item.oracle_id === oracleId &&
        item.board !== board &&
        (!fromBoard || item.board === fromBoard),
    );
    if (sources.length !== 1) return items;
    const source = sources[0];
    const target = items.find(
      (item) => item.oracle_id === oracleId && item.board === board,
    );
    if (!target)
      return items.map((item) => (item === source ? { ...item, board } : item));
    return items
      .filter((item) => item !== source)
      .map((item) =>
        item === target
          ? {
              ...item,
              num_copies: target.is_commander
                ? 1
                : Math.min(
                    (target.num_copies ?? 0) + (source.num_copies ?? 0),
                    100,
                  ),
            }
          : item,
      );
  };
}
