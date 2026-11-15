import { describe, expect, it } from 'vitest';
import { withPrinting, type Printing } from '../../utils/printings';
import { getUsdPrice } from '../../utils/cardPrice';
import { getCardImageUrl } from '../../utils/scryfall';
import { exportDeck, parseDeckImport } from '../../utils/deckTransfer';
import {
  emptyGuestDeck,
  guestDeckSchema,
  setGuestCopies,
} from '../../utils/guestDeck';
import { createDisplayCards } from '../../e2e/utils/deckDisplay';
import type { ScryfallCard } from '../../models/cardModel';

const card = createDisplayCards(1)[0] as unknown as ScryfallCard;
const printing: Printing = {
  id: '44000000-0000-4000-8000-000000000001',
  oracle_id: card.oracle_id,
  set_code: 'new',
  collector_number: '123',
  lang: 'en',
  released_at: '2026-01-01',
  finish_mask: 3,
  image_paths: ['front/a/b/front.jpg?1', 'back/c/d/back.jpg?2'],
  flavor_name: 'Alternate Name',
  tcgplayer_id: 123,
  usd_cents: 100,
  foil_cents: null,
  etched_cents: null,
  card_printing_sets: { name: 'New Set' },
};
const selection = {
  oracle_id: card.oracle_id,
  board: 'Mainboard',
  printing_id: printing.id,
  finish: 'foil',
};
describe('printing selection', () => {
  it('uses exact artwork on both faces and never falls back to another finish price', () => {
    const chosen = withPrinting(
      { ...card, prices: { usd: '10', usd_foil: '20', usd_estimate: '3' } },
      selection,
      printing,
    );
    expect(chosen.oracle_id).toBe(card.oracle_id);
    expect(chosen.name).toBe(card.name);
    expect(chosen.flavor_name).toBe('Alternate Name');
    expect(chosen.card_faces?.[1].image_uris?.normal).toBe(
      'https://cards.scryfall.io/normal/back/c/d/back.jpg?2',
    );
    expect(getUsdPrice(chosen.prices)).toBeNull();
    expect(
      getUsdPrice(
        withPrinting(card, { ...selection, finish: 'nonfoil' }, printing)
          .prices,
      ),
    ).toBe('1.00');
    const pending = withPrinting(card, selection);
    expect(getUsdPrice(pending.prices)).toBeNull();
    expect(getCardImageUrl(pending)).toBe('');
    expect(getCardImageUrl(pending, true)).toBe('');
    expect(
      getCardImageUrl(
        withPrinting(card, selection, {
          ...printing,
          oracle_id: 'different-card',
        }),
      ),
    ).toBe('');
    expect(withPrinting(card, { ...selection, printing_id: null })).toBe(card);
  });
  it('persists draft choices through serialization and quantity changes', () => {
    const draft = emptyGuestDeck();
    draft.cards.push({
      name: card.name,
      quantity: 1,
      board: 'Mainboard',
      printingId: printing.id,
      finish: 'foil',
    });
    setGuestCopies(draft, card.name, 'Mainboard', 2);
    expect(
      guestDeckSchema.parse(JSON.parse(JSON.stringify(draft))).cards[0],
    ).toMatchObject({ quantity: 2, printingId: printing.id, finish: 'foil' });
  });
  it('round-trips printing and finish through CSV and text, rejecting mixed choices per board', () => {
    const entry = {
      name: 'Dovin’s Veto',
      quantity: 2,
      board: 'Sideboard' as const,
      commander: false,
      printingId: printing.id,
      set: 'sld',
      collectorNumber: '123',
      finish: 'etched' as const,
    };
    expect(parseDeckImport(exportDeck([entry], 'csv'), 'csv')).toEqual([entry]);
    expect(parseDeckImport(exportDeck([entry], 'text'), 'text')).toEqual([
      { ...entry, printingId: undefined },
    ]);
    expect(() =>
      parseDeckImport('1 Island (ONE) 1\n1 Island (TWO) 2', 'text'),
    ).toThrow('Choose one printing');
  });
});
