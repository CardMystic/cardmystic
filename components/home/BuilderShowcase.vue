<script setup lang="ts">
import { builderExamples } from '~/utils/search-showcase';
import { useElementVisibility } from '@vueuse/core';
const { userId } = useUserProfile();
const examples = useTemplateRef<HTMLElement>('examples');
const visible = useElementVisibility(examples);
const requestedIds = ref<string[]>([]);
watch(visible, (value) => {
  if (value && !requestedIds.value.length)
    requestedIds.value = builderExamples.map((example) => example.id);
});
const { decklists, isLoading } = usePublicDecklistSummaries(requestedIds);
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
        Organize your cards, compare options, and share your lists. Build up to
        three decks without an account, then sign in to
        <strong>save unlimited decks and collections for free</strong>.
      </p>
      <UButton
        :to="userId ? '/lists' : '/build'"
        no-prefetch
        icon="i-lucide-layers"
        class="mt-6"
        >Build a deck</UButton
      >
    </div>
    <nav
      ref="examples"
      aria-label="Example deck and collection"
      class="grid gap-4 sm:grid-cols-2"
    >
      <BuilderExampleList
        v-for="example in builderExamples"
        :key="example.id"
        :id="example.id"
        :label="example.label"
        :decklist="decklists.find((list) => list.id === example.id)"
        :loading="!requestedIds.length || isLoading"
      />
    </nav>
  </section>
  <ProShowcase />
</template>
