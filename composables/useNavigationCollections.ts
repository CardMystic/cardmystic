import type { NavigationCatalog } from '~/utils/navigationCollections';

export function useNavigationCollections() {
  const request = useRequestFetch();
  return useAsyncData(
    'navigation-collections',
    () => request<NavigationCatalog>('/api/navigation'),
    { dedupe: 'defer' },
  );
}
