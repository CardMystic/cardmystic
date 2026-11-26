import { describe, expect, it } from 'vitest';
import {
  colorFilterSettings,
  normalizeSelectedColors,
} from '~/utils/colorFilters';

describe('color filter settings', () => {
  it('defaults to identity contained within the selected colors', () => {
    expect(colorFilterSettings()).toEqual({
      selectedColorField: 'Color Identity',
      selectedColorFilterOption: 'Contains At Most',
    });
  });
  it('preserves legacy exact identity searches and ordinary color searches', () => {
    expect(
      colorFilterSettings({ selectedColorFilterOption: 'Color Identity' }),
    ).toEqual({
      selectedColorField: 'Color Identity',
      selectedColorFilterOption: 'Match Exactly',
    });
    expect(
      colorFilterSettings({ selectedColorFilterOption: 'Match Exactly' })
        .selectedColorField,
    ).toBe('Casting Colors');
  });
  it('keeps the chosen field independent of the comparison', () => {
    expect(
      colorFilterSettings({
        selectedColorField: 'Casting Colors',
        selectedColorFilterOption: 'Contains At Most',
      }).selectedColorField,
    ).toBe('Casting Colors');
  });
  it('allows colorless alongside colors only for Contains at Most', () => {
    expect(
      normalizeSelectedColors(
        ['Red', 'Colorless'],
        ['Red'],
        'Contains At Most',
      ),
    ).toEqual(['Red', 'Colorless']);
    expect(
      normalizeSelectedColors(['Red', 'Colorless'], ['Red'], 'Match Exactly'),
    ).toEqual(['Colorless']);
    expect(
      normalizeSelectedColors(
        ['Red', 'Colorless'],
        ['Colorless'],
        'Contains At Least',
      ),
    ).toEqual(['Red']);
  });
});
