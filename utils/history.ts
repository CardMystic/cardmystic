import type { Router } from 'vue-router';
import { detectPlatformFromFilters } from '~/utils/platformConfig';
import type { SearchHistoryItem } from '~/models/searchModel';

export type { SearchHistoryItem };

export const rerunSearchHistory = (item: SearchHistoryItem, router: Router) => {
  const searchTypeSegments: Record<string, string> = {
    ai: 'ai',
    similarity: 'similarity',
    keyword: 'keyword',
    commander: 'commander',
    recommend: 'deckbuilder',
  };
  const segment = searchTypeSegments[item.search_type] || 'ai';
  const platform = detectPlatformFromFilters(item.filters);
  const path = `/search/${platform}/${segment}`;
  const query: Record<string, string | number | undefined> = {
    searchType: item.search_type,
  };

  if (item.search_type === 'similarity') {
    query.card_name = item.query ?? undefined;
  } else if (item.search_type === 'recommend') {
    // Reconstruct recommend query from filters
    if (item.filters?.commander)
      query.commander = String(item.filters.commander);
    if (item.filters?.partnerCommander)
      query.partnerCommander = String(item.filters.partnerCommander);
    if (item.filters?.decklist) query.decklist = String(item.filters.decklist);
    if (item.filters?.limit) query.limit = String(item.filters.limit);
    if (item.query) query.description = item.query;
  } else {
    query.query = item.query ?? undefined;
  }

  if (item.filters) {
    // Strip recommend-specific fields from filters before stringifying
    const {
      commander: _commander,
      partnerCommander: _partnerCommander,
      decklist: _decklist,
      description: _description,
      limit: _limit,
      ...cardFilters
    } = item.filters as Record<string, unknown>;
    if (Object.keys(cardFilters).length > 0) {
      query.filters = JSON.stringify(cardFilters);
    }
  }

  router.push({ path, query });
};
