import { describe, it, expect } from 'vitest';
import { sortSearchResults, groupCards } from '~/utils/sort';
import type { Card } from '~/models/cardModel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function makeCard(overrides: {
  name?: string;
  cmc?: number;
  price?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic';
  power?: string;
  toughness?: string;
  released_at?: string;
  ai_normalized_score?: number;
  als_score?: number;
  popularity?: number;
  type_line?: string;
  colors?: string[];
  color_identity?: string[];
}): Card {
  const id = `00000000-0000-0000-0000-${String(++idCounter).padStart(12, '0')}`;
  return {
    card_name: overrides.name ?? 'Test Card',
    ai_normalized_score: overrides.ai_normalized_score,
    als_score: overrides.als_score,
    popularity: overrides.popularity,
    card_data: {
      object: 'card',
      id,
      oracle_id: id,
      name: overrides.name ?? 'Test Card',
      lang: 'en',
      released_at: overrides.released_at ?? '2020-01-01',
      uri: 'https://example.com',
      scryfall_uri: 'https://example.com',
      layout: 'normal',
      highres_image: true,
      image_status: 'highres_scan',
      cmc: overrides.cmc ?? 0,
      type_line: overrides.type_line ?? 'Creature',
      colors: overrides.colors ?? [],
      color_identity: overrides.color_identity ?? [],
      keywords: [],
      games: [],
      reserved: false,
      foil: false,
      nonfoil: true,
      finishes: [],
      oversized: false,
      promo: false,
      reprint: false,
      variation: false,
      set_id: id,
      set: 'tst',
      set_name: 'Test Set',
      set_type: 'expansion',
      set_uri: 'https://example.com',
      set_search_uri: 'https://example.com',
      scryfall_set_uri: 'https://example.com',
      rulings_uri: 'https://example.com',
      prints_search_uri: 'https://example.com',
      collector_number: '1',
      digital: false,
      rarity: overrides.rarity
        ? ((overrides.rarity.charAt(0).toUpperCase() +
            overrides.rarity.slice(1)) as any)
        : 'Common',
      card_back_id: id,
      border_color: 'black',
      frame: '2015',
      full_art: false,
      textless: false,
      booster: true,
      story_spotlight: false,
      prices: { usd: overrides.price ?? '0' },
      related_uris: {},
      power: overrides.power,
      toughness: overrides.toughness,
    },
  };
}

