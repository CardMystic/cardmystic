import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { computed, createSSRApp, defineComponent, h, ref, type Ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  provideDeckbuilder,
  useDeckbuilder,
} from '~/composables/useDeckbuilder';

const mutateAsync = vi.fn();
const notify = vi.fn();
const cardLists = vi.fn(() => ({
  addCardsByNameToListMutation: { mutateAsync },
}));
beforeEach(() => {
  const state = new Map<string, Ref>();
  vi.stubGlobal('useState', (key: string, initial: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(initial()));
    return state.get(key);
  });
  vi.stubGlobal('computed', computed);
  cardLists.mockClear();
  vi.stubGlobal('useCardLists', cardLists);
  vi.stubGlobal('useToast', () => ({ add: notify }));
  mutateAsync.mockReset().mockResolvedValue({ invalidCardNames: [] });
  notify.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

it('shares one parsed deck and mutation scope across a result list', async () => {
  const stores: ReturnType<typeof useDeckbuilder>[] = [];
  const Card = defineComponent({
    setup() {
      stores.push(useDeckbuilder());
      return () => h('span');
    },
  });
  const Results = defineComponent({
    setup() {
      stores.push(provideDeckbuilder());
      return () => Array.from({ length: 200 }, () => h(Card));
    },
  });
  const app = createSSRApp({
    setup() {
      const source = provideDeckbuilder();
      source.decklist.value = '2 Island\nSol Ring';
      stores.push(source);
      return () => h(Results);
    },
  });
  await renderToString(app);
  expect(stores).toHaveLength(202);
  expect(new Set(stores).size).toBe(1);
  expect(stores[0].cardNames.value).toEqual(new Set(['Island', 'Sol Ring']));
  expect(cardLists).toHaveBeenCalledOnce();
});

it('pasted decks change locally without saving or rerunning', async () => {
  const deck = useDeckbuilder();
  await deck.addCard('Sol Ring');
  expect(deck.decklist.value).toBe('Sol Ring');
  expect(mutateAsync).not.toHaveBeenCalled();
  expect(deck.rerun.value).toBe(0);
});
it('saves to the selected deck once and does not rerun', async () => {
  const deck = useDeckbuilder();
  deck.selectedDeckId.value = 'deck-a';
  deck.savedDeckReady.value = true;
  await Promise.all([deck.addCard('Sol Ring'), deck.addCard('Sol Ring')]);
  expect(mutateAsync).toHaveBeenCalledExactlyOnceWith({
    listId: 'deck-a',
    cardNames: ['Sol Ring'],
    board: 'Mainboard',
  });
  expect(deck.hasCard('Sol Ring')).toBe(true);
  expect(deck.rerun.value).toBe(0);
});
it('failed saves leave the deck unchanged and allow retry', async () => {
  const deck = useDeckbuilder();
  deck.selectedDeckId.value = 'deck-a';
  deck.savedDeckReady.value = true;
  mutateAsync.mockRejectedValueOnce(new Error('offline'));
  await deck.addCard('Sol Ring');
  expect(deck.hasCard('Sol Ring')).toBe(false);
  expect(deck.pendingCards.value).toEqual([]);
  expect(notify).toHaveBeenCalledOnce();
  await deck.addCard('Sol Ring');
  expect(deck.hasCard('Sol Ring')).toBe(true);
});
it('does not append a completed save to a newly selected deck', async () => {
  const deck = useDeckbuilder();
  deck.selectedDeckId.value = 'deck-a';
  deck.savedDeckReady.value = true;
  let finish!: (value: { invalidCardNames: string[] }) => void;
  mutateAsync.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const saving = deck.addCard('Sol Ring');
  deck.selectedDeckId.value = 'deck-b';
  finish({ invalidCardNames: [] });
  await saving;
  expect(deck.decklist.value).toBe('');
});
