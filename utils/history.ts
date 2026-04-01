import type { Router } from 'vue-router';
import { detectPlatformFromFilters } from '~/utils/platformConfig';
import type { CardSearchFilters } from '~/models/searchModel';
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
  const platform = detectPlatformFromFilters(
    item.filters as Partial<CardSearchFilters>,
  );
  const path = `/search/${platform}/${segment}`;
  const query: Record<string, string | number | undefined> = {
    searchType: item.search_type,
  };

  if (item.search_type === 'similarity') {
    query.card_name = item.query ?? undefined;
  } else if (item.search_type === 'recommend') {
    // Reconstruct recommend query from filters
    const f = item.filters as Record<string, unknown> | null;
    if (f?.commander) query.commander = String(f.commander);
    if (f?.partnerCommander)
      query.partnerCommander = String(f.partnerCommander);
    if (f?.decklist) query.decklist = String(f.decklist);
    if (f?.limit) query.limit = String(f.limit);
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
