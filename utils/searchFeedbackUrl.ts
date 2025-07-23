import type { PageInfo } from '~/models/pageInfoModel';

export default (pageInfo: PageInfo | undefined) => {
  const baseUrl =
    'https://github.com/CardMystic/cardmystic/issues/new?template=search_results_feedback.yml';
  if (!pageInfo) {
    return baseUrl;
  }

  const { page_url, page_name, query, card_name, filters, labels } = pageInfo;
  const queryOrCardName = query || card_name || '';
  const filtersString = filters ? JSON.stringify(filters) : '';
  const hostname =
    typeof window !== 'undefined'
      ? window.location.hostname
      : process.env.NUXT_PUBLIC_SITE_DOMAIN || '';
  return `${baseUrl}&title=[FEEDBACK] ${page_name}&page-url=${hostname}${page_url}&query-or-card=${queryOrCardName}&labels=feedback${labels && labels.length > 0 ? `,${labels.join(',')}` : ''}${filtersString ? `&filters=${filtersString}` : ''}`;
};
