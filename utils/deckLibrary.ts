import type { ColorRatios } from '~/models/cardListModel';

export type LibrarySort =
  'updated_at' | 'created_at' | 'name' | 'format' | 'colors' | 'bracket';
const colors = ['W', 'U', 'B', 'R', 'G'] as const;

export function deckColors(ratios?: Partial<ColorRatios> | null): string[] {
  const present = colors.filter((color) => (ratios?.[color] ?? 0) > 0);
  return present.length ? present : ratios?.C ? ['C'] : [];
}

// Keep this ordering in sync with the backend: color count, then W/U/B/R/G combinations.
export function deckColorSortKey(ratios?: Partial<ColorRatios> | null): number {
  return colors.reduce(
    (key, color, index) =>
      key + ((ratios?.[color] ?? 0) > 0 ? 32 + (1 << index) : 0),
    0,
  );
}
