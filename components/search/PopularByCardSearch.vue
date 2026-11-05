<script setup lang="ts">
import { CardSearchFiltersSchema } from '~/models/frontend-specific/filtersModel';
import { getPlatformFilters, isValidPlatform } from '~/utils/platformConfig';
import { refDebounced } from '~/utils/refDebounced';
const route = useRoute();
const router = useRouter();
const { saveSearchQuery } = useSearchType();
const { data: names } = useCardNames();
const searchTerm = ref('');
const search = refDebounced(searchTerm, 150);
const filtersRef = useTemplateRef('filtersRef');
const state = reactive({
  card_name: '',
  query: '',
  filters: CardSearchFiltersSchema.parse({}),
});
watch(
  () => route.fullPath,
  () => {
    state.card_name = String(route.query.card_name ?? '');
    state.query = String(route.query.query ?? '');
    const platform = String(route.params.platform ?? 'all');
    try {
      state.filters = CardSearchFiltersSchema.parse({
        ...(isValidPlatform(platform) ? getPlatformFilters(platform) : {}),
        ...JSON.parse(String(route.query.filters || '{}')),
      });
    } catch {
      state.filters = CardSearchFiltersSchema.parse({});
    }
  },
  { immediate: true },
);
const options = computed(() => {
  if (search.value.length < 2) return state.card_name ? [state.card_name] : [];
  return (names.value ?? [])
    .filter((name) => name.toLowerCase().includes(search.value.toLowerCase()))
    .slice(0, 100);
});
async function submit() {
  if (!state.card_name.trim()) return;
  const query = {
    card_name: state.card_name.trim(),
    query: state.query.trim() || undefined,
    filters: JSON.stringify(state.filters),
    useRerank: String(route.query.useRerank !== 'false'),
  };
  saveSearchQuery('popular-by-card', query);
  filtersRef.value?.collapse();
  await router.push({
    path: `/popular-by-card/${route.params.platform ?? 'all'}`,
    query,
  });
}
</script>
<template>
  <form class="grow space-y-4" @submit.prevent="submit">
    <UFormField label="Card" name="card_name">
      <UInputMenu
        v-model="state.card_name"
        v-model:search-term="searchTerm"
        :items="options"
        placeholder="Choose a card…"
        icon="i-mdi-cards-outline"
        class="w-full"
        aria-label="Card to find commanders for"
      />
    </UFormField>
    <div class="flex gap-2">
      <UInput
        v-model="state.query"
        placeholder="Optional: describe the commanders you want…"
        aria-label="Commander search query"
        icon="i-lucide-search"
        class="min-w-0 flex-1"
        maxlength="1000"
      />
      <UButton
        type="submit"
        icon="i-lucide-search"
        :disabled="!state.card_name"
        aria-label="Search"
        ><span class="hidden sm:inline">Search</span></UButton
      >
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SearchFilterDrawer
        ref="filtersRef"
        v-model="state.filters"
        :can-apply="!!state.card_name"
        @apply="submit"
      />
      <SearchModeSelect />
    </div>
  </form>
</template>
