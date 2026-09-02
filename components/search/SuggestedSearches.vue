<template>
  <div class="flex flex-col gap-2">
    <p
      class="text-xs font-mono font-semibold tracking-[0.3em] uppercase text-primary text-center lg:text-left"
    >
      Suggested Searches
    </p>
    <div class="flex flex-wrap justify-center lg:justify-start gap-1.5">
      <UButton
        v-for="query in visibleQueries"
        :key="query"
        size="sm"
        color="neutral"
        variant="outline"
        class="cursor-pointer rounded-pill"
        @click="runSearch(query)"
      >
        {{ query }}
      </UButton>
      <UButton
        v-if="!showAll"
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
// Curated example queries shown under the home hero search bar.
// Clicking one immediately runs a Smart Search. Search routes are
// nested (/search/[platform]/[type]/[[slug]]) and have no stable
// route name, so we navigate by path.
const baseQueries = [
  'creatures that draw cards',
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
const visibleQueries = computed(() =>
  showAll.value ? [...baseQueries, ...moreQueries] : baseQueries,
);

const router = useRouter();
function runSearch(query: string) {
  router.push({ path: '/search/all/smart', query: { query } });
}
</script>
