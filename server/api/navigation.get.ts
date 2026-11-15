import type { CardCollectionCatalog } from '../../models/collectionModel';
import { navigationCatalog } from '../../utils/navigationCollections';

export default defineCachedEventHandler(
  async () => {
    const catalog = await $fetch<CardCollectionCatalog>(
      '/api/backend/card-collections',
    );
    return navigationCatalog(catalog);
  },
  { maxAge: 300, name: 'navigation-collections', swr: true },
);
