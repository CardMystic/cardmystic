import { describe, expect, it, vi } from 'vitest';
import {
  parseDeckImport,
  exportDeck,
  applyDeckImport,
  summarizeImportBoards,
  type TransferCard,
} from '~/utils/deckTransfer';
import { analyzeDeck } from '~/utils/deckAnalysis';
import type { ScryfallCard } from '~/models/cardModel';

describe('deck import and export', () => {
  it('counts quantities by board rather than confusing entries with copies', () => {
    expect(
      summarizeImportBoards(
        parseDeckImport(
          'Mainboard\n97 Swamp\n1 Sol Ring\nSideboard\n9 Mountain',
          'text',
        ),
      ),
    ).toBe('98 Mainboard · 9 Sideboard');
    const cards: TransferCard[] = [
      ...Array.from({ length: 97 }, (_, index) => ({
        name: `Card ${index}`,
        quantity: 1,
        board: 'Mainboard' as const,
      })),
      { name: 'Swamp', quantity: 10, board: 'Mainboard' },
    ];
    expect(cards).toHaveLength(98);
    expect(summarizeImportBoards(cards)).toBe('107 Mainboard');
  });
  it('continues after unknown names and sets only recognized commanders', async () => {
    const add = vi
      .fn()
      .mockResolvedValueOnce({
        addedCount: 1,
        updatedCount: 1,
        invalidCardNames: ['Missing Leader'],
      })
      .mockResolvedValueOnce({
        addedCount: 1,
        updatedCount: 0,
        invalidCardNames: [],
      });
    const setCommander = vi.fn();
    const result = await applyDeckImport(
      parseDeckImport(
        'Commander\n1 Missing Leader\n1 Known Leader\nMainboard\n4 Swamp\nSideboard\n1 Negate',
        'text',
      ),
      add,
      setCommander,
    );
    expect(add).toHaveBeenLastCalledWith('Sideboard', ['1 Negate']);
    expect(setCommander.mock.calls).toEqual([['Known Leader']]);
    expect(result).toEqual({
      confirmedEntries: 3,
      invalidCardNames: ['Missing Leader'],
      failure: null,
    });
  });
  it('reports no confirmed additions when every name is unknown', async () => {
    const result = await applyDeckImport(
      parseDeckImport('1 Missing', 'text'),
      vi
        .fn()
        .mockResolvedValue({
          addedCount: 0,
          updatedCount: 0,
          invalidCardNames: ['Missing'],
        }),
      vi.fn(),
    );
    expect(result.confirmedEntries).toBe(0);
    expect(result.invalidCardNames).toEqual(['Missing']);
    expect(result.failure).toBeNull();
  });
  it('preserves confirmed progress and stops after an unconfirmed batch failure', async () => {
    const add = vi
      .fn()
      .mockResolvedValueOnce({
        addedCount: 500,
        updatedCount: 0,
        invalidCardNames: [],
      })
      .mockRejectedValueOnce(new Error('Connection lost'));
    const setCommander = vi.fn();
    const cards: TransferCard[] = Array.from({ length: 501 }, (_, index) => ({
      name: `Card ${index}`,
      quantity: 1,
      board: 'Mainboard',
      commander: index === 0,
    }));
    cards.push({ name: 'Sideboard card', quantity: 1, board: 'Sideboard' });
    const result = await applyDeckImport(cards, add, setCommander);
    expect(add).toHaveBeenCalledTimes(2);
    expect(setCommander).not.toHaveBeenCalled();
    expect(result.confirmedEntries).toBe(500);
    expect(result.failure).toEqual({
      stage: 'cards',
      message: 'Connection lost',
    });
  });
  it('round trips quoted CSV names, quantities, boards and commanders', () => {
    const cards: TransferCard[] = [
      {
        name: 'Tamiyo, Inquisitive Student // Tamiyo, Seasoned Scholar',
        quantity: 1,
        board: 'Mainboard',
        commander: true,
      },
      { name: 'Island', quantity: 18, board: 'Mainboard' },
      { name: 'Negate', quantity: 2, board: 'Sideboard' },
    ];
    expect(parseDeckImport(exportDeck(cards, 'csv'), 'csv')).toEqual(
      cards.map((card) => ({ ...card, commander: !!card.commander })),
    );
  });
  it('imports Arena sections and printings, MTGO sideboards and Moxfield tags', () => {
    const arena = parseDeckImport(
      'Commander\n1 Tamiyo (MH3) 242\n\nDeck\n20 Island (FDN) 275\n\nSideboard\n2 Negate (M21) 59',
      'text',
    );
    expect(
      arena.map((card) => [
        card.name,
        card.quantity,
        card.board,
        card.commander,
      ]),
    ).toEqual([
      ['Tamiyo', 1, 'Mainboard', true],
      ['Island', 20, 'Mainboard', false],
      ['Negate', 2, 'Sideboard', false],
    ]);
    expect(parseDeckImport('2 Island\n\n1 Negate', 'text')[1].board).toBe(
      'Sideboard',
    );
    expect(
      parseDeckImport('1 Sol Ring (CMM) 410 *F* #!Ramp', 'text')[0].name,
    ).toBe('Sol Ring');
  });
  it('rejects malformed CSV and invalid counts before writing', () => {
    expect(() => parseDeckImport('Name,Quantity\n"Unclosed,1', 'csv')).toThrow(
      'quote',
    );
    expect(() => parseDeckImport('Name,Quantity\nIsland,-1', 'csv')).toThrow(
      'whole number',
    );
    expect(() => parseDeckImport('80 Island\n21 Island', 'text')).toThrow(
      '100 copies',
    );
    expect(() => parseDeckImport('Set,Price\nLEA,2', 'csv')).toThrow('Name');
  });
  it('excludes considering cards from game exports but preserves them in CSV', () => {
    const cards: TransferCard[] = [
      { name: 'Island', quantity: 4, board: 'Mainboard' },
      { name: 'Negate', quantity: 1, board: 'Considering' },
    ];
    expect(exportDeck(cards, 'arena')).toBe('Deck\n4 Island');
    expect(exportDeck(cards, 'mtgo')).toBe('4 Island');
    expect(exportDeck(cards, 'csv')).toContain('Negate');
  });
});

