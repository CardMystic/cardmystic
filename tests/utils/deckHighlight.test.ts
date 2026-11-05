import { describe, expect, it } from 'vitest';
import { cardHighlight } from '~/utils/deckHighlight';
import type { ScryfallCard } from '~/models/cardModel';

const card = (data: Partial<ScryfallCard>) => data as ScryfallCard;
const unhighlighted = { status: null, classes: '' };

describe('deck highlighting', () => {
  it('highlights only the selected color, including multicolor cards with that color', () => {
    expect(cardHighlight(card({ colors: ['B'] }), 'color', 'B').status).toBe(
      'Black',
    );
    expect(
      cardHighlight(card({ colors: ['W', 'B'] }), 'color', 'B').status,
    ).toBe('Black');
    expect(cardHighlight(card({ colors: ['U'] }), 'color', 'B')).toEqual(
      unhighlighted,
    );
    expect(cardHighlight(card({ colors: [] }), 'color', 'B')).toEqual(
      unhighlighted,
    );
    expect(
      cardHighlight(card({ colors: [] }), 'color', 'colorless').status,
    ).toBe('Colorless');
    expect(
      cardHighlight(card({ colors: ['U'] }), 'color', 'multicolor'),
    ).toEqual(unhighlighted);
    expect(
      cardHighlight(card({ colors: ['U', 'B'] }), 'color', 'multicolor').status,
    ).toBe('Multicolor');
  });
  it('uses front-face colors and types, and matches each type of artifact creatures', () => {
    const value = card({
      type_line: 'Instant // Land',
      card_faces: [
        { type_line: 'Instant', colors: ['U'] },
        { type_line: 'Land', colors: [] },
      ] as ScryfallCard['card_faces'],
    });
    expect(cardHighlight(value, 'color', 'U').status).toBe('Blue');
    expect(cardHighlight(value, 'type', 'Instant').status).toBe('Instant');
    expect(cardHighlight(value, 'type', 'Land')).toEqual(unhighlighted);
    const artifactCreature = card({ type_line: 'Artifact Creature — Golem' });
    expect(cardHighlight(artifactCreature, 'type', 'Creature').status).toBe(
      'Creature',
    );
    expect(cardHighlight(artifactCreature, 'type', 'Artifact').status).toBe(
      'Artifact',
    );
  });
  it('matches exact mana values, including zero and values over seven', () => {
    expect(cardHighlight(card({ cmc: 3 }), 'manaValue', '3').status).toBe(
      'Mana value 3',
    );
    expect(cardHighlight(card({ cmc: 2 }), 'manaValue', '3')).toEqual(
      unhighlighted,
    );
    expect(cardHighlight(card({ cmc: 0 }), 'manaValue', '0').status).toBe(
      'Mana value 0',
    );
    expect(cardHighlight(card({ cmc: 9 }), 'manaValue', '7')).toEqual(
      unhighlighted,
    );
    expect(cardHighlight(card({ cmc: 9 }), 'manaValue', '9').status).toBe(
      'Mana value 9',
    );
  });
  it('leaves cards unchanged when off or waiting for a selection', () => {
    expect(cardHighlight(card({ colors: ['B'] }), 'none', 'B')).toEqual(
      unhighlighted,
    );
    expect(cardHighlight(card({ colors: ['B'] }), 'color', '')).toEqual(
      unhighlighted,
    );
    expect(cardHighlight(card({ cmc: 0 }), 'manaValue', '')).toEqual(
      unhighlighted,
    );
  });
});
