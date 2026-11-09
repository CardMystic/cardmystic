<template>
  <div class="flex flex-col gap-2">
    <p
      class="text-xs font-mono font-semibold tracking-[0.3em] uppercase text-primary text-center lg:text-left"
    >
      Suggested Searches
    </p>
    <p
      v-if="mode === 'recommend'"
      class="text-xs text-muted text-center lg:text-left"
    >
      Try a sample decklist
    </p>
    <div class="flex flex-wrap justify-center gap-1.5">
      <UButton
        v-for="query in visibleQueries"
        :key="query.label"
        size="sm"
        color="neutral"
        variant="outline"
        class="cursor-pointer rounded-pill"
        :to="query.to"
        no-prefetch
      >
        {{ query.label }}
      </UButton>
      <UButton
        v-if="mode === 'smart' && !showAll"
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-heroicons-plus"
        class="cursor-pointer rounded-pill"
        aria-label="Show more suggested searches"
        @click="
          () => {
            showAll = true;
          }
        "
      >
        More
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { searchDemos, deckExamples } from '~/utils/search-showcase';
const props = withDefaults(
  defineProps<{ mode?: 'smart' | 'similarity' | 'recommend' }>(),
  { mode: 'smart' },
);

// Curated example queries shown under the home hero search bar.
// These queries have no equivalent curated page; keep their exact searches
// as crawlable links without prefetching results for every chip.
const baseQueries = [
  'X spell board wipes',
  'lands that make any color',
  'aristocrats draw engine',
  'token doublers',
];

const moreQueries = [
  'etb triggers',
  'instant speed enchantment removal',
  'graveyard recursion',
  'mana rocks that cost 2 or less',
];

const showAll = ref(false);
const visibleQueries = computed(() => {
  if (props.mode === 'recommend') return deckExamples;
  if (props.mode === 'similarity')
    return searchDemos.find((demo) => demo.id === 'similarity')!.examples;
  return (showAll.value ? [...baseQueries, ...moreQueries] : baseQueries).map(
    (query) => ({
      label: query,
      to:
        '/search/all/smart?' +
        new URLSearchParams({ query, useRerank: 'false' }),
    }),
  );
});
</script>
