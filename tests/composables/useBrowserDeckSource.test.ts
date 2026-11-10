import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref, type Ref } from 'vue';
import {
  provideBrowserDeckSource,
  BROWSER_DECK_ID,
} from '~/composables/useBrowserDeckSource';
import { useGuestDeck } from '~/composables/useGuestDeck';
import {
  emptyGuestDeck,
  GUEST_DECK_KEY,
  LEGACY_GUEST_DECK_KEY,
  type GuestDeck,
} from '~/utils/guestDeck';
import type { ScryfallCard } from '~/models/cardModel';

vi.mock('vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue')>()),
  provide: vi.fn(),
}));

const catalog = [
  'Island',
  'Sol Ring',
  'Negate',
  'Partner A',
  'Partner B',
  'Other Commander',
].map(
  (name, index) =>
    ({
      name,
      oracle_id: `oracle-${index}`,
      color_identity: [],
    }) as unknown as ScryfallCard,
);
const fetchCards = vi.fn();
let stored: Map<string, string>;
let storage: {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
};
let mounted: (() => void)[];
let scope: ReturnType<typeof effectScope>;

beforeEach(() => {
  stored = new Map();
  mounted = [];
  scope = effectScope();
  storage = {
    getItem: vi.fn((key: string) => stored.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => stored.set(key, value)),
    removeItem: vi.fn((key: string) => stored.delete(key)),
  };
  const state = new Map<string, Ref>();
  vi.stubGlobal('useState', (key: string, initial: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(initial()));
    return state.get(key);
  });
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('onMounted', (callback: () => void) => mounted.push(callback));
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('useGuestDeck', useGuestDeck);
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { backendPath: '/api/backend' },
  }));
  vi.stubGlobal('useCommanders', () => ({
    data: ref(catalog.slice(3).map((card) => card.name)),
  }));
  vi.stubGlobal('usePartnerCommanders', () => ({
    data: ref({
      partner: ['Partner A', 'Partner B'],
      chooseABackground: [],
      background: [],
      doctorsCompanion: [],
      timeLordDoctor: [],
    }),
  }));
  vi.stubGlobal('useCardsByName', () => ({
    cards: ref([]),
    isLoading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  }));
  fetchCards
    .mockReset()
    .mockImplementation(
      async (
        url: string,
        request: { body: { cardNames?: string[]; oracleIds?: string[] } },
      ) => {
        expect(url).toMatch(
          /^\/api\/backend\/cards\/cards-by-(names|oracle-ids)$/,
        );
        return catalog.filter(
          (card) =>
            request.body.cardNames?.some(
              (name) => name.toLowerCase() === card.name.toLowerCase(),
            ) || request.body.oracleIds?.includes(card.oracle_id),
        );
      },
    );
  vi.stubGlobal('$fetch', fetchCards);
});

afterEach(() => {
  scope.stop();
  vi.unstubAllGlobals();
});

function editor(initial?: GuestDeck) {
  if (initial)
    stored.set(
      GUEST_DECK_KEY,
      JSON.stringify({ version: 2, activeIndex: 0, decks: [initial] }),
    );
  const source = scope.run(provideBrowserDeckSource)!;
  mounted.splice(0).forEach((callback) => callback());
  return source;
}
function savedDeck(): GuestDeck {
  return JSON.parse(stored.get(GUEST_DECK_KEY)!).decks[0];
}
function snapshot(source: ReturnType<typeof editor>): GuestDeck {
  return JSON.parse(JSON.stringify(source.draft.value));
}

