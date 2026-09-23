import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';
import { getPlatformFilters, type Platform } from '~/utils/platformConfig';
import { getAllSeoSlugs, getSeoEntry, getSeoPath } from '~/utils/seoQueries';

type SearchLinkType =
  | 'smart'
  | 'similarity'
  | 'keyword'
  | 'commander'
  | 'recommend'
  | 'deckbuilder'
  | 'popular-by-commander';

interface SearchLinkOptions {
  platform: Platform;
  searchType: SearchLinkType;
  query: string;
  filters?: Partial<CardSearchFilters>;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

function filterKey(filters: Partial<CardSearchFilters>): string {
  // Object key order does not affect a search. Keep values intact so curated
  // pages cannot silently add restrictions or discard requested filters.
  return JSON.stringify(filters, (_key, value) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        )
      : value,
  );
}

/** Prefer an existing curated page only when it runs the same search. */
export function getSearchLink({
  platform,
  searchType,
  query,
  filters,
}: SearchLinkOptions): RouteLocationRaw {
  const routeType = searchType === 'recommend' ? 'deckbuilder' : searchType;
  const isPopularity = routeType === 'popular-by-commander';
  const defaults: Partial<CardSearchFilters> = isPopularity
    ? {}
    : {
        ...getPlatformFilters(platform),
        ...(routeType === 'commander' ? { isCommander: true } : {}),
      };
  const requestedFilters = filterKey(filters ?? defaults);
  const group = getAllSeoSlugs().find(
    (group) => group.platform === platform && group.searchType === routeType,
  );
  const entry = group?.slugs
    .map((slug) => getSeoEntry(platform, routeType, slug))
    .find(
      (candidate) =>
        candidate &&
        normalizeQuery(candidate.query) === normalizeQuery(query) &&
        filterKey({ ...candidate.filters, ...defaults }) === requestedFilters,
    );

  if (entry) {
    return { path: getSeoPath(platform, routeType, entry.slug) };
  }

  const params: LocationQueryRaw = {};
  if (!isPopularity) {
    params.searchType = routeType === 'deckbuilder' ? 'recommend' : routeType;
  }
  if (routeType === 'similarity') params.card_name = query;
  else if (routeType === 'deckbuilder' || isPopularity)
    params.commander = query;
  else params.query = query;
  if (filters) params.filters = JSON.stringify(filters);

  return {
    path: isPopularity
      ? `/popular-by-commander/${platform}`
      : `/search/${platform}/${routeType}`,
    query: params,
  };
}
