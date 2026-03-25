import type { CardSearchFilters } from '~/models/searchModel';

const quickFilterKeys = new Set([
  'isArena',
  'isMTGO',
  'isPaper',
  'selectedCardFormats',
  'selectedColorFilterOption',
]);

export function hasAdvancedFilters(
  filters: Partial<CardSearchFilters> | undefined,
): boolean {
  if (!filters) return false;
  return Object.entries(filters).some(
    ([key, value]) => !quickFilterKeys.has(key) && value !== undefined,
  );
}
