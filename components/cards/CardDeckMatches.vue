<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
const client = useQueryClient();
const props = defineProps<{ oracleId: string }>();
const api = useLibraryApi();
const { addCardsToListMutation } = useCardLists();
const matches = ref<{ id: string; name: string }[]>([]),
  next = ref<number | null>(0),
  error = ref('');
const loading = ref(false),
  adding = ref(''),
  added = ref(new Set<string>()),
  supported = ref(true);
const shown = ref(5);
let sequence = 0;
onBeforeUnmount(() => sequence++);
async function load() {
  if (!api.isPro.value || loading.value || next.value === null) return;
  const current = sequence;
  loading.value = true;
  error.value = '';
  try {
    const oracleId = props.oracleId;
    const offset = next.value;
    const result = await client.fetchQuery({
      queryKey: ['card-deck-matches', api.userId.value, oracleId, offset],
      staleTime: 60_000,
      queryFn: () =>
        api.request<{
          results: { id: string; name: string }[];
          nextOffset: number | null;
          supported: boolean;
        }>('/cards/deck-fit', 'POST', { oracleId, offset }),
    });
    if (current === sequence) {
      const known = new Set(matches.value.map((deck) => deck.id));
      matches.value.push(
        ...result.results.filter((deck) => !known.has(deck.id)),
      );
      next.value = result.nextOffset;
      supported.value = result.supported;
    }
  } catch (cause) {
    if (current === sequence) error.value = (cause as Error).message;
  } finally {
    if (current === sequence) loading.value = false;
  }
}
watch(
  [() => props.oracleId, api.isPro, api.userId],
  () => {
    sequence++;
    matches.value = [];
    shown.value = 5;
    error.value = '';
    supported.value = true;
    next.value = 0;
    added.value = new Set();
    loading.value = false;
    void load();
  },
  { immediate: true },
);
async function add(id: string) {
  if (adding.value) return;
  adding.value = id;
  error.value = '';
  try {
    await addCardsToListMutation.mutateAsync({
      listId: id,
      oracleIds: [props.oracleId],
      board: 'Mainboard',
    });
    added.value = new Set([...added.value, id]);
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    adding.value = '';
  }
}
</script>
<template>
  <section class="border-t border-default pt-3 space-y-2">
    <h3 class="font-semibold">
      Suggested decks <span class="text-xs text-(--pro-accent)">Pro</span>
    </h3>
    <NuxtLink
      v-if="!api.isPro.value"
      to="/memberships"
      class="text-primary underline"
      >Subscribe for deck suggestions</NuxtLink
    >
    <template v-else>
      <p v-if="!supported" class="text-sm">
        This card is too new for deck-fit recommendations.
      </p>
      <div
        v-for="deck in matches.slice(0, shown)"
        :key="deck.id"
        class="flex items-center justify-between gap-2"
      >
        <NuxtLink :to="`/lists/${deck.id}`" class="text-sm truncate">{{
          deck.name
        }}</NuxtLink>
        <UButton
          :label="added.has(deck.id) ? 'Added' : 'Add'"
          :aria-label="`Add to ${deck.name}`"
          :loading="adding === deck.id"
          :disabled="!!adding || added.has(deck.id)"
          size="xs"
          @click="add(deck.id)"
        />
      </div>
      <p
        v-if="!loading && !matches.length && supported"
        class="text-sm text-muted"
      >
        No matching decks in this batch.
      </p>
      <UButton
        v-if="matches.length > shown"
        label="Show more"
        variant="outline"
        size="xs"
        @click="shown += 5"
      />
      <UButton
        v-else-if="next !== null"
        :label="loading ? 'Checking decks…' : 'Check more decks'"
        :loading="loading"
        variant="outline"
        size="xs"
        @click="load"
      />
      <p v-if="next !== null" class="text-xs text-muted">
        Checks your most recently edited decks first, 25 at a time. Decks
        already containing this card are excluded.
      </p>
      <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
    </template>
  </section>
</template>
