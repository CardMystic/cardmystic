import { describe, expect, it } from 'vitest';
import {
  filterSearchResultsByQuality,
  resolveSearchQualityRatio,
} from '~/utils/searchQuality';

type Result = { name: string; ai_normalized_score?: number };
const result = (name: string, score?: number): Result => ({
  name,
  ...(score === undefined ? {} : { ai_normalized_score: score }),
});
const names = (results: Result[]) => results.map((entry) => entry.name);

describe('semantic search quality filtering', () => {
  it.each([
    { mode: 'smart' as const, best: 0.8, boundary: 0.68 },
    { mode: 'similarity' as const, best: 0.8, boundary: 0.64 },
  ])(
    'includes the literal decimal $boundary boundary for $mode with best $best',
    ({ mode, best, boundary }) => {
      const cards = [
        result('best', best),
        result('decimal boundary', boundary),
        result('below boundary', boundary - 0.00000001),
      ];
      expect(names(filterSearchResultsByQuality(cards, { mode }))).toEqual([
        'best',
        'decimal boundary',
      ]);
    },
  );

  it('retains good relative matches when the whole Smart query scores low', () => {
    const cards = [
      result('best', 0.4),
      result('close match', 0.35),
      result('weak tail', 0.2),
    ];
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart' })),
    ).toEqual(['best', 'close match']);
  });

  it('preserves the searched card without using its score as the baseline', () => {
    const cards = [
      result('searched card', 1),
      result('best match', 0.5),
      result('boundary match', 0.4),
      result('weak tail', 0.399),
    ];
    expect(
      names(
        filterSearchResultsByQuality(cards, {
          mode: 'similarity',
          preserveFirst: true,
        }),
      ),
    ).toEqual(['searched card', 'best match', 'boundary match']);
  });

  it('preserves an unscored searched card when there are no positive matches', () => {
    const cards = [result('searched card'), result('no match', 0)];
    expect(
      names(
        filterSearchResultsByQuality(cards, {
          mode: 'similarity',
          preserveFirst: true,
        }),
      ),
    ).toEqual(['searched card']);
  });

  it('finds the best score in unsorted input without reordering retained cards', () => {
    const cards = [
      result('close match', 0.86),
      result('weak tail', 0.1),
      result('unscored'),
      result('best', 1),
    ];
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart' })),
    ).toEqual(['close match', 'unscored', 'best']);
  });

  it('keeps unknown scores instead of pretending they are poor matches', () => {
    const cards = [
      result('unscored'),
      result('nan', Number.NaN),
      result('infinite', Number.POSITIVE_INFINITY),
      result('negative infinite', Number.NEGATIVE_INFINITY),
      result('best', 1),
      result('weak tail', 0.1),
    ];
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart' })),
    ).toEqual(['unscored', 'nan', 'infinite', 'negative infinite', 'best']);
  });

  it('drops finite zero and negative candidate scores even without a positive baseline', () => {
    const cards = [
      result('zero', 0),
      result('negative', -0.1),
      result('unknown'),
    ];
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart' })),
    ).toEqual(['unknown']);
    expect(
      filterSearchResultsByQuality(cards.slice(0, 2), { mode: 'similarity' }),
    ).toEqual([]);
  });

  it('clamps malformed finite scores so an outlier cannot suppress all valid matches', () => {
    const cards = [
      result('outlier', 5),
      result('valid best', 1),
      result('boundary', 0.85),
      result('negative', -5),
    ];
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart' })),
    ).toEqual(['outlier', 'valid best', 'boundary']);
    expect(cards[0].ai_normalized_score).toBe(5);
  });
});

describe('runtime search quality ratios', () => {
  it.each([0, 0.5, 1, ' 0.72 '])(
    'accepts valid numeric or environment value %s',
    (value) => {
      expect(resolveSearchQualityRatio(value, 'smart')).toBe(Number(value));
    },
  );

  it.each([undefined, ' ', '85%', true, -0.1, 1.01, Infinity])(
    'uses each search default for invalid value %s',
    (value) => {
      expect(resolveSearchQualityRatio(value, 'smart')).toBe(0.85);
      expect(resolveSearchQualityRatio(value, 'similarity')).toBe(0.8);
    },
  );

  it('uses an environment override without changing the other search default', () => {
    const cards = [
      result('best', 1),
      result('close', 0.9),
      result('tail', 0.5),
    ];
    expect(
      names(
        filterSearchResultsByQuality(cards, { mode: 'smart', ratio: '0.95' }),
      ),
    ).toEqual(['best']);
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'similarity' })),
    ).toEqual(['best', 'close']);
  });

  it('zero reveals all positive scored candidates and one keeps only top ties', () => {
    const cards = [
      result('best', 0.9),
      result('tied', 0.9),
      result('tail', 0.01),
      result('zero', 0),
    ];
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart', ratio: '0' })),
    ).toEqual(['best', 'tied', 'tail']);
    expect(
      names(filterSearchResultsByQuality(cards, { mode: 'smart', ratio: '1' })),
    ).toEqual(['best', 'tied']);
  });
});
