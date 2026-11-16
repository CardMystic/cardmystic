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
  it('creates one draft and preserves populated drafts from older storage', () => {
    const legacy = emptyGuestDeck();
    legacy.name = 'Existing deck';
    setGuestCopies(legacy, 'Island', 'Mainboard', 20);
    const drafts = loadGuestDecks(null, JSON.stringify(legacy));
    expect(drafts.decks).toEqual([legacy]);
    expect(loadGuestDecks(null, null)).toEqual(emptyGuestDecks());
    expect(emptyGuestDecks().decks).toHaveLength(1);

    const old = {
      version: 2,
      activeIndex: 1,
      decks: [
        legacy,
        {
          ...emptyGuestDeck(),
          name: 'Second deck',
          cards: [{ name: 'Mountain', board: 'Mainboard', quantity: 10 }],
        },
        { ...emptyGuestDeck(), name: 'My third deck' },
      ],
    };
    const restored = loadGuestDecks(JSON.stringify(old), null);
    expect(restored.decks).toEqual(old.decks.slice(0, 2));
    expect(restored.activeIndex).toBe(1);
    expect(loadGuestDecks(JSON.stringify(restored), null)).toEqual(restored);
    expect(
      guestDecksSchema.safeParse({ ...restored, activeIndex: 2 }).success,
    ).toBe(false);
    expect(
      guestDecksSchema.safeParse({
        ...old,
        decks: [...old.decks, emptyGuestDeck()],
      }).success,
    ).toBe(false);
    const unused = {
      version: 2,
      activeIndex: 2,
      decks: [
        emptyGuestDeck(),
        { ...emptyGuestDeck(), name: 'My second deck' },
        { ...emptyGuestDeck(), name: 'My third deck' },
      ],
    };
    expect(loadGuestDecks(JSON.stringify(unused), null)).toEqual(
      emptyGuestDecks(),
    );
    unused.decks[2] = legacy;
    expect(loadGuestDecks(JSON.stringify(unused), null)).toEqual({
      version: 2,
      activeIndex: 0,
      decks: [legacy],
    });
  });
  it('preserves quantities, boards, and commanders through storage and account save', () => {
    const draft = editGuestDeck(emptyGuestDeck(), (next) => {
      next.name = 'Token deck';
      next.description = 'Tokens and counters';
      next.bracket = 3;
      next.avatarCardName = 'Mondrak, Glory Dominus';
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
