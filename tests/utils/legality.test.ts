import { describe, it, expect } from 'vitest';
import {
  formatToLegalityKey,
  isLegal,
  isColorIdentityLegal,
} from '~/utils/legality';

// ---------------------------------------------------------------------------
// formatToLegalityKey
// ---------------------------------------------------------------------------
describe('formatToLegalityKey', () => {
  it('lowercases and removes spaces', () => {
    expect(formatToLegalityKey('Pauper Commander')).toBe('paupercommander');
    expect(formatToLegalityKey('Standard Brawl')).toBe('standardbrawl');
    expect(formatToLegalityKey('commander')).toBe('commander');
  });
});

// ---------------------------------------------------------------------------
// isLegal
// ---------------------------------------------------------------------------
describe('isLegal', () => {
  it('returns legal when legalities are undefined', () => {
    expect(isLegal(undefined, 'commander').legal).toBe(true);
  });

  it('returns illegal for not_legal status', () => {
    const result = isLegal({ commander: 'not_legal' }, 'commander');
    expect(result.legal).toBe(false);
    expect(result.reason).toMatch(/not legal/i);
  });

  it('returns illegal for missing format key', () => {
    const result = isLegal({}, 'commander');
    expect(result.legal).toBe(false);
  });

  it('returns illegal for banned card', () => {
    const result = isLegal({ modern: 'banned' }, 'modern');
    expect(result.legal).toBe(false);
    expect(result.reason).toMatch(/banned/i);
  });

  it('returns legal for restricted card with 1 copy', () => {
    const result = isLegal({ vintage: 'restricted' }, 'vintage', 1);
    expect(result.legal).toBe(true);
  });

  it('returns illegal for restricted card with more than 1 copy', () => {
    const result = isLegal({ vintage: 'restricted' }, 'vintage', 2);
    expect(result.legal).toBe(false);
    expect(result.reason).toMatch(/restricted/i);
  });

  it('returns legal in non-singleton format with 4 copies', () => {
    const result = isLegal({ modern: 'legal' }, 'modern', 4);
    expect(result.legal).toBe(true);
  });

  it('returns illegal in non-singleton format with 5 copies', () => {
    const result = isLegal({ modern: 'legal' }, 'modern', 5);
    expect(result.legal).toBe(false);
    expect(result.reason).toMatch(/max 4/i);
  });

  it('returns legal in singleton format with 1 copy', () => {
    const result = isLegal({ commander: 'legal' }, 'commander', 1);
    expect(result.legal).toBe(true);
  });

  it('returns illegal in singleton format with more than 1 copy', () => {
    const result = isLegal({ commander: 'legal' }, 'commander', 2);
    expect(result.legal).toBe(false);
    expect(result.reason).toMatch(/only 1/i);
  });

  it('allows multiple copies of basic lands in singleton formats', () => {
    const result = isLegal(
      { commander: 'legal' },
      'commander',
      10,
      'Basic Land — Forest',
    );
    expect(result.legal).toBe(true);
  });

  it('allows multiple copies of "any number" cards in singleton formats', () => {
    const result = isLegal(
      { commander: 'legal' },
      'commander',
      4,
      'Basic Land — Forest', // doesn't matter, oracle text triggers exemption
      'A deck can have any number of cards named Relentless Rats.',
    );
    expect(result.legal).toBe(true);
  });

  it('allows more than 4 copies of "any number" cards in non-singleton', () => {
    const result = isLegal(
      { modern: 'legal' },
      'modern',
      30,
      undefined,
      'A deck can have any number of cards named Rat Colony.',
    );
    expect(result.legal).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isColorIdentityLegal
// ---------------------------------------------------------------------------
describe('isColorIdentityLegal', () => {
  it('basic lands are always legal regardless of commander colors', () => {
    const result = isColorIdentityLegal(['W', 'U'], [], 'Basic Land — Island');
    expect(result.legal).toBe(true);
  });

  it('colorless cards are always within any commander identity', () => {
    const result = isColorIdentityLegal([], ['R', 'G'], 'Artifact');
    expect(result.legal).toBe(true);
  });

  it('returns legal when card colors are a subset of commander identity', () => {
    const result = isColorIdentityLegal(['R'], ['R', 'G'], 'Creature');
    expect(result.legal).toBe(true);
  });

  it('returns legal when card identity exactly matches commander identity', () => {
    const result = isColorIdentityLegal(
      ['W', 'U', 'B'],
      ['W', 'U', 'B'],
      'Instant',
    );
    expect(result.legal).toBe(true);
  });

  it('returns illegal when card has color outside commander identity', () => {
    const result = isColorIdentityLegal(['G'], ['R', 'W'], 'Creature');
    expect(result.legal).toBe(false);
    expect(result.reason).toMatch(/color identity/i);
  });

  it('is case-insensitive for color letters', () => {
    const result = isColorIdentityLegal(['w'], ['W', 'U'], 'Instant');
    expect(result.legal).toBe(true);
  });
});
