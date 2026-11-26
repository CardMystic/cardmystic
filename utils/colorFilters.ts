import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';
import type { CardColorType } from '~/models/cardModel';

export function colorFilterSettings(filters?: CardSearchFilters) {
  const legacyIdentity =
    filters?.selectedColorFilterOption === 'Color Identity';
  return {
    selectedColorField: legacyIdentity
      ? ('Color Identity' as const)
      : (filters?.selectedColorField ??
        (filters?.selectedColorFilterOption
          ? 'Casting Colors'
          : 'Color Identity')),
    selectedColorFilterOption: legacyIdentity
      ? ('Match Exactly' as const)
      : (filters?.selectedColorFilterOption ?? 'Contains At Most'),
  };
}

export function normalizeSelectedColors(
  colors: CardColorType[],
  previous: CardColorType[],
  option: string,
): CardColorType[] {
  if (
    option === 'Contains At Most' ||
    !colors.includes('Colorless') ||
    colors.length < 2
  )
    return colors;
  return previous.includes('Colorless')
    ? colors.filter((color) => color !== 'Colorless')
    : ['Colorless'];
}
