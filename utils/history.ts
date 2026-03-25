import type { Router } from 'vue-router';
import { detectPlatformFromFilters } from '~/utils/platformConfig';

export const rerunSearchHistory = (item: any, router: Router) => {
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
  const query: any = { searchType: item.search_type };

  if (item.search_type === 'similarity') {
    query.card_name = item.query;
  } else if (item.search_type === 'recommend') {
    // Reconstruct recommend query from filters
    if (item.filters?.commander) query.commander = item.filters.commander;
    if (item.filters?.partnerCommander)
      query.partnerCommander = item.filters.partnerCommander;
    if (item.filters?.decklist) query.decklist = item.filters.decklist;
    if (item.filters?.limit) query.limit = item.filters.limit;
    if (item.query) query.description = item.query;
  } else {
    query.query = item.query;
  }

  if (item.filters) {
    // Strip recommend-specific fields from filters before stringifying
    const {
      commander,
      partnerCommander,
      decklist,
      description,
      limit,
      ...cardFilters
    } = item.filters as Record<string, any>;
    if (Object.keys(cardFilters).length > 0) {
      query.filters = JSON.stringify(cardFilters);
    }
  }

  router.push({ path, query });
};
