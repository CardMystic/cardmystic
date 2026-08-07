import { describe, it, expect } from 'vitest';
import {
  validPlatforms,
  isValidPlatform,
  getPlatformFilters,
  getSearchPlatformProp,
  detectPlatformFromFilters,
  getPlatformDisplayName,
} from '~/utils/platformConfig';

// ---------------------------------------------------------------------------
// isValidPlatform
// ---------------------------------------------------------------------------
describe('isValidPlatform', () => {
  it('accepts every declared platform', () => {
    for (const platform of validPlatforms) {
      expect(isValidPlatform(platform)).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(isValidPlatform('')).toBe(false);
    expect(isValidPlatform('vintage')).toBe(false);
    expect(isValidPlatform('ARENA')).toBe(false);
    expect(isValidPlatform('all ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPlatformFilters
// ---------------------------------------------------------------------------
describe('getPlatformFilters', () => {
  it('maps arena/mtgo/paper to their boolean flags', () => {
    expect(getPlatformFilters('arena')).toEqual({ isArena: true });
    expect(getPlatformFilters('mtgo')).toEqual({ isMTGO: true });
    expect(getPlatformFilters('paper')).toEqual({ isPaper: true });
  });

  it('maps modern/commander to format legality filters', () => {
    expect(getPlatformFilters('modern')).toEqual({
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    });
    expect(getPlatformFilters('commander')).toEqual({
      selectedCardFormats: [{ format: 'Commander', status: 'Legal' }],
    });
  });

  it('returns no filters for all', () => {
    expect(getPlatformFilters('all')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getSearchPlatformProp
// ---------------------------------------------------------------------------
describe('getSearchPlatformProp', () => {
  it('passes through arena/mtgo/paper', () => {
    expect(getSearchPlatformProp('arena')).toBe('arena');
    expect(getSearchPlatformProp('mtgo')).toBe('mtgo');
    expect(getSearchPlatformProp('paper')).toBe('paper');
  });

  it('returns undefined for format-based and generic platforms', () => {
    expect(getSearchPlatformProp('modern')).toBeUndefined();
    expect(getSearchPlatformProp('commander')).toBeUndefined();
    expect(getSearchPlatformProp('all')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// detectPlatformFromFilters
// ---------------------------------------------------------------------------
describe('detectPlatformFromFilters', () => {
  it('returns the fallback when filters are missing', () => {
    expect(detectPlatformFromFilters(undefined)).toBe('all');
    expect(detectPlatformFromFilters(null)).toBe('all');
    expect(detectPlatformFromFilters(null, 'arena')).toBe('arena');
  });

  it('detects boolean platform flags', () => {
    expect(detectPlatformFromFilters({ isArena: true })).toBe('arena');
    expect(detectPlatformFromFilters({ isMTGO: true })).toBe('mtgo');
    expect(detectPlatformFromFilters({ isPaper: true })).toBe('paper');
  });

  it('detects format filters in object form', () => {
    expect(
      detectPlatformFromFilters({
        selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      }),
    ).toBe('modern');
    expect(
      detectPlatformFromFilters({
        selectedCardFormats: [{ format: 'Commander', status: 'Legal' }],
      }),
    ).toBe('commander');
  });

  it('detects format filters in legacy string form', () => {
    expect(
      detectPlatformFromFilters({ selectedCardFormats: ['Modern Legal'] }),
    ).toBe('modern');
    expect(
      detectPlatformFromFilters({ selectedCardFormats: ['commander'] }),
    ).toBe('commander');
  });

  it('prefers boolean flags over format filters', () => {
    expect(
      detectPlatformFromFilters({
        isArena: true,
        selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      }),
    ).toBe('arena');
  });

  it('falls back to all for unrelated filters', () => {
    expect(detectPlatformFromFilters({ colors: ['Red'] })).toBe('all');
    expect(
      detectPlatformFromFilters({
        selectedCardFormats: [{ format: 'Standard', status: 'Legal' }],
      }),
    ).toBe('all');
  });
});

// ---------------------------------------------------------------------------
// getPlatformDisplayName
// ---------------------------------------------------------------------------
describe('getPlatformDisplayName', () => {
  it('returns a non-empty display name for every platform', () => {
    for (const platform of validPlatforms) {
      expect(getPlatformDisplayName(platform)).toBeTruthy();
    }
    expect(getPlatformDisplayName('arena')).toBe('MTG Arena');
    expect(getPlatformDisplayName('all')).toBe('MTG');
  });
});