// ---------------------------------------------------------------------------
// sortSearchResults
// ---------------------------------------------------------------------------
describe('sortSearchResults', () => {
  it('returns null/undefined as-is', () => {
    expect(sortSearchResults(null, 'name', 'asc')).toBeNull();
    expect(sortSearchResults(undefined, 'name', 'asc')).toBeUndefined();
  });

  it('returns empty array unchanged', () => {
    expect(sortSearchResults([], 'name', 'asc')).toEqual([]);
  });

  it('sorts by name ascending', () => {
    const cards = [
      makeCard({ name: 'Zap' }),
      makeCard({ name: 'Arc' }),
      makeCard({ name: 'Bolt' }),
    ];
    const result = sortSearchResults(cards, 'name', 'asc')!;
    expect(result.map((c) => c.card_name)).toEqual(['Arc', 'Bolt', 'Zap']);
  });

  it('sorts by name descending', () => {
    const cards = [
      makeCard({ name: 'Zap' }),
      makeCard({ name: 'Arc' }),
      makeCard({ name: 'Bolt' }),
    ];
    const result = sortSearchResults(cards, 'name', 'desc')!;
    expect(result.map((c) => c.card_name)).toEqual(['Zap', 'Bolt', 'Arc']);
  });

  it('sorts by cmc ascending', () => {
    const cards = [
      makeCard({ cmc: 5 }),
      makeCard({ cmc: 1 }),
      makeCard({ cmc: 3 }),
    ];
    const result = sortSearchResults(cards, 'cmc', 'asc')!;
    expect(result.map((c) => c.card_data.cmc)).toEqual([1, 3, 5]);
  });

  it('sorts by cmc descending', () => {
    const cards = [
      makeCard({ cmc: 5 }),
      makeCard({ cmc: 1 }),
      makeCard({ cmc: 3 }),
    ];
    const result = sortSearchResults(cards, 'cmc', 'desc')!;
    expect(result.map((c) => c.card_data.cmc)).toEqual([5, 3, 1]);
  });

  it('sorts by price ascending', () => {
    const cards = [
      makeCard({ price: '10.00' }),
      makeCard({ price: '1.50' }),
      makeCard({ price: '5.00' }),
    ];
    const result = sortSearchResults(cards, 'price', 'asc')!;
    expect(result.map((c) => c.card_data.prices.usd)).toEqual([
      '1.50',
      '5.00',
      '10.00',
    ]);
  });

  it('sorts by rarity ascending (common → mythic)', () => {
    const cards = [
      makeCard({ rarity: 'mythic' }),
      makeCard({ rarity: 'common' }),
      makeCard({ rarity: 'rare' }),
      makeCard({ rarity: 'uncommon' }),
    ];
    const result = sortSearchResults(cards, 'rarity', 'asc')!;
    expect(result.map((c) => c.card_data.rarity.toLowerCase())).toEqual([
      'common',
      'uncommon',
      'rare',
      'mythic',
    ]);
  });

  it('sorts by ai_score descending', () => {
    const cards = [
      makeCard({ ai_normalized_score: 0.5 }),
      makeCard({ ai_normalized_score: 0.9 }),
      makeCard({ ai_normalized_score: 0.1 }),
    ];
    const result = sortSearchResults(cards, 'ai_score', 'desc')!;
    expect(result.map((c) => c.ai_normalized_score)).toEqual([0.9, 0.5, 0.1]);
  });

  it('sorts by popularity descending', () => {
    const cards = [
      makeCard({ popularity: 100 }),
      makeCard({ popularity: 500 }),
      makeCard({ popularity: 50 }),
    ];
    const result = sortSearchResults(cards, 'popularity', 'desc')!;
    expect(result.map((c) => c.popularity)).toEqual([500, 100, 50]);
  });

  it('sorts by deck_score descending', () => {
    const cards = [
      makeCard({ als_score: 0.3 }),
      makeCard({ als_score: 0.8 }),
      makeCard({ als_score: 0.1 }),
    ];
    const result = sortSearchResults(cards, 'deck_score', 'desc')!;
    expect(result.map((c) => c.als_score)).toEqual([0.8, 0.3, 0.1]);
  });

  it('sorts by released_at ascending', () => {
    const cards = [
      makeCard({ released_at: '2022-01-01' }),
      makeCard({ released_at: '2019-06-01' }),
      makeCard({ released_at: '2021-03-15' }),
    ];
    const result = sortSearchResults(cards, 'released', 'asc')!;
    expect(result.map((c) => c.card_data.released_at)).toEqual([
      '2019-06-01',
      '2021-03-15',
      '2022-01-01',
    ]);
  });

  it('with no sortBy, uses score-based ordering (higher score first)', () => {
    const cards = [
      makeCard({ ai_normalized_score: 0.2 }),
      makeCard({ ai_normalized_score: 0.9 }),
      makeCard({ ai_normalized_score: 0.5 }),
    ];
    const result = sortSearchResults(cards, null, 'desc')!;
    expect(result.map((c) => c.ai_normalized_score)).toEqual([0.9, 0.5, 0.2]);
  });

  it('does not mutate the original array', () => {
    const cards = [makeCard({ name: 'Z' }), makeCard({ name: 'A' })];
    const original = [...cards];
    sortSearchResults(cards, 'name', 'asc');
    expect(cards[0].card_name).toBe(original[0].card_name);
  });
});

// ---------------------------------------------------------------------------
// groupCards
// ---------------------------------------------------------------------------
describe('groupCards', () => {
  it('groups by type and returns labels', () => {
    const cards = [
      makeCard({ type_line: 'Creature — Human' }),
      makeCard({ type_line: 'Instant' }),
      makeCard({ type_line: 'Creature — Wizard' }),
    ];
    const groups = groupCards(cards, 'type');
    const labels = groups.map((g) => g.label);
    expect(labels.some((l) => l.includes('Creature'))).toBe(true);
    expect(labels.some((l) => l.includes('Instant'))).toBe(true);
    // Creatures should be grouped together
    const creatureGroup = groups.find((g) => g.label.includes('Creature'))!;
    expect(creatureGroup.cards).toHaveLength(2);
  });

  it('groups by color and labels Colorless correctly', () => {
    const cards = [makeCard({ colors: [] }), makeCard({ colors: ['W'] })];
    const groups = groupCards(cards, 'color');
    const keys = groups.map((g) => g.label);
    expect(keys.some((l) => l.includes('Colorless') || l === 'Colorless')).toBe(
      true,
    );
  });

  it('groups by cmc', () => {
    const cards = [
      makeCard({ cmc: 2 }),
      makeCard({ cmc: 4 }),
      makeCard({ cmc: 2 }),
    ];
    const groups = groupCards(cards, 'cmc');
    expect(groups).toHaveLength(2);
    const cmc2 = groups.find((g) => g.label.includes('2'))!;
    expect(cmc2.cards).toHaveLength(2);
  });

  it('respects copiesMap in group label count', () => {
    const card1 = makeCard({ type_line: 'Instant' });
    const card2 = makeCard({ type_line: 'Instant' });
    const copiesMap: Record<string, number> = {
      [card1.card_data.id]: 3,
      [card2.card_data.id]: 2,
    };
    const groups = groupCards([card1, card2], 'type', copiesMap);
    const instantGroup = groups.find((g) => g.label.includes('Instant'))!;
    // Label should reflect total copies (5), not card count (2)
    expect(instantGroup.label).toContain('5');
  });
});
