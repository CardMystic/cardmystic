import { describe, expect, it } from 'vitest';
import type { Card, ScryfallCard } from '../../models/cardModel';
import {
  replacementColors,
  filterGameChangerReplacements,
  gameChangersInDeck,
} from '../../utils/gameChangerReplacements';
const card = (id: string, colors: string[], gameChanger = false) =>
  ({
    oracle_id: id,
    name: id,
    color_identity: colors,
    game_changer: gameChanger,
  }) as ScryfallCard;
const entry = (data: ScryfallCard, commander = false) => ({
  card: data,
  quantity: 1,
  commander,
});
describe('game changer replacements', () => {
  it('uses both commanders, ignoring off-color cards, and preserves colorless commanders', () => {
    expect(
      replacementColors([
        entry(card('a', ['U']), true),
        entry(card('b', ['B']), true),
        entry(card('c', ['R'])),
      ]),
    ).toEqual(['U', 'B']);
    expect(
      replacementColors([entry(card('a', []), true), entry(card('c', ['R']))]),
    ).toEqual([]);
    expect(
      replacementColors([entry(card('a', ['U'])), entry(card('b', ['R']))]),
    ).toEqual(['U', 'R']);
  });
  it('keeps similarity order, colorless cards, and only subsets of the allowed identity', () => {
    const results = [
      card('off', ['R']),
      card('changer', ['U'], true),
      card('already', ['U']),
      card('blue', ['U']),
      card('two-color', ['U', 'B']),
      card('colorless', []),
      card('blue', ['U']),
    ].map((card_data) => ({ card_data }) as Card);
    expect(
      filterGameChangerReplacements(results, ['U'], ['already']).map(
        (r) => r.card_data.name,
      ),
    ).toEqual(['blue', 'colorless']);
    expect(
      filterGameChangerReplacements(results, [], []).map(
        (r) => r.card_data.name,
      ),
    ).toEqual(['colorless']);
  });
  it('does not truncate the pool before applying colors', () => {
    const results = [
      ...Array.from({ length: 100 }, (_, i) => card(`red ${i}`, ['R'])),
      card('late blue', ['U']),
    ].map((card_data) => ({ card_data }) as Card);
    expect(filterGameChangerReplacements(results, ['U'], [])).toHaveLength(1);
  });
  it('lists each game changer once', () => {
    const gameChanger = entry(card('changer', [], true));
    expect(
      gameChangersInDeck([
        gameChanger,
        gameChanger,
        entry(card('ordinary', [])),
      ]),
    ).toHaveLength(1);
  });
});
