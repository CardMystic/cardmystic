import type { H3Event } from 'h3';
import { SitemapDataCache } from './sitemapDataCache';

let cache: SitemapDataCache | undefined;
export function loadSitemapData(event: H3Event) {
  const config = useRuntimeConfig(event);
  cache ??= new SitemapDataCache(
    () => useStorage('assets:sitemap').getItem('data.json'),
    config.sitemapDataUrl,
  );
  return cache.get();
}
