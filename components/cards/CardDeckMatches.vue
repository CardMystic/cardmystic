<script setup lang="ts">
import { suggestDecksAction } from '~/utils/card-actions';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/vue-query';
const client = useQueryClient();
const props = defineProps<{ oracleId: string; autoSuggest?: boolean }>();
const api = useLibraryApi();
const { addCardsToListMutation } = useCardLists();

type DeckMatch = {
  id: string;
  name: string;
  alreadyInDeck?: boolean;
  added?: boolean;
};
type DeckMatchPage = {
  results: DeckMatch[];
  nextOffset: number | null;
  supported: boolean;
};
const key = computed(
  () => ['card-deck-matches', 'jev', api.userId.value, props.oracleId] as const,
);
const query = useInfiniteQuery({
  queryKey: key,
  // Suggestions are requested explicitly, but completed pages survive the modal.
  enabled: false,
  initialPageParam: 0,
  queryFn: ({ pageParam, queryKey }) =>
    api.request<DeckMatchPage>('/cards/deck-fit', 'POST', {
      oracleId: queryKey[3],
      offset: pageParam,
    }),
  getNextPageParam: (page) => page.nextOffset ?? undefined,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: false,
});
const activated = ref(false),
  adding = ref(''),
  addError = ref('');
const shown = ref(5);
const loading = query.isFetching;
const requested = computed(
  () =>
    api.isPro.value && (activated.value || !!query.data.value || loading.value),
);
const matches = computed(() => {
  if (!api.isPro.value) return [];
  const unique = new Map<string, DeckMatch>();
  for (const page of query.data.value?.pages ?? []) {
    for (const deck of page.results)
      if (!unique.has(deck.id)) unique.set(deck.id, deck);
  }
  return [...unique.values()];
});
const next = computed(
  () =>
    query.data.value?.pages.at(-1)?.nextOffset ?? (query.data.value ? null : 0),
);
const error = computed(
  () => addError.value || query.error.value?.message || '',
);
async function suggest() {
  if (!api.isPro.value) return navigateTo('/memberships');
  activated.value = true;
  if (!query.data.value) await query.refetch();
}
async function load() {
  if (!api.isPro.value || loading.value || next.value === null) return;
  if (query.data.value) await query.fetchNextPage();
  else await query.refetch();
}
let sequence = 0;
onBeforeUnmount(() => sequence++);
watch(
  [key, api.isPro, () => props.autoSuggest],
  () => {
    sequence++;
    activated.value = false;
    shown.value = 5;
    adding.value = '';
    addError.value = '';
    const cached = client.getQueryState(key.value);
    if (
      api.isPro.value &&
      cached?.data &&
      (cached.isInvalidated ||
        Date.now() - cached.dataUpdatedAt > 5 * 60 * 1000)
    ) {
      void query.refetch();
    } else if (props.autoSuggest) void suggest();
  },
  { immediate: true },
);
async function add(id: string) {
  const deck = matches.value.find((match) => match.id === id);
  if (adding.value || deck?.added || deck?.alreadyInDeck) return;
  adding.value = id;
  addError.value = '';
  const current = sequence;
  const cacheKey = key.value;
  try {
    await addCardsToListMutation.mutateAsync({
      listId: id,
      oracleIds: [props.oracleId],
      board: 'Mainboard',
    });
    // Retain the successful add even if the modal closed while saving.
    client.setQueryData<InfiniteData<DeckMatchPage>>(
      cacheKey,
      (cached) =>
        cached && {
          ...cached,
          pages: cached.pages.map((page) => ({
            ...page,
            results: page.results.map((match) =>
              match.id === id ? { ...match, added: true } : match,
            ),
          })),
        },
    );
  } catch (cause) {
    if (current === sequence) addError.value = (cause as Error).message;
  } finally {
    if (current === sequence) adding.value = '';
  }
}
</script>
<template>
  <section class="space-y-2">
    <UButton
      v-if="!requested"
      v-bind="suggestDecksAction"
      variant="ghost"
      class="min-h-11 w-full justify-start"
      @click="suggest"
    />
    <template v-else>
      <h3 class="font-semibold">
        Suggested decks <span class="text-xs text-(--pro-accent)">Pro</span>
      </h3>
      <div
        v-for="deck in matches.slice(0, shown)"
        :key="deck.id"
        class="flex items-center justify-between gap-2"
      >
        <NuxtLink :to="`/lists/${deck.id}`" class="text-sm truncate">{{
          deck.name
        }}</NuxtLink>
        <UBadge
          v-if="deck.alreadyInDeck"
          label="Already in deck"
          color="neutral"
          variant="soft"
          class="shrink-0"
        />
        <UButton
          v-else
          :label="deck.added ? 'Added' : 'Add'"
          :aria-label="`Add to ${deck.name}`"
          :loading="adding === deck.id"
          :disabled="!!adding || !!deck.added"
          size="xs"
          @click="add(deck.id)"
        />
      </div>
      <p
        v-if="!loading && !matches.length && !error"
        class="text-sm text-muted"
      >
        No matching decks in this batch.
      </p>
      <UButton
        v-if="matches.length > shown"
        label="Show more"
        variant="ghost"
        size="xs"
        @click="shown += 5"
      />
      <UButton
        v-else-if="next !== null"
        :label="loading ? 'Checking decks…' : 'Check more decks'"
        :loading="loading"
        variant="ghost"
        size="xs"
        @click="load"
      />
      <p v-if="next !== null" class="text-xs text-muted">
        Checks your most recently edited decks first, 25 at a time.
      </p>
      <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
    </template>
  </section>
</template>
