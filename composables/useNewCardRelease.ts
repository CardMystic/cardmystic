import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';

interface ReleaseStatus {
  set: { slug: string; name: string; releasedAt: string } | null;
  acknowledgedAt: string | null;
  shouldSuggest: boolean;
}

export function useNewCardRelease(
  listId: string,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const api = useLibraryApi();
  const client = useQueryClient();
  const key = computed(() => ['deck-new-release', api.userId.value, listId]);
  const query = useQuery({
    queryKey: key,
    enabled: computed(
      () => api.ready.value && api.isPro.value && toValue(enabled),
    ),
    queryFn: () => api.request<ReleaseStatus>(`/lists/${listId}/new-cards`),
    retry: false,
  });
  async function acknowledge() {
    const savedKey = [...key.value];
    const result = await api.request<{ acknowledgedAt: string }>(
      `/lists/${listId}/new-cards/acknowledge`,
      'PUT',
      {},
    );
    client.setQueryData<ReleaseStatus>(
      savedKey,
      (current) =>
        current && {
          ...current,
          acknowledgedAt: result.acknowledgedAt,
          shouldSuggest: false,
        },
    );
  }
  return { status: query.data, acknowledge };
}
