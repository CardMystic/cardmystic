import {
  computed,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import type { DecklistSummary } from '~/models/cardListModel';

/** Scan the existing newest-first private deck pages, stopping at the first match. */
export function useLatestCommanderDeck(
  commander: MaybeRefOrGetter<string | undefined>,
) {
  const { userId, loading: authLoading } = useUserProfile();
  const name = computed(() => toValue(commander)?.trim().toLowerCase() ?? '');
  const page = ref(1);
  const finished = ref(false);
  const deck = shallowRef<DecklistSummary | null>(null);
  const enabled = computed(
    () =>
      !!name.value && !!userId.value && !authLoading.value && !finished.value,
  );
  const options = ref({
    kind: 'deck' as const,
    folder: '',
    sort: 'updated_at',
    direction: 'desc',
  });
  const lists = useMyDecklists(page, 50, options, enabled);
  // Clear an old account/card's selection immediately. Read results after the
  // query observer has switched to the new account and page.
  watch(
    [userId, name],
    () => {
      page.value = 1;
      finished.value = false;
      deck.value = null;
    },
    { flush: 'sync' },
  );
  watch(
    [
      lists.decklists,
      lists.isFetching,
      lists.isLoading,
      lists.isSuccess,
      lists.isPlaceholderData,
      lists.resolvedPage,
      lists.totalPages,
      lists.error,
      enabled,
      page,
    ],
    () => {
      if (
        !enabled.value ||
        lists.isFetching.value ||
        lists.isLoading.value ||
        lists.isPlaceholderData.value
      )
        return;
      if (lists.error.value) {
        finished.value = true;
        return;
      }
      // Idle queries and previous-page data are not completed empty results.
      if (!lists.isSuccess.value || lists.resolvedPage.value !== page.value)
        return;
      const match = lists.decklists.value.find((item) =>
        item.commanders?.some(
          (value) => value.trim().toLowerCase() === name.value,
        ),
      );
      if (match) {
        deck.value = match;
        finished.value = true;
      } else if (page.value < lists.totalPages.value) page.value++;
      else finished.value = true;
    },
    { immediate: true, flush: 'post' },
  );
  return {
    deck,
    pending: computed(
      () => !!name.value && (authLoading.value || enabled.value),
    ),
  };
}
