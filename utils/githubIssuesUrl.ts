import type { Device } from '@nuxtjs/device/runtime/types';
import type { PageInfo } from '~/models/pageInfoModel';

export default (pageInfo: PageInfo | undefined, device: Device) => {
  const baseUrl =
    'https://github.com/CardMystic/cardmystic/issues/new?template=bug_report.yml';
  if (!pageInfo) {
    return baseUrl;
  }

  const { page_url, page_name, labels, query, card_name, filters } = pageInfo;
  const queryOrCardName = query || card_name || '';
  const filtersString = filters ? JSON.stringify(filters) : '';
  const hostname =
    typeof window !== 'undefined'
      ? window.location.hostname
      : process.env.NUXT_PUBLIC_SITE_DOMAIN || '';
  return `${baseUrl}&title=[ISSUE] On '${page_name}' page&page-url=${hostname}${page_url}&user-agent=${device.userAgent}&query-or-card=${queryOrCardName}${labels && labels.length > 0 ? `&labels=${labels.join(',')}` : ''}${filtersString ? `&filters=${filtersString}` : ''}`;
};
