import type { H3Event } from 'h3';
import type { CardCollectionCatalog } from '~/models/collectionModel';
import { backendTarget } from './backendGateway';

const collectionPaths = defineCachedFunction(
  async (backendUrl: string, apiKey: string) => {
    const target = backendTarget(backendUrl, '/api/backend/card-collections');
    if (!target) throw new Error('Invalid collection endpoint');
    const catalog = await $fetch<CardCollectionCatalog>(target, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
      retry: 0,
      redirect: 'error',
    });
    return (['sets', 'themes', 'roles'] as const).flatMap((kind) => {
      if (!Array.isArray(catalog[kind]))
        throw new Error('Invalid collection catalog');
      return catalog[kind].map((entry) => {
        if (
          !/^[a-z0-9-]{1,100}$/.test(entry.slug) ||
          !Number.isSafeInteger(entry.cardCount) ||
          entry.cardCount < 1
        )
          throw new Error('Invalid collection sitemap entry');
        return `/${kind}/${entry.slug}`;
      });
    });
  },
  {
    name: 'sitemap-collections',
    maxAge: 3600,
    getKey: (backendUrl) => backendUrl,
  },
);

export async function loadSitemapCollectionPaths(event: H3Event) {
  const config = useRuntimeConfig(event);
  try {
    return await collectionPaths(config.backendUrl, config.backendApiKey);
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Sitemap temporarily unavailable',
    });
  }
}
