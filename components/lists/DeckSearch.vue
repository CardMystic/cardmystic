<script setup lang="ts">
import type { ListSearchResults } from '~/composables/useLibrary';
const props = defineProps<{
  listId: string;
  collection?: boolean;
  revision: string;
}>();
const emit = defineEmits<{ results: [result: ListSearchResults | null] }>();
const { isPro, request, userId } = useLibraryApi();
const opened = defineModel<boolean>('open', { default: false });
const query = ref(''),
  mode = ref<'smart' | 'keyword'>('smart');
const busy = ref(false),
  error = ref(''),
  searchedRevision = ref<string | null>(null);
const count = ref<number | null>(null);
let sequence = 0;
function clear() {
  sequence++;
  emit('results', null);
  count.value = null;
  searchedRevision.value = null;
  error.value = '';
  busy.value = false;
}
watch(opened, (value) => {
  if (!value) clear();
});
watch([isPro, userId], () => {
  opened.value = false;
  clear();
});
watch(() => props.listId, clear);
async function search() {
  if (!query.value.trim() || busy.value) return;
  if (!isPro.value) {
    await navigateTo('/memberships');
    return;
  }
  const current = ++sequence;
  const revision = props.revision;
  const submittedMode = mode.value;
  busy.value = true;
  error.value = '';
  try {
    const result = await request<ListSearchResults>(
      `/lists/${props.listId}/search`,
      'POST',
      { query: query.value, mode: submittedMode },
    );
    if (current !== sequence) return;
    emit('results', { ...result, mode: submittedMode });
    count.value = result.oracleIds.length;
    searchedRevision.value = revision;
  } catch (cause) {
    if (current === sequence) error.value = (cause as Error).message;
  } finally {
    if (current === sequence) busy.value = false;
  }
}
</script>
<template>
  <form
    v-if="opened"
    class="my-3 rounded-lg border border-default bg-default/80 p-3 space-y-3"
    @submit.prevent="search"
  >
    <div class="flex items-center justify-between gap-2">
      <h2 class="font-medium">
        Search within {{ collection ? 'collection' : 'deck' }}
      </h2>
      <UButton
        icon="i-lucide-x"
        aria-label="Close deck search"
        color="neutral"
        variant="ghost"
        @click="opened = false"
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <UInput
        v-model="query"
        :placeholder="
          mode === 'smart'
            ? 'e.g. cards that remove creatures'
            : 'Card name, type, or rules text'
        "
        aria-label="Search within list"
        class="flex-1 min-w-40"
      />
      <USelect
        v-model="mode"
        :items="[
          { label: 'Smart search', value: 'smart' },
          { label: 'Keyword search', value: 'keyword' },
        ]"
        aria-label="Search within list type"
        class="w-40"
      />
      <UButton
        type="submit"
        label="Search"
        :loading="busy"
        :disabled="!query.trim()"
      />
      <UButton
        label="Show all cards"
        color="neutral"
        variant="ghost"
        @click="clear"
      />
    </div>
    <p class="text-xs text-muted">
      Only searches cards in this {{ collection ? 'collection' : 'deck' }}.
      Shows up to 100 matches.
    </p>
    <p v-if="count !== null" role="status" class="text-sm">
      {{ count }} matching cards. Your saved list hasn't changed.
    </p>
    <p
      v-if="searchedRevision && searchedRevision !== revision"
      class="text-sm text-warning"
    >
      Your list has changed. Search again to update these matches.
    </p>
    <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
  </form>
</template>
