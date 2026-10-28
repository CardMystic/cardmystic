import { describe, expect, it } from 'vitest';
import { searchSuggestions } from '~/utils/searchSuggestions';

describe('smart search suggestions', () => {
  const queries = [
    'artifact removal',
    'mono white removal',
    'treasure generators',
    'treasure synergy',
    'white removal',
  ];
  it('matches words case-insensitively and ranks prefixes first', () => {
    expect(searchSuggestions(queries, ' WHITE ')).toEqual([
      'white removal',
      'mono white removal',
    ]);
    expect(searchSuggestions(queries, 'removal mono')).toEqual([
      'mono white removal',
    ]);
    expect(searchSuggestions(queries, 'treas')).toEqual([
      'treasure generators',
      'treasure synergy',
    ]);
  });
  it('leaves arbitrary text alone and hides empty or already completed suggestions', () => {
    expect(searchSuggestions(queries, 'a')).toEqual([]);
    expect(searchSuggestions(queries, '')).toEqual([]);
    expect(searchSuggestions(queries, 'my own complex search')).toEqual([]);
    expect(searchSuggestions(queries, 'ARTIFACT REMOVAL')).toEqual([]);
  });
  it('deduplicates and caps the visible menu', () => {
    expect(searchSuggestions([...queries, ...queries], 'removal', 2)).toEqual([
      'artifact removal',
      'mono white removal',
    ]);
  });
});
