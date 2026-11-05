import { describe, expect, it } from 'vitest';
import { chanceAtLeast, drawDistribution } from '~/utils/deckAnalytics';

describe('deck draw probabilities', () => {
  it('matches all possible hands for a small deck', () => {
    // Six equally likely pairs: AA, AB, AC, AB, AC, BC.
    expect(drawDistribution(4, 2, 2)).toEqual([1 / 6, 2 / 3, 1 / 6]);
    expect(chanceAtLeast(drawDistribution(4, 2, 2), 1)).toBeCloseTo(5 / 6);
  });
  it('matches independent hypergeometric counts for a Commander opening hand', () => {
    const choose = (n: number, k: number) => {
      let value = 1;
      for (let i = 1; i <= k; i++) value = (value * (n - i + 1)) / i;
      return value;
    };
    const distribution = drawDistribution(99, 37, 7);
    for (let k = 0; k <= 7; k++)
      expect(distribution[k]).toBeCloseTo(
        (choose(37, k) * choose(62, 7 - k)) / choose(99, 7),
        12,
      );
    expect(distribution.reduce((sum, value) => sum + value, 0)).toBeCloseTo(
      1,
      12,
    );
  });
  it('handles empty decks, guaranteed draws, and drawing past the end', () => {
    expect(drawDistribution(0, 0, 7)).toEqual([1]);
    expect(chanceAtLeast(drawDistribution(0, 0, 7), 1)).toBe(0);
    expect(chanceAtLeast(drawDistribution(60, 0, 7), 1)).toBe(0);
    expect(chanceAtLeast(drawDistribution(60, 60, 7), 7)).toBe(1);
    expect(drawDistribution(3, 2, 10)).toEqual([0, 0, 1, 0]);
  });
  it('rejects invalid counts and gives higher draw odds when more cards are seen', () => {
    expect(() => drawDistribution(10, 11, 7)).toThrow(RangeError);
    expect(() => drawDistribution(10, 2, Number.NaN)).toThrow(RangeError);
    expect(chanceAtLeast(drawDistribution(99, 37, 11), 4)).toBeGreaterThan(
      chanceAtLeast(drawDistribution(99, 37, 10), 4),
    );
  });
});
