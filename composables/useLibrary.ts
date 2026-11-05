import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
export interface ListSearchResults {
  oracleIds: string[];
  scores?: Record<string, number>;
  mode: 'smart' | 'keyword';
}
export interface DeckFolder {
  id: string;
  parentId?: string | null;
  folderCount?: number;
  name: string;
  count: number;
  deckCount: number;
  collectionCount: number;
}
export interface CardTag {
  id: string;
  name: string;
}
export interface CardLabels {
  tags: string[];
}

export function useLibraryApi() {
  const config = useRuntimeConfig();
  const access = useSearchAccess();
  async function request<T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T> {
    const headers = new Headers(await access.headers());
    if (body === undefined) headers.delete('Content-Type');
    const response = await fetch(
      `${config.public.backendPath}/library${path}`,
      {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || 'Could not load or save your library.');
    return data;
  }
  return {
    ...access,
    request,
    isPro: computed(
      () =>
        access.access.value?.enabled === true &&
        access.access.value?.authenticated === true &&
        access.access.value?.tier === 'enhanced',
    ),
  };
}
export function useDeckFolders() {
  const api = useLibraryApi();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: computed(() => ['deck-folders', api.userId.value]),
    enabled: computed(() => api.ready.value && !!api.userId.value),
    queryFn: () => api.request<{ folders: DeckFolder[] }>('/folders'),
    staleTime: 30_000,
  });
  async function change(path: string, method: string, body?: unknown) {
    await api.request(path, method, body);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['deck-folders'] }),
      client.invalidateQueries({ queryKey: ['user-lists'] }),
    ]);
  }
  return {
    folders: computed(() => query.data.value?.folders ?? []),
    error: query.error,
    pending: query.isLoading,
    refresh: query.refetch,
    change,
  };
}
export function useCardTags() {
  const api = useLibraryApi();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: computed(() => ['card-tags', api.userId.value]),
    enabled: computed(() => api.ready.value && !!api.userId.value),
    queryFn: () => api.request<{ tags: CardTag[] }>('/tags'),
    staleTime: 60_000,
  });
  async function change<T = unknown>(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    const result = await api.request<T>(path, method, body);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['card-tags'] }),
      client.invalidateQueries({ queryKey: ['card-tag-assignments'] }),
    ]);
    return result;
  }
  return {
    tags: computed(() => query.data.value?.tags ?? []),
    error: query.error,
    pending: query.isLoading,
    change,
    userId: api.userId,
  };
}
export function useCardLabels(ids: MaybeRefOrGetter<string[]>) {
  const api = useLibraryApi();
  const { tags } = useCardTags();
  const oracleIds = computed(() => [...new Set(toValue(ids))].sort());
  async function batches<T>(
    fn: (batch: string[]) => Promise<T[]>,
  ): Promise<T[]> {
    const results: T[] = [];
    const snapshot = oracleIds.value;
    for (let i = 0; i < snapshot.length; i += 200)
      results.push(...(await fn(snapshot.slice(i, i + 200))));
    return results;
  }
  const assignments = useQuery({
    queryKey: computed(() => [
      'card-tag-assignments',
      api.userId.value,
      oracleIds.value,
    ]),
    enabled: computed(
      () => api.ready.value && !!api.userId.value && !!oracleIds.value.length,
    ),
    queryFn: () =>
      batches(
        async (batch) =>
          (
            await api.request<{
              assignments: { oracle_id: string; tag_id: string }[];
            }>('/tags/assignments', 'POST', { oracleIds: batch })
          ).assignments,
      ),
    staleTime: 60_000,
  });
  const labels = computed<Record<string, CardLabels>>(() => {
    const result: Record<string, CardLabels> = {};
    for (const id of oracleIds.value)
      result[id] = {
        tags: [],
      };
    const names = new Map(tags.value.map((tag) => [tag.id, tag.name]));
    for (const assignment of assignments.data.value ?? []) {
      const name = names.get(assignment.tag_id);
      if (name && result[assignment.oracle_id])
        result[assignment.oracle_id].tags.push(name);
    }
    return result;
  });
  return {
    labels,
    assignments: assignments.data,
    error: assignments.error,
    retry: assignments.refetch,
  };
}
