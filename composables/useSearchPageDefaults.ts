import { inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';

interface SearchPageDefaults {
  query: string;
  filters: ComputedRef<Partial<CardSearchFilters>>;
}

const searchPageDefaultsKey: InjectionKey<SearchPageDefaults | undefined> =
  Symbol('search-page-defaults');

// Pages already resolve their SEO entry. Share the active query and filters
// without loading the SEO catalog in search forms used on the homepage.
export function provideSearchPageDefaults(
  defaults: SearchPageDefaults | undefined,
) {
  provide(searchPageDefaultsKey, defaults);
}

export function useSearchPageDefaults() {
  return inject(searchPageDefaultsKey, undefined);
}