describe('deck analysis', () => {
  const card = (name: string, type: string, cmc = 0, extra = {}) =>
    ({
      name,
      type_line: type,
      cmc,
      color_identity: [],
      ...extra,
    }) as ScryfallCard;
  it('counts quantities, excludes commanders, and keeps optional land faces separate', () => {
    const entries = [
      { card: card('Leader', 'Creature', 3), quantity: 1, commander: true },
      { card: card('Island', 'Basic Land'), quantity: 24 },
      { card: card('Spell', 'Instant', 2), quantity: 35 },
      {
        card: card('Modal', 'Instant // Land', 3, {
          layout: 'modal_dfc',
          card_faces: [{ type_line: 'Instant' }, { type_line: 'Land' }],
        }),
        quantity: 1,
      },
    ];
    const stats = analyzeDeck(entries);
    expect(stats.total).toBe(60);
    expect(stats.lands).toBe(24);
    expect(stats.modalLands).toBe(1);
    expect(stats.curve[2].count).toBe(35);
    expect(stats.curve[3].count).toBe(1);
    expect(stats.atLeastTwo).toBeCloseTo(0.857344, 5);
    expect(stats.averageOpeningLands).toBeCloseTo(2.8);
  });
  it('handles empty and all-land decks without invalid probabilities', () => {
    expect(analyzeDeck([]).atLeastTwo).toBe(0);
    expect(analyzeDeck([]).averageOpeningLands).toBe(0);
    expect(
      analyzeDeck([{ card: card('Island', 'Land'), quantity: 60 }]).atLeastTwo,
    ).toBe(1);
  });
});
