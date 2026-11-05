<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
const props = defineProps<{ listId: string; collection?: boolean }>();
const api = useLibraryApi();
const client = useQueryClient();
type Version = {
  id: number;
  createdAt: string;
  action: string;
  kind: string;
  name: string;
  count: number;
  added: number;
  removed: number;
  comparisonAvailable: boolean;
  changes: { oracleId: string; name: string; board: string; delta: number }[];
  details: string[];
};
const route = useRoute(),
  router = useRouter();
const page = computed({
  get: () => Math.max(1, Math.min(100, Number(route.query.page) || 1)),
  set: (value: number) => {
    void router.replace({
      query: { ...route.query, page: value === 1 ? undefined : value },
    });
  },
});
const filters = [
  { label: 'All edits', value: 'all' },
  { label: 'Additions', value: 'add' },
  { label: 'Removals', value: 'remove' },
  { label: 'Restores', value: 'restore' },
  { label: 'Bulk updates', value: 'bulk' },
  { label: 'Other edits', value: 'edit' },
];
const filter = computed({
  get: () =>
    filters.find((item) => item.value === route.query.filter)?.value ?? 'all',
  set: (value: string) => {
    void router.replace({
      query: {
        ...route.query,
        filter: value === 'all' ? undefined : value,
        page: undefined,
      },
    });
  },
});
const loading = ref(false),
  busy = ref(false),
  error = ref(''),
  message = ref('');
const versions = ref<Version[]>([]),
  selected = ref<Version | null>(null);
const head = ref<number | null>(null),
  total = ref(0);
