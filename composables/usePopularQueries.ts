import { POPULAR_QUERIES } from '~/utils/popularQueries';

/** Curated suggestions are bundled so they are available during server rendering. */
export function usePopularQueries() {
  return { popularQueries: computed(() => POPULAR_QUERIES) };
}
