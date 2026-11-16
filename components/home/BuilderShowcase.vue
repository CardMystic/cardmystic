<script setup lang="ts">
import { DecklistSummarySchema } from '~/models/cardListModel';
import { builder } from '~/utils/home-examples.json';
const examples = DecklistSummarySchema.array().parse(builder);
const { userId } = useUserProfile();
const mounted = ref(false);
const { decklists } = usePublicDecklistSummaries(
  computed(() => (mounted.value ? examples.map((list) => list.id) : [])),
  examples,
);
onMounted(() => {
  mounted.value = true;
});
</script>

<template>
  <section
    aria-labelledby="showcase-builder"
    class="mb-6 grid min-w-0 items-center gap-6 py-10 md:mb-8 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-16"
  >
    <div>
      <div class="flex flex-wrap items-center gap-3 md:flex-nowrap">
        <h3
          id="showcase-builder"
          class="min-w-0 text-2xl font-bold sm:text-3xl"
        >
          Deck &amp; Collection Builder
        </h3>
        <FeatureAccessBadge />
      </div>
      <p class="mt-4 text-base leading-relaxed text-toned">
        <strong>Build decks and keep track of the cards you own.</strong>
        Organize your cards, compare options, and share your lists. Build one
        deck without an account, then sign in to
        <strong>save unlimited decks and collections for free</strong>.
      </p>
      <UButton
        :to="mounted && userId ? '/lists' : '/build'"
        no-prefetch
        icon="i-lucide-layers"
        class="mt-6"
        >Build a deck</UButton
      >
    </div>
    <nav
      v-if="decklists.length"
      aria-label="Example deck and collection"
      class="grid gap-4 sm:grid-cols-2"
    >
      <CardListLink
        v-for="list in decklists"
        :key="list.id"
        :list="list"
        show-author
      />
    </nav>
  </section>
</template>