const confirmOpen = computed({
  get: () => !!selected.value,
  set: (value: boolean) => {
    if (!value) selected.value = null;
  },
});
let sequence = 0;
async function load() {
  const current = ++sequence;
  loading.value = true;
  error.value = '';
  selected.value = null;
  try {
    const result = await api.request<{
      revisions: Version[];
      head: number | null;
      totalCount: number;
      page: number;
    }>(
      `/lists/${props.listId}/history?page=${page.value}&pageSize=20&filter=${filter.value}`,
    );
    if (current !== sequence) return;
    versions.value = result.revisions;
    head.value = result.head;
    total.value = result.totalCount;
    if (page.value !== result.page) page.value = result.page;
  } catch (cause) {
    if (current === sequence) error.value = (cause as Error).message;
  } finally {
    if (current === sequence) loading.value = false;
  }
}
watch(
  [() => props.listId, page, filter, api.userId],
  () => {
    void load();
  },
  { immediate: true },
);
onBeforeUnmount(() => sequence++);
async function restore() {
  if (!selected.value || head.value === null || busy.value) return;
  busy.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.request(`/lists/${props.listId}/history/restore`, 'POST', {
      revision: selected.value.id,
      expectedHead: head.value,
    });
    await Promise.all([
      ...['list-items', 'list-cards'].map((key) =>
        client.invalidateQueries({ queryKey: [key, props.listId] }),
      ),
      client.invalidateQueries({ queryKey: ['user-lists'] }),
      client.invalidateQueries({ queryKey: ['card-deck-matches'] }),
      client.invalidateQueries({
        queryKey: ['discovery', 'public-decklist', props.listId],
      }),
    ]);
    selected.value = null;
    message.value = `${props.collection ? 'Collection' : 'Deck'} restored. Your previous version is still in history.`;
    await load();
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section
    class="space-y-5"
    :aria-label="collection ? 'Collection history' : 'Deck history'"
  >
    <p class="text-sm text-muted">
      The latest 100 versions. Restoring creates another version so you can undo
      it.
    </p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UPagination
        v-if="total > 20"
        v-model:page="page"
        :total="total"
        :items-per-page="20"
        :sibling-count="1"
        :ui="{ first: 'hidden', last: 'hidden' }"
        aria-label="History pages top"
      />
      <div class="flex flex-wrap gap-2 ml-auto">
        <USelect
          v-model="filter"
          :items="filters"
          aria-label="Filter history"
          class="w-44"
          :disabled="busy"
        />
        <UButton
          label="Refresh history"
          icon="i-lucide-refresh-cw"
          variant="ghost"
          :disabled="busy"
          :loading="loading"
          @click="load"
        />
      </div>
    </div>
    <p v-if="error" role="alert" class="text-error">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="n in 4" :key="n" class="h-28 w-full" />
    </div>
    <p v-else-if="!versions.length && !error" class="py-8 text-muted">
      No edits match this filter. History starts with your first recorded edit.
    </p>
    <div v-else class="space-y-3">
      <article
        v-for="version in versions"
        :key="version.id"
        class="rounded-lg border border-default bg-default/85 p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              class="font-semibold"
              :class="{
                'text-success': version.kind === 'add',
                'text-error': version.kind === 'remove',
                'text-info': version.kind === 'restore',
              }"
            >
              {{ version.action }}
              <span v-if="version.id === head" class="text-muted font-normal"
                >· Current</span
              >
            </h2>
            <p class="text-sm text-muted">
              {{ new Date(version.createdAt).toLocaleString() }} ·
              {{ version.count }} cards
            </p>
            <div class="flex flex-wrap gap-3 mt-2 text-sm font-medium">
              <span v-if="version.added" class="text-success"
                >+{{ version.added }} added</span
              >
              <span v-if="version.removed" class="text-error"
                >−{{ version.removed }} removed</span
              >
            </div>
          </div>
          <UButton
            v-if="version.id !== head"
            label="Restore"
            variant="outline"
            :disabled="busy"
            @click="selected = version"
          />
        </div>
        <ul v-if="version.details?.length" class="text-sm mt-2">
          <li v-for="detail in version.details" :key="detail">{{ detail }}</li>
        </ul>
        <details
          v-if="version.changes?.length"
          :open="version.changes.length <= 6"
          class="mt-3 text-sm"
        >
          <summary class="cursor-pointer py-1">
            {{ version.changes.length }} card changes
          </summary>
          <ul class="mt-2 grid gap-2 sm:grid-cols-2">
            <li
              v-for="change in version.changes"
              :key="`${change.oracleId}:${change.board}`"
              class="flex gap-2"
              :class="change.delta > 0 ? 'text-success' : 'text-error'"
            >
              <span class="font-semibold tabular-nums"
                >{{ change.delta > 0 ? '+' : '−'
                }}{{ Math.abs(change.delta) }}</span
              >
              <NuxtLink
                :to="`/card/${change.oracleId}`"
                class="underline underline-offset-2"
                >{{ change.name }}</NuxtLink
              >
              <span class="text-muted">{{ change.board }}</span>
            </li>
          </ul>
        </details>
        <p
          v-else-if="!version.comparisonAvailable"
          class="mt-2 text-xs text-muted"
        >
          Oldest retained version. Earlier changes are unavailable.
        </p>
      </article>
    </div>
    <UPagination
      v-if="total > 20"
      v-model:page="page"
      :total="total"
      :items-per-page="20"
      :sibling-count="1"
      :ui="{ first: 'hidden', last: 'hidden' }"
      class="justify-center"
      aria-label="History pages bottom"
    />
    <UModal
      v-model:open="confirmOpen"
      :title="collection ? 'Restore collection' : 'Restore deck'"
      :dismissible="!busy"
      :close="!busy"
    >
      <template #body
        ><p v-if="selected">
          Restore {{ selected.count }} cards from
          {{ new Date(selected.createdAt).toLocaleString() }}? This replaces
          your current {{ collection ? 'collection' : 'deck' }} contents and
          records a new version.
        </p></template
      >
      <template #footer
        ><UButton
          label="Cancel"
          variant="outline"
          :disabled="busy"
          @click="selected = null" /><UButton
          label="Confirm restore"
          :loading="busy"
          @click="restore"
      /></template>
    </UModal>
  </section>
</template>
