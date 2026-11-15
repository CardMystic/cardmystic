<script setup lang="ts">
import { analyzeDeck } from '~/utils/deckAnalysis';
import { usePublicDecklist } from '~/composables/useDiscovery';
import {
  isPrimerDeckBlock,
  type PrimerDeckBlock,
} from '~/utils/primerDeckEmbeds';

const props = defineProps<{
  listId: string;
  owner: boolean;
  container: HTMLElement | null;
  html: string;
}>();
const targets = shallowRef<
  { element: HTMLElement; type: PrimerDeckBlock; key: number }[]
>([]);
let nextKey = 0;
// Collect after v-html updates so Teleport never writes into a stale paragraph.
watch(
  [() => props.container, () => props.html],
  () => {
    targets.value = [
      ...(props.container?.querySelectorAll<HTMLElement>(
        '[data-primer-deck]',
      ) ?? []),
    ].flatMap((element) => {
      const type = element.dataset.primerDeck ?? '';
      return isPrimerDeckBlock(type) ? [{ element, type, key: nextKey++ }] : [];
    });
  },
  { immediate: true, flush: 'post' },
);

// Reuse the deck editor's cached, permission-checked rows and card data.
// This component is mounted only when a primer contains a deck block.
const { useListItems, useListCards } = useCardLists();
const itemsQuery = useListItems(
  computed(() => (props.owner ? props.listId : '')),
);
const publicDeck = usePublicDecklist(
  computed(() => (props.owner ? null : props.listId)),
);
const items = computed(() =>
  props.owner ? (itemsQuery.data.value ?? []) : publicDeck.items.value,
);
const oracleIds = computed(() => items.value.map((item) => item.oracle_id));
const cardsQuery = useListCards(props.listId, oracleIds);
const entries = computed(() => {
  const cards = new Map(
    (cardsQuery.data.value ?? []).map((card) => [
      card.card_data.oracle_id,
      card.card_data,
    ]),
  );
  return items.value.flatMap((item) => {
    const card = cards.get(item.oracle_id);
    return card && item.board === 'Mainboard'
      ? [
          {
            card,
            quantity: item.num_copies ?? 1,
            commander: !!item.is_commander,
          },
        ]
      : [];
  });
});
const loading = computed(
  () =>
    (props.owner ? itemsQuery.isLoading.value : publicDeck.isLoading.value) ||
    cardsQuery.isFetching.value,
);
const failed = computed(
  () =>
    (props.owner
      ? itemsQuery.isError.value
      : !!publicDeck.error.value || !publicDeck.decklist.value) ||
    cardsQuery.isError.value,
);
const stats = computed(() => analyzeDeck(entries.value));
async function retry() {
  if (props.owner) await itemsQuery.refetch();
  else await publicDeck.refetch();
  if (oracleIds.value.length) await cardsQuery.refetch();
}
</script>

<template>
  <Teleport v-for="target in targets" :key="target.key" :to="target.element">
    <div
      class="my-6 mx-auto w-full max-w-3xl rounded-lg border border-default p-4 sm:p-6"
    >
      <div
        v-if="loading"
        role="status"
        class="min-h-64 flex items-center justify-center text-muted"
      >
        Loading deck stats…
      </div>
      <div v-else-if="failed" role="alert">
        <p>Could not load deck stats.</p>
        <UButton label="Retry" variant="outline" @click="retry" />
      </div>
      <p v-else-if="!entries.length" class="text-muted">
        No cards in this deck yet.
      </p>
      <template v-else>
        <p v-if="target.type === 'deck-stats'" class="mb-5">
          {{ stats.total }} cards in the library · {{ stats.lands }} lands ·
          {{ stats.total - stats.lands }} nonlands
        </p>
        <DeckCharts
          :curve="stats.curve"
          :colors="stats.colors"
          :view="
            target.type === 'mana-curve'
              ? 'curve'
              : target.type === 'color-chart'
                ? 'colors'
                : undefined
          "
        />
      </template>
    </div>
  </Teleport>
</template>
