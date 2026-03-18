import type { CardSearchFilters } from '~/models/searchModel';

export type Platform = 'arena' | 'mtgo' | 'modern' | 'paper' | 'all';

/** Valid platform route params — used to validate [platform] in routes. */
export const validPlatforms: Platform[] = [
  'arena',
  'mtgo',
  'modern',
  'paper',
  'all',
];

export function isValidPlatform(value: string): value is Platform {
  return validPlatforms.includes(value as Platform);
}

/** Returns the base filters for a given platform. */
export function getPlatformFilters(
  platform: Platform,
): Partial<CardSearchFilters> {
  switch (platform) {
    case 'arena':
      return {
        isArena: true,
        selectedColorFilterOption: 'Contains At Least' as const,
      };
    case 'mtgo':
      return {
        isMTGO: true,
        selectedColorFilterOption: 'Contains At Least' as const,
      };
    case 'modern':
      return {
        selectedColorFilterOption: 'Contains At Least' as const,
        selectedCardFormats: [
          { format: 'Modern' as const, status: 'Legal' as const },
        ],
      };
    case 'paper':
      return {
        isPaper: true,
        selectedColorFilterOption: 'Contains At Least' as const,
      };
    case 'all':
    default:
      return { selectedColorFilterOption: 'Contains At Least' as const };
  }
}

/** Returns the Search component platform prop value (or undefined for non-platform-specific). */
export function getSearchPlatformProp(
  platform: Platform,
): 'arena' | 'mtgo' | 'paper' | undefined {
  if (platform === 'arena') return 'arena';
  if (platform === 'mtgo') return 'mtgo';
  if (platform === 'paper') return 'paper';
  return undefined;
}

/** Detect the platform from a filters object. Falls back to 'all' when filters are present but have no platform flag. */
export function detectPlatformFromFilters(
  filters: Record<string, any> | undefined | null,
  fallback: Platform = 'all',
): Platform {
  if (!filters) return fallback;
  if (filters.isArena) return 'arena';
  if (filters.isMTGO) return 'mtgo';
  if (filters.isPaper) return 'paper';
  if (
    filters.selectedCardFormats?.some((f: any) =>
      typeof f === 'string'
        ? f.toLowerCase().includes('modern')
        : f?.format?.toLowerCase() === 'modern',
    )
  )
    return 'modern';
  return 'all';
}

/** Display name for each platform (used in SEO titles). */
export function getPlatformDisplayName(platform: Platform): string {
  switch (platform) {
    case 'arena':
      return 'MTG Arena';
    case 'mtgo':
      return 'MTGO';
    case 'modern':
      return 'Modern';
    case 'paper':
      return 'Paper';
    case 'all':
      return 'MTG';
  }
}