describe('browser draft editing and persistence', () => {
  it('accepts alternate names returned as canonical cards and combines their quantities', async () => {
    const source = editor();
    const card = { ...catalog[1], name_aliases: ['Alternate Sol Ring'] };
    fetchCards.mockResolvedValueOnce([card]);
    await source.addNames(['2 Alternate Sol Ring', 'Sol Ring']);
    expect(savedDeck().cards).toEqual([
      { name: 'Sol Ring', board: 'Mainboard', quantity: 3 },
    ]);
    await source.addNames(['alternate sol ring']);
    expect(savedDeck().cards[0].quantity).toBe(4);
    expect(fetchCards).toHaveBeenCalledTimes(1);
  });
  it('adds canonical names and quantities independently on each board without account requests', async () => {
    const source = editor();
    await source.addNames(['2 island', 'Sol Ring']);
    await source.addNames(['3 Island']);
    await source.addIds([catalog[0].oracle_id], 'Sideboard');
    expect(savedDeck().cards).toEqual([
      { name: 'Island', board: 'Mainboard', quantity: 5 },
      { name: 'Sol Ring', board: 'Mainboard', quantity: 1 },
      { name: 'Island', board: 'Sideboard', quantity: 1 },
    ]);
    expect(source.items.value.map((item) => item.list_id)).toEqual([
      BROWSER_DECK_ID,
      BROWSER_DECK_ID,
      BROWSER_DECK_ID,
    ]);
    expect(source.cards.value).toHaveLength(2);
  });

  it('rejects unknown names before replacing any board and allows a corrected retry', async () => {
    const source = editor();
    await source.addNames(['Sol Ring']);
    await source.addNames(['Negate'], 'Sideboard');
    const before = snapshot(source);
    const entries = [
      {
        board: 'Mainboard' as const,
        cards: [{ name: 'Island', num_copies: 7 }],
      },
      {
        board: 'Sideboard' as const,
        cards: [{ name: 'Not a card', num_copies: 1 }],
      },
    ];
    await expect(
      source.bulkEdit({ listId: BROWSER_DECK_ID, entries }),
    ).rejects.toThrow('Could not find: Not a card');
    expect(snapshot(source)).toEqual(before);
    expect(savedDeck()).toEqual(before);
    entries[1].cards[0].name = 'Negate';
    await source.bulkEdit({ listId: BROWSER_DECK_ID, entries });
    expect(savedDeck().cards).toEqual([
      { name: 'Island', board: 'Mainboard', quantity: 7 },
      { name: 'Negate', board: 'Sideboard', quantity: 1 },
    ]);
  });

  it('keeps the entire draft after a failed lookup or incomplete ID response', async () => {
    const source = editor();
    await source.addNames(['Island']);
    const before = snapshot(source);
    fetchCards.mockRejectedValueOnce(new Error('offline'));
    await expect(source.addNames(['Sol Ring'])).rejects.toThrow('offline');
    await expect(
      source.addIds([catalog[1].oracle_id, 'missing-id']),
    ).rejects.toThrow('Some cards could not be loaded');
    expect(snapshot(source)).toEqual(before);
    expect(savedDeck()).toEqual(before);
    await source.addNames(['Sol Ring']);
    expect(savedDeck().cards).toHaveLength(2);
  });

  it('bulk replacement preserves commanders and unsubmitted boards', async () => {
    const source = editor();
    await source.setCommander('Partner A');
    await source.addNames(['Sol Ring']);
    await source.addNames(['Negate'], 'Considering');
    await source.bulkEdit({
      listId: BROWSER_DECK_ID,
      entries: [
        {
          board: 'Mainboard',
          cards: [
            { name: 'island', num_copies: 8 },
            { name: 'Partner A', num_copies: 4 },
          ],
        },
      ],
    });
    expect(savedDeck().commanders).toEqual(['Partner A']);
    expect(savedDeck().cards).toEqual([
      { name: 'Partner A', board: 'Mainboard', quantity: 1 },
      { name: 'Negate', board: 'Considering', quantity: 1 },
      { name: 'Island', board: 'Mainboard', quantity: 8 },
    ]);
    await source.bulkEdit({
      listId: BROWSER_DECK_ID,
      entries: [{ board: 'Mainboard', cards: [] }],
    });
    expect(savedDeck().cards.map((card) => card.name)).toEqual([
      'Partner A',
      'Negate',
    ]);
  });

  it('merges copies when moving boards and removes only the selected board', async () => {
    const source = editor();
    await source.addNames(['3 Island']);
    await source.addNames(['2 Island'], 'Sideboard');
    source.move('Island', 'Sideboard');
    expect(savedDeck().cards).toEqual([
      { name: 'Island', board: 'Sideboard', quantity: 5 },
    ]);
    await source.addNames(['Island']);
    source.remove(catalog[0].oracle_id, 'Sideboard');
    expect(savedDeck().cards).toEqual([
      { name: 'Island', board: 'Mainboard', quantity: 1 },
    ]);
    source.copies('Island', 0);
    expect(savedDeck().cards).toEqual([]);
  });

  it('rolls back both boards if merging would exceed the copy limit', async () => {
    const source = editor();
    await source.addNames(['80 Island']);
    await source.addNames(['30 Island'], 'Sideboard');
    const before = snapshot(source);
    expect(() => source.move('Island', 'Sideboard')).toThrow();
    expect(() => source.move('Negate', 'Sideboard')).toThrow('Card not found');
    expect(snapshot(source)).toEqual(before);
    expect(savedDeck()).toEqual(before);
  });

  it('pairs valid partners, replaces incompatible commanders, and keeps one mainboard copy', async () => {
    const source = editor();
    await source.setCommander('Partner A');
    await source.setCommander('Partner B');
    expect(savedDeck().commanders).toEqual(['Partner A', 'Partner B']);
    await source.addNames(['Partner A']);
    expect(() => source.copies('Partner A', 2)).toThrow('one copy');
    await source.addNames(['Partner A'], 'Sideboard');
    expect(() => source.move('Partner A', 'Mainboard', 'Sideboard')).toThrow(
      'one copy',
    );
    expect(
      savedDeck().cards.filter((card) => card.name === 'Partner A'),
    ).toHaveLength(2);
    await expect(source.setCommander('Island')).rejects.toThrow(
      'Choose a valid commander',
    );
    expect(savedDeck().commanders).toEqual(['Partner A', 'Partner B']);
    await source.setCommander('Other Commander');
    expect(savedDeck().commanders).toEqual(['Other Commander']);
    expect(
      savedDeck().cards.find(
        (card) => card.name === 'Partner A' && card.board === 'Mainboard',
      )?.quantity,
    ).toBe(1);
  });

  it('clears commander designation when moved, explicitly cleared, or changing format', async () => {
    const source = editor();
    await source.setCommander('Partner A');
    source.move('Partner A', 'Considering');
    expect(savedDeck().commanders).toEqual([]);
    await source.setCommander('Partner B');
    source.clearCommander(catalog[4].oracle_id);
    expect(savedDeck().commanders).toEqual([]);
    await source.setCommander('Partner B');
    expect(source.updateFormat('Modern')).toEqual({
      format: 'Modern',
      commandersCleared: true,
    });
    expect(savedDeck().commanders).toEqual([]);
    await expect(source.setCommander('Partner A')).rejects.toThrow(
      'Choose Commander format first',
    );
    expect(savedDeck().format).toBe('Modern');
  });

  it('blocks edits and reset while an account save is pending', async () => {
    const initial = {
      ...emptyGuestDeck(),
      pendingSave: {
        userId: '00000000-0000-4000-8000-000000000001',
        listId: '00000000-0000-4000-8000-000000000002',
      },
    };
    const source = editor(initial);
    await expect(source.addNames(['Island'])).rejects.toThrow('Finish saving');
    await expect(
      source.bulkEdit({
        listId: BROWSER_DECK_ID,
        entries: [{ board: 'Mainboard', cards: [] }],
      }),
    ).rejects.toThrow('Finish saving');
    expect(() => source.update({ name: 'Changed' })).toThrow('Finish saving');
    expect(() => source.reset()).toThrow('Finish saving');
    expect(savedDeck()).toEqual(initial);
  });

  it('persists metadata and resets cards and settings together', async () => {
    const source = editor();
    await source.setCommander('Partner A');
    source.update({ name: 'My deck', description: 'Testing', bracket: 3 });
    source.avatar('Partner A');
    expect(savedDeck()).toMatchObject({
      name: 'My deck',
      description: 'Testing',
      bracket: 3,
      avatarCardName: 'Partner A',
    });
    expect(source.list.value).toMatchObject({
      name: 'My deck',
      description: 'Testing',
      bracket: 3,
      avatar_card_name: 'Partner A',
    });
    source.reset();
    expect(savedDeck()).toEqual(emptyGuestDeck());
    expect(source.items.value).toEqual([]);
  });

  it('keeps edits in memory on storage failure and saves them after storage recovers', async () => {
    const source = editor();
    await source.addNames(['Island']);
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    await source.addNames(['Sol Ring']);
    expect(source.storageError.value).toContain('could not be saved');
    expect(source.draft.value.cards).toHaveLength(2);
    expect(savedDeck().cards).toHaveLength(1);
    source.update({ name: 'Recovered' });
    expect(source.storageError.value).toBe('');
    expect(savedDeck().cards).toHaveLength(2);
    expect(savedDeck().name).toBe('Recovered');
  });

  it('reports corrupt storage without overwriting the original data on load', () => {
    stored.set(GUEST_DECK_KEY, '{broken');
    const source = editor();
    expect(source.ready.value).toBe(true);
    expect(source.storageError.value).toContain('could not be loaded');
    expect(stored.get(GUEST_DECK_KEY)).toBe('{broken');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('only removes legacy storage after a successful write', async () => {
    const initial = {
      ...emptyGuestDeck(),
      name: 'Legacy deck',
      cards: [{ name: 'Island', board: 'Mainboard' as const, quantity: 4 }],
    };
    stored.set(LEGACY_GUEST_DECK_KEY, JSON.stringify(initial));
    const source = editor();
    expect(snapshot(source)).toEqual(initial);
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('quota');
    });
    source.update({ name: 'Updated legacy deck' });
    expect(stored.has(LEGACY_GUEST_DECK_KEY)).toBe(true);
    source.update({ description: 'Recovered' });
    expect(stored.has(LEGACY_GUEST_DECK_KEY)).toBe(false);
    expect(savedDeck()).toMatchObject({
      name: 'Updated legacy deck',
      description: 'Recovered',
      cards: initial.cards,
    });
  });
});
