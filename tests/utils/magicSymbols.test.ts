import { describe, expect, it } from 'vitest';
import { extractMagicSymbols, restoreMagicSymbols } from '~/utils/magicSymbols';

describe('Magic markdown symbols', () => {
  it('extracts known symbols case-insensitively and leaves unknown tokens alone', () => {
    const result = extractMagicSymbols(
      'Pay {20}{w}, then add {E}. Keep {UNKNOWN}.',
    );

    expect(result.text).toBe(
      'Pay MAGICSYMBOLTOKEN0MAGICSYMBOLTOKENMAGICSYMBOLTOKEN1MAGICSYMBOLTOKEN, then add MAGICSYMBOLTOKEN2MAGICSYMBOLTOKEN. Keep {UNKNOWN}.',
    );
    expect(result.symbols.map((entry) => entry.token)).toEqual([
      '20',
      'W',
      'E',
    ]);
  });

  it('restores accessible icon markup for extracted symbols', () => {
    const extracted = extractMagicSymbols('Gain {+1/+1} and {FLYING}.');
    const html = restoreMagicSymbols(extracted.text, extracted.symbols);

    expect(html).toContain('ms-counter-plus');
    expect(html).toContain('aria-label="+1/+1 counter"');
    expect(html).toContain('ms-ability-flying');
    expect(html).toContain('aria-label="Flying"');
  });

  it('does not replace a placeholder without a matching extracted symbol', () => {
    expect(restoreMagicSymbols('MAGICSYMBOLTOKEN9MAGICSYMBOLTOKEN', [])).toBe(
      'MAGICSYMBOLTOKEN9MAGICSYMBOLTOKEN',
    );
  });
});
