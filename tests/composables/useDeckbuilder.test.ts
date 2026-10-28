import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { computed, ref, type Ref } from 'vue';
import { useDeckbuilder } from '~/composables/useDeckbuilder';

const mutateAsync = vi.fn();
const notify = vi.fn();
beforeEach(() => {
  const state = new Map<string, Ref>();
  vi.stubGlobal('useState', (key: string, initial: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(initial()));
    return state.get(key);
  });
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('useCardLists', () => ({
    addCardsByNameToListMutation: { mutateAsync },
  }));
  vi.stubGlobal('useToast', () => ({ add: notify }));
  mutateAsync.mockReset().mockResolvedValue({ invalidCardNames: [] });
  notify.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

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
