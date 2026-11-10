import { describe, expect, it } from 'vitest';
import { getUsdPrice, isBasicLand } from '../../utils/cardPrice';

describe('USD estimates', () => {
  it('identifies basic lands by supertype without excluding nonbasic Islands or Mountains', () => {
    for (const type_line of [
      'Basic Land — Island',
      'Basic Snow Land — Mountain',
      'Basic Land',
    ]) {
      expect(isBasicLand({ type_line })).toBe(true);
    }
    for (const type_line of [
      'Land — Island Mountain',
      'Land',
      'Creature — Island',
    ]) {
      expect(isBasicLand({ type_line })).toBe(false);
    }
    expect(isBasicLand(undefined)).toBe(false);
  });
  it('prefers actual printing prices before the paper-printing fallback', () => {
    expect(
      getUsdPrice({ usd: '10.00', usd_foil: '12.00', usd_estimate: '1.00' }),
    ).toBe('10.00');
    expect(
      getUsdPrice({ usd: null, usd_foil: '12.00', usd_estimate: '1.00' }),
    ).toBe('12.00');
    expect(
      getUsdPrice({ usd: null, usd_foil: null, usd_estimate: '1.00' }),
    ).toBe('1.00');
  });
  it('keeps genuinely unpriced copies unknown rather than zero', () => {
    expect(getUsdPrice({ usd: null, usd_foil: null })).toBeNull();
    expect(
      getUsdPrice({ usd: '', usd_foil: '-1', usd_estimate: 'NaN' }),
    ).toBeNull();
    expect(getUsdPrice({ usd: '0.00', usd_estimate: '1.00' })).toBe('0.00');
  });
});
