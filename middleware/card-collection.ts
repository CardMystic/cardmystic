import type { CardCollectionKind } from '~/models/collectionModel';

export default defineNuxtRouteMiddleware(async (to) => {
  const kind = to.path.split('/')[1] as CardCollectionKind;
  const slug = String(to.params.slug);
  const request = useRequestFetch();
  const base = useRuntimeConfig().public.backendPath;
  const { data, error } = await useCardCollections();
  if (error.value || !data.value)
    throw createError({
      statusCode: 503,
      statusMessage: 'Card collections are temporarily unavailable.',
    });
  const entry = data.value[kind].find((item) => item.slug === slug);
  if (entry) {
    to.meta.collectionEntry = entry;
    return;
  }
  if (kind !== 'sets' && /^[a-z0-9-]{1,100}$/.test(slug)) {
    const { path } = await request<{ path: string | null }>(
      `${base}/card-collections/redirect/${kind}/${slug}`,
    );
    if (path && /^\/(roles|themes)\/[a-z0-9-]+$/.test(path))
      return navigateTo(
        { path, query: to.query, hash: to.hash },
        { redirectCode: 301 },
      );
  }
  throw createError({
    statusCode: 404,
    statusMessage: 'Card collection not found.',
  });
});
