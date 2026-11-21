import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/vue-query';
import {
  addDeckItems,
  createOptimisticDeck,
  moveDeckItem,
} from '~/utils/optimisticDeck';

function setup() {
  const client = new QueryClient();
  client.setQueryData(['list-items', 'deck'], addDeckItems('deck', ['a'])([]));
  return { client, edits: createOptimisticDeck(client) };
}

describe('optimistic deck edits', () => {
  it('moves all copies immediately and keeps the selected printing', () => {
    const items = addDeckItems('deck', ['a', 'a'])([]);
    items[0].printing_id = 'printing';
    items[0].finish = 'foil';
    const moved = moveDeckItem('a', 'Considering', 'Mainboard')(items);
    expect(moved).toEqual([{ ...items[0], board: 'Considering' }]);
    expect(items[0].board).toBe('Mainboard');
  });

  it('merges copies into the destination while retaining its printing and other boards', () => {
    const main = addDeckItems('deck', ['a', 'a'])([]);
    const both = addDeckItems('deck', ['a'], 'Sideboard')(main);
    both[0].printing_id = 'destination-printing';
    const items = addDeckItems('deck', ['a'], 'Considering')(both);
    const moved = moveDeckItem('a', 'Sideboard', 'Mainboard')(items);
    expect(moved).toEqual([items[0], { ...items[1], num_copies: 3 }]);
    const capped = items.map((item) => ({ ...item, num_copies: 80 }));
    expect(
      moveDeckItem('a', 'Sideboard', 'Mainboard')(capped)[1].num_copies,
    ).toBe(100);
    capped[1].is_commander = true;
    expect(
      moveDeckItem('a', 'Sideboard', 'Mainboard')(capped)[1].num_copies,
    ).toBe(1);
  });

  it('rolls back a failed move without undoing a later addition', async () => {
    const { client, edits } = setup();
    const move = edits.begin(
      'deck',
      moveDeckItem('a', 'Considering', 'Mainboard'),
    );
    const add = edits.begin('deck', addDeckItems('deck', ['b']));
    expect(
      edits.items('deck', [])?.find((item) => item.oracle_id === 'a')?.board,
    ).toBe('Considering');
    await edits.finish('deck', move, true);
    expect(
      edits.items('deck', [])?.map((item) => [item.oracle_id, item.board]),
    ).toEqual([
      ['b', 'Mainboard'],
      ['a', 'Mainboard'],
    ]);
    await edits.finish('deck', add, false);
    expect(client.getQueryData(['list-items', 'deck'])).toEqual(
      addDeckItems('deck', ['b'])(addDeckItems('deck', ['a'])([])),
    );
  });

  it('replays sequential moves and restores the last saved board if the second move fails', async () => {
    const { client, edits } = setup();
    const first = edits.begin(
      'deck',
      moveDeckItem('a', 'Considering', 'Mainboard'),
    );
    const second = edits.begin(
      'deck',
      moveDeckItem('a', 'Sideboard', 'Considering'),
    );
    expect(edits.items('deck', [])?.[0].board).toBe('Sideboard');
    await edits.finish('deck', first, false);
    await edits.finish('deck', second, true);
    expect(
      client.getQueryData<Array<{ board: string }>>(['list-items', 'deck'])?.[0]
        .board,
    ).toBe('Considering');
  });

  it('rolls back a failed add without losing a later successful add', async () => {
    const { client, edits } = setup();
    const first = edits.begin('deck', addDeckItems('deck', ['b']));
    const second = edits.begin('deck', addDeckItems('deck', ['c']));
    expect(edits.items('deck', [])?.map((item) => item.oracle_id)).toEqual([
      'c',
      'b',
      'a',
    ]);
    await edits.finish('deck', first, true);
    expect(edits.items('deck', [])?.map((item) => item.oracle_id)).toEqual([
      'c',
      'a',
    ]);
    await edits.finish('deck', second, false);
    expect(client.getQueryData(['list-items', 'deck'])).toEqual(
      addDeckItems('deck', ['c', 'a'])([]).reverse(),
    );
  });

  it('restores a failed removal while retaining later copy edits', async () => {
    const { edits } = setup();
    const remove = edits.begin('deck', (items) =>
      items.filter((item) => item.oracle_id !== 'a'),
    );
    const add = edits.begin('deck', addDeckItems('deck', ['a']));
    await edits.finish('deck', remove, true);
    expect(edits.items('deck', [])?.[0].num_copies).toBe(2);
    await edits.finish('deck', add, false);
  });

  it('keeps newer edits visible while an earlier reconciliation finishes', async () => {
    const { client, edits } = setup();
    let release!: () => void;
    vi.spyOn(client, 'invalidateQueries').mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const first = edits.begin('deck', addDeckItems('deck', ['b']));
    const finishing = edits.finish('deck', first, false);
    const second = edits.begin('deck', addDeckItems('deck', ['c']));
    release();
    await finishing;
    expect(edits.items('deck', [])?.map((item) => item.oracle_id)).toEqual([
      'c',
      'b',
      'a',
    ]);
    await edits.finish('deck', second, true);
    expect(client.getQueryData(['list-items', 'deck'])).toEqual(
      addDeckItems('deck', ['a', 'b'])([]),
    );
  });

  it('keeps another board intact and does not increment a commander', () => {
    const main = addDeckItems('deck', ['a'])([]);
    main[0].is_commander = true;
    const both = addDeckItems('deck', ['a'], 'Sideboard')(main);
    const next = addDeckItems('deck', ['a'])(both);
    expect(next.map((item) => [item.board, item.num_copies])).toEqual([
      ['Sideboard', 1],
      ['Mainboard', 1],
    ]);
  });
});
