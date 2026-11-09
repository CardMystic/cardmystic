import { z } from 'zod';
import { CardListFormatSchema } from '~/models/cardListModel';

export const LEGACY_GUEST_DECK_KEY = 'cardmystic-guest-deck-v1';
export const GUEST_DECK_KEY = 'cardmystic-guest-decks-v2';
export const GUEST_RETURN_KEY = 'cardmystic-return-to-draft';
export const guestBoards = ['Mainboard', 'Sideboard', 'Considering'] as const;
export type GuestBoard = (typeof guestBoards)[number];
const entrySchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(100),
  board: z.enum(guestBoards),
});
export const guestDeckSchema = z.object({
  version: z.literal(1),
  name: z.string().max(200),
  format: CardListFormatSchema,
  cards: z.array(entrySchema).max(1000),
  commanders: z.array(z.string().min(1).max(200)).max(2),
  pendingSave: z.object({ userId: z.guid(), listId: z.guid() }).nullable(),
});
export type GuestDeck = z.infer<typeof guestDeckSchema>;
export function emptyGuestDeck(): GuestDeck {
  return {
    version: 1,
    name: 'My first deck',
    format: 'Commander',
    cards: [],
    commanders: [],
    pendingSave: null,
  };
}

export const guestDecksSchema = z.object({
  version: z.literal(2),
  activeIndex: z.number().int().min(0).max(2),
  decks: z.tuple([guestDeckSchema, guestDeckSchema, guestDeckSchema]),
});
export type GuestDecks = z.infer<typeof guestDecksSchema>;
export function emptyGuestDecks(): GuestDecks {
  return {
    version: 2,
    activeIndex: 0,
    decks: [
      emptyGuestDeck(),
      { ...emptyGuestDeck(), name: 'My second deck' },
      { ...emptyGuestDeck(), name: 'My third deck' },
    ],
  };
}
export function loadGuestDecks(
  saved: string | null,
  legacy: string | null,
): GuestDecks {
  if (saved) return guestDecksSchema.parse(JSON.parse(saved));
  const drafts = emptyGuestDecks();
  if (legacy) drafts.decks[0] = guestDeckSchema.parse(JSON.parse(legacy));
  return drafts;
}

/** Apply one edit atomically; reject it instead of silently dropping cards. */
export function editGuestDeck(
  deck: GuestDeck,
  edit: (next: GuestDeck) => void,
): GuestDeck {
  if (deck.pendingSave)
    throw new Error('Finish saving this draft before editing it.');
  const next = structuredClone(deck);
  edit(next);
  if (next.cards.reduce((total, card) => total + card.quantity, 0) > 1000) {
    throw new Error(
      'Browser drafts support up to 1,000 cards. Save your deck to keep building.',
    );
  }
  return guestDeckSchema.parse(next);
}

export function setGuestCopies(
  deck: GuestDeck,
  name: string,
  board: GuestBoard,
  quantity: number,
) {
  const index = deck.cards.findIndex(
    (card) => card.name === name && card.board === board,
  );
  if (quantity === 0) {
    if (index >= 0) deck.cards.splice(index, 1);
    if (board === 'Mainboard')
      deck.commanders = deck.commanders.filter((card) => card !== name);
  } else if (index >= 0) deck.cards[index].quantity = quantity;
  else deck.cards.push({ name, board, quantity });
}

export function guestDeckEntries(deck: GuestDeck) {
  return guestBoards
    .map((board) => ({
      board,
      cards: deck.cards
        .filter((card) => card.board === board)
        .map((card) => ({ name: card.name, num_copies: card.quantity })),
    }))
    .filter((entry) => entry.cards.length);
}

/** Only a fixed local destination is read from storage, never an arbitrary URL. */
export function takeGuestDeckReturn(): string | null {
  try {
    if (sessionStorage.getItem(GUEST_RETURN_KEY) !== 'true') return null;
    sessionStorage.removeItem(GUEST_RETURN_KEY);
    return '/build';
  } catch {
    return null;
  }
}
