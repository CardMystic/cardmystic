import { describe, expect, it } from 'vitest';
import { cardNameSuggestions } from '~/utils/cardNameSuggestions';

describe('cardNameSuggestions', () => {
  const names = ["Teferi's Protection", 'Sol Ring', "Urza's Saga"];

  it.each(["Teferi'", 'Teferi’', 'Teferi‘', 'TEFERI’S'])(
    'matches %s while preserving the canonical name',
    (query) => {
      expect(cardNameSuggestions(names, query)).toEqual([names[0]]);
    },
  );

  it('normalizes punctuation on both sides', () => {
    expect(cardNameSuggestions(['Teferi’s Protection'], "teferi's")).toEqual([
      'Teferi’s Protection',
    ]);
  });

  it('keeps the selected card once and excludes unrelated selections', () => {
    expect(cardNameSuggestions(names, 'Teferi’', names[0])).toEqual([names[0]]);
    expect(cardNameSuggestions(names, 'Teferi’', 'Sol Ring')).toEqual([
      names[0],
    ]);
    expect(cardNameSuggestions(names, 'no such card', 'Sol Ring')).toEqual([]);
  });

  it('retains the selected card before typing without showing blank options', () => {
    expect(cardNameSuggestions(names, '', 'Sol Ring')).toEqual(['Sol Ring']);
    expect(cardNameSuggestions(names, '')).toEqual([]);
    expect(cardNameSuggestions(names, 'T', 'Sol Ring')).toEqual([]);
  });

  it('excludes the primary commander from partner suggestions', () => {
    const commander = 'Rograkh, Son of Rohgahh';
    expect(cardNameSuggestions([commander], 'Rograkh', '', commander)).toEqual(
      [],
    );
  });

  it('caps suggestions at 100 including the selected card', () => {
    const cards = Array.from({ length: 150 }, (_, index) => `Card ${index}`);
    const results = cardNameSuggestions(cards, 'Card', 'Card 149');
    expect(results).toHaveLength(100);
    expect(results[0]).toBe('Card 149');
    expect(new Set(results).size).toBe(100);
  });
});
