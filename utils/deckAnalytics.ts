export interface DeckAnalytics {
  librarySize: number;
  lands: number;
  modalLands: number;
  commanders: number;
  averageManaValue: number | null;
  types: { name: string; count: number }[];
  roles: { name: string; count: number }[] | null;
  prices: {
    knownPriceCents: number;
    missingPrices: number;
    topCards: {
      oracleId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
    }[];
  };
}

/** Exact probabilities when drawing without replacement; index = matching cards drawn. */
export function drawDistribution(
  size: number,
  matches: number,
  draws: number,
): number[] {
  if (
    ![size, matches, draws].every(Number.isSafeInteger) ||
    size < 0 ||
    matches < 0 ||
    matches > size ||
    draws < 0
  )
    throw new RangeError('Invalid deck or draw count.');
  let probabilities = [1];
  for (let drawn = 0; drawn < Math.min(size, draws); drawn++) {
    const next = Array<number>(probabilities.length + 1).fill(0);
    for (let hits = 0; hits < probabilities.length; hits++) {
      const chance = probabilities[hits] ?? 0;
      if (!chance) continue;
      next[hits] =
        (next[hits] ?? 0) +
        (chance * Math.max(0, size - matches - (drawn - hits))) /
          (size - drawn);
      next[hits + 1] =
        (next[hits + 1] ?? 0) +
        (chance * Math.max(0, matches - hits)) / (size - drawn);
    }
    probabilities = next;
  }
  return probabilities;
}

export function chanceAtLeast(distribution: number[], count: number): number {
  return Math.min(
    1,
    Math.max(
      0,
      distribution.slice(count).reduce((sum, value) => sum + value, 0),
    ),
  );
}
