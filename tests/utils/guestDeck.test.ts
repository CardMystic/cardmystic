import { describe, expect, it } from 'vitest';
import {
  editGuestDeck,
  emptyGuestDeck,
  guestDeckEntries,
  guestDeckSchema,
  setGuestCopies,
  emptyGuestDecks,
  guestDecksSchema,
  loadGuestDecks,
} from '~/utils/guestDeck';

describe('browser deck draft', () => {
  it('migrates the existing draft and keeps three independent slots', () => {
    const legacy = emptyGuestDeck();
    legacy.name = 'Existing deck';
    setGuestCopies(legacy, 'Island', 'Mainboard', 20);
    const drafts = loadGuestDecks(null, JSON.stringify(legacy));
    expect(drafts.decks[0]).toEqual(legacy);
    drafts.decks[1].name = 'Second deck';
    drafts.decks[1].cards.push({
      name: 'Mountain',
      board: 'Mainboard',
      quantity: 10,
    });
    drafts.activeIndex = 1;
    const restored = loadGuestDecks(
      JSON.stringify(drafts),
      JSON.stringify(legacy),
    );
    expect(restored).toEqual(drafts);
    expect(restored.decks[0].cards[0].name).toBe('Island');
    expect(restored.decks[2].cards).toEqual([]);
    expect(
      guestDecksSchema.safeParse({ ...drafts, activeIndex: 3 }).success,
    ).toBe(false);
    expect(
      guestDecksSchema.safeParse({
        ...drafts,
        decks: [...drafts.decks, emptyGuestDeck()],
      }).success,
    ).toBe(false);
    expect(loadGuestDecks(null, null)).toEqual(emptyGuestDecks());
  });
  it('preserves quantities, boards, and commanders through storage and account save', () => {
    const draft = editGuestDeck(emptyGuestDeck(), (next) => {
      next.name = 'Token deck';
      next.commanders = ['Mondrak, Glory Dominus'];
      setGuestCopies(next, 'Mondrak, Glory Dominus', 'Mainboard', 1);
      setGuestCopies(next, 'Plains', 'Mainboard', 30);
      setGuestCopies(next, 'Sol Ring', 'Considering', 1);
    });
    const loaded = guestDeckSchema.parse(JSON.parse(JSON.stringify(draft)));
    expect(loaded).toEqual(draft);
    expect(guestDeckEntries(loaded)).toEqual([
      {
        board: 'Mainboard',
        cards: [
          { name: 'Mondrak, Glory Dominus', num_copies: 1 },
          { name: 'Plains', num_copies: 30 },
        ],
      },
      { board: 'Considering', cards: [{ name: 'Sol Ring', num_copies: 1 }] },
    ]);
    const removed = editGuestDeck(loaded, (next) =>
      setGuestCopies(next, 'Mondrak, Glory Dominus', 'Mainboard', 0),
    );
    expect(removed.commanders).toEqual([]);
    expect(loaded.commanders).toHaveLength(1);
  });

  it('rejects oversized edits without losing the existing draft', () => {
    const draft = emptyGuestDeck();
    expect(() =>
      editGuestDeck(draft, (next) =>
        setGuestCopies(next, 'Plains', 'Mainboard', 101),
      ),
    ).toThrow();
    expect(() =>
      editGuestDeck(draft, (next) => {
        for (let i = 0; i < 11; i++)
          setGuestCopies(next, `Card ${i}`, 'Mainboard', 100);
      }),
    ).toThrow('1,000');
    expect(draft.cards).toEqual([]);
    expect(
      guestDeckSchema.safeParse({
        ...draft,
        cards: [{ name: 'Plains', quantity: -1, board: 'Mainboard' }],
      }).success,
    ).toBe(false);
  });

  it('keeps a partially saved draft unchanged so retrying replaces the same boards', () => {
    const draft = emptyGuestDeck();
    draft.pendingSave = {
      userId: '00000000-0000-4000-8000-000000000001',
      listId: '00000000-0000-4000-8000-000000000002',
    };
    expect(() =>
      editGuestDeck(draft, (next) => {
        next.name = 'Changed';
      }),
    ).toThrow('Finish saving');
    expect(
      guestDeckSchema.parse(JSON.parse(JSON.stringify(draft))).pendingSave,
    ).toEqual(draft.pendingSave);
  });
});
