import type { Router } from 'vue-router';

export const rerunSearchHistory = (item: any, router: Router) => {
  const paths: Record<string, string> = {
    ai: '/search',
    similarity: '/search/similarity',
    keyword: '/search/keyword',
    commander: '/search/commander',
    recommend: '/search/recommend',
  };
  const path = paths[item.search_type] || '/search';
  const query: any = { searchType: item.search_type };

  if (item.search_type === 'similarity') {
    query.card_name = item.query;
  } else if (item.search_type === 'recommend') {
    // Reconstruct recommend query from filters
    if (item.filters?.commander) query.commander = item.filters.commander;
    if (item.filters?.partnerCommander)
      query.partnerCommander = item.filters.partnerCommander;
    if (item.filters?.decklist) query.decklist = item.filters.decklist;
    if (item.filters?.description) query.description = item.filters.description;
    if (item.filters?.limit) query.limit = item.filters.limit;
    if (item.query) query.description = item.query;
  } else {
    query.query = item.query;
  }

  if (item.filters && item.search_type !== 'recommend') {
    query.filters = JSON.stringify(item.filters);
  }

  router.push({ path, query });
};
