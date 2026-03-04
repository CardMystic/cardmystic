import type { Router } from 'vue-router';

export const rerunSearchHistory = (item: any, router: Router) => {
  const paths: Record<string, string> = {
    ai: '/search',
    similarity: '/search/similarity',
    keyword: '/search/keyword',
    commander: '/search/commander',
  };
  const path = paths[item.search_type] || '/search';
  const query: any = { searchType: item.search_type };

  if (item.search_type === 'similarity') {
    query.card_name = item.query;
  } else {
    query.query = item.query;
  }

  if (item.filters) {
    query.filters = JSON.stringify(item.filters);
  }

  router.push({ path, query });
};
