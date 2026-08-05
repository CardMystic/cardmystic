import { describe, it, expect } from 'vitest';
import {
  pairings,
  groupedPairings,
  getColorIdentityName,
} from '~/utils/colorPairings';

// ---------------------------------------------------------------------------
// Data invariants
// ---------------------------------------------------------------------------
describe('pairings data', () => {
  it('has unique names', () => {
    const names = pairings.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('groups cover all multi-color pairings by size', () => {
    const groupedTotal = groupedPairings.reduce(
      (sum, g) => sum + g.pairings.length,
      0,
    );
    expect(groupedTotal).toBe(pairings.length);
  });
});

// ---------------------------------------------------------------------------
// getColorIdentityName
// ---------------------------------------------------------------------------
describe('getColorIdentityName', () => {
  it('returns empty string for missing or empty colors', () => {
    expect(getColorIdentityName(undefined)).toBe('');
    expect(getColorIdentityName([])).toBe('');
  });

  it('names mono colors and guilds', () => {
    expect(getColorIdentityName(['Blue'])).toBe('Blue');
    expect(getColorIdentityName(['White', 'Blue'])).toBe('Azorius');
    expect(getColorIdentityName(['Black', 'Red'])).toBe('Rakdos');
  });

  it('is order-agnostic', () => {
    expect(getColorIdentityName(['Blue', 'White'])).toBe('Azorius');
    expect(getColorIdentityName(['Red', 'Black', 'Blue'])).toBe('Grixis');
  });

  it('deduplicates colors before matching', () => {
    expect(getColorIdentityName(['White', 'White', 'Blue'])).toBe('Azorius');
  });

  it('names shards, wedges, and five-color', () => {
    expect(getColorIdentityName(['White', 'Blue', 'Black'])).toBe('Esper');
    expect(getColorIdentityName(['White', 'Black', 'Green'])).toBe('Abzan');
    expect(
      getColorIdentityName(['White', 'Blue', 'Black', 'Red', 'Green']),
    ).toBe('Five-Color');
  });

  it('falls back to WUBRG initials for unnamed combinations', () => {
    // Colorless + a color has no named pairing.
    expect(getColorIdentityName(['Red', 'Colorless'])).toBe('RColorless');
  });
});
