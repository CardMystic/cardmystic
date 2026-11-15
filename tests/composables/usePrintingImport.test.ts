import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePrintingImport } from '~/composables/usePrintingImport';

const { invalidateQueries } = vi.hoisted(() => ({
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

const entries = Array.from({ length: 2001 }, (_, index) => ({
  name: `Card ${index}`,
  quantity: 1,
  board: 'Mainboard' as const,
  commander: false,
  printingId: `printing-${index}`,
  finish: 'foil' as const,
}));
const rpc = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockReset().mockResolvedValue({ error: null });
  vi.stubGlobal('useBrowserDeckSource', () => null);
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { backendPath: '/api/backend' },
  }));
  vi.stubGlobal(
    '$fetch',
    async (_url: string, options: { body: { cardNames: string[] } }) =>
      options.body.cardNames.map((name) => ({ name, oracle_id: name })),
  );
  vi.stubGlobal('useSupabase', () => ({
    rpc,
    from: () => ({
      select: () => ({
        in: async (_column: string, ids: string[]) => ({
          data: ids.map((id) => ({
            id,
            oracle_id: `Card ${id.slice('printing-'.length)}`,
            finish_mask: 3,
          })),
          error: null,
        }),
      }),
    }),
  }));
});
afterEach(() => vi.unstubAllGlobals());

it('validates a large collection before saving every printing in bounded batches', async () => {
  const save = await usePrintingImport('collection').prepare(entries);
  expect(rpc).not.toHaveBeenCalled();
  await save();
  expect(rpc.mock.calls.map(([, args]) => args.p_items.length)).toEqual([
    1000, 1000, 1,
  ]);
  expect(rpc.mock.calls.flatMap(([, args]) => args.p_items)).toEqual(
    entries.map((entry) => ({
      oracle_id: entry.name,
      board: entry.board,
      printing_id: entry.printingId,
      finish: entry.finish,
    })),
  );
  expect(
    rpc.mock.calls.every(
      ([name, args]) =>
        name === 'set_deck_printings' && args.p_list === 'collection',
    ),
  ).toBe(true);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['list-items', 'collection'],
  });
});

it('stops after a failed batch and refreshes the selections that were already saved', async () => {
  rpc
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: new Error('offline') });
  const save = await usePrintingImport('collection').prepare(entries);
  await expect(save()).rejects.toThrow(
    'some printing choices could not be saved',
  );
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['list-items', 'collection'],
  });
});
