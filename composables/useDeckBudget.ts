import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';

export function useDeckBudget(
  listId: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const api = useLibraryApi();
  const client = useQueryClient();
  const key = computed(() => [
    'deck-budget',
    api.userId.value,
    toValue(listId),
  ]);
  const query = useQuery({
    queryKey: key,
    enabled: computed(() => api.ready.value && toValue(enabled)),
    queryFn: () =>
      api.request<{ targetBudget: number | null }>(
        `/lists/${toValue(listId)}/budget`,
      ),
    retry: false,
  });
  const saving = ref(false);
  async function save(targetBudget: number | null) {
    if (saving.value)
      throw new Error('Please wait for the budget to finish saving.');
    const savedKey = [...key.value];
    const id = toValue(listId);
    saving.value = true;
    try {
      const result = await api.request<{ targetBudget: number | null }>(
        `/lists/${id}/budget`,
        'PUT',
        { targetBudget },
      );
      client.setQueryData(savedKey, result);
    } finally {
      saving.value = false;
    }
  }
  return {
    budget: computed(() => query.data.value?.targetBudget ?? null),
    ready: query.isSuccess,
    error: query.error,
    saving,
    save,
    retry: query.refetch,
  };
}
