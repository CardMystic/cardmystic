import { hashKey } from '@tanstack/vue-query';
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import {
  filterSearchResultsByQuality,
  type SearchQualityOptions,
} from '~/utils/searchQuality';

/** Keep raw cached results intact while revealing the lower-scored tail on demand. */
export function useSearchQualityResults<
  T extends { ai_normalized_score?: number },
>(
  rawResults: MaybeRefOrGetter<readonly T[] | undefined>,
  queryKey: MaybeRefOrGetter<readonly unknown[]>,
  options: MaybeRefOrGetter<SearchQualityOptions>,
) {
  const showAll = ref(false);
  const identity = computed(() => hashKey(toValue(queryKey)));
  // Reset before rendering newly cached data, even when navigation skips a loading state.
  watch(identity, () => (showAll.value = false), { flush: 'sync' });

  const initialResults = computed(() => {
    const cards = toValue(rawResults);
    return cards === undefined
      ? undefined
      : filterSearchResultsByQuality(cards, toValue(options));
  });
  const results = computed(() =>
    showAll.value ? toValue(rawResults)?.slice() : initialResults.value,
  );
  const hiddenResultCount = computed(() =>
    showAll.value
      ? 0
      : (toValue(rawResults)?.length ?? 0) -
        (initialResults.value?.length ?? 0),
  );

  function loadMoreResults() {
    if (hiddenResultCount.value > 0) showAll.value = true;
  }

  return { results, hiddenResultCount, loadMoreResults };
}
