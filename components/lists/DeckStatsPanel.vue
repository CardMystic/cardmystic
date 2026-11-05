<script setup lang="ts">
import { analyzeDeck, type AnalysisCard } from '~/utils/deckAnalysis';
const props = defineProps<{
  listId: string;
  revision: string;
  format: string;
  entries: AnalysisCard[];
  loading: boolean;
  isOwner: boolean;
}>();
const details = useTemplateRef<HTMLDetailsElement>('details');
defineExpose({
  open: () => {
    if (details.value) details.value.open = true;
  },
});
const opened = ref(false);
const stats = computed(() => analyzeDeck(props.entries));
</script>
<template>
  <details
    ref="details"
    id="deck-stats"
    class="my-4 rounded-lg border border-default p-4"
    data-testid="deck-stats"
    @toggle="opened = ($event.target as HTMLDetailsElement).open"
  >
    <summary class="cursor-pointer font-semibold">Deck Stats</summary>
    <div v-if="opened" class="mt-4 space-y-6">
      <p v-if="loading" role="status">Loading deck stats…</p>
      <template v-else-if="entries.length">
        <p>
          {{ stats.total }} cards in the library · {{ stats.lands }} lands<span
            v-if="stats.modalLands"
          >
            + {{ stats.modalLands }}
            <UTooltip
              text="Modal double-faced cards let you play either side. These have a spell on the front and a land on the back."
              :ui="{
                content: 'max-w-72 h-auto',
                text: 'whitespace-normal break-words',
              }"
              ><button type="button" class="underline decoration-dotted">
                MDFCs
              </button></UTooltip
            ></span
          >.
        </p>
        <p class="text-sm text-muted">
          {{ stats.averageOpeningLands.toFixed(2) }} lands on average in your
          opening hand. {{ Math.round(stats.atLeastTwo * 100) }}% chance of at
          least two lands in an opening hand of seven, before mulligans.
          Commanders are excluded. Double-faced land options are not counted in
          this estimate; there isn't one right land count for every deck.
        </p>
        <LazyDeckCharts :curve="stats.curve" :colors="stats.colors" />
        <LazyDeckAnalytics
          :list-id="listId"
          :revision="revision"
          :format="format"
          :is-owner="isOwner"
        />
      </template>
    </div>
  </details>
</template>
