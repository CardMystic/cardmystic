<script setup lang="ts">
defineOptions({ name: 'DeckHistoryPage' });
definePageMeta({ middleware: 'auth' });
const route = useRoute();
const id = computed(() => String(route.params.id));
const { decklist, isLoading, error } = useOwnedDecklist(id);
useSeoMeta({
  title: () => `History · ${decklist.value?.name || 'Deck'} | CardMystic`,
  robots: 'noindex, nofollow',
});
</script>
<template>
  <div class="mx-auto w-full max-w-6xl pb-10">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">
        History
        <span v-if="decklist?.name" class="font-normal text-muted"
          >· {{ decklist.name }}</span
        >
      </h1>
      <UButton
        :to="`/lists/${id}`"
        :label="
          decklist?.kind === 'collection'
            ? 'Back to collection'
            : 'Back to deck'
        "
        icon="i-lucide-arrow-left"
        variant="ghost"
      />
    </div>
    <USkeleton v-if="isLoading" class="h-64" />
    <p v-else-if="error" role="alert" class="text-error">
      Could not load this list. Please retry.
    </p>
    <DeckHistory
      v-else-if="decklist"
      :collection="decklist.kind === 'collection'"
      :list-id="id"
    />
    <p v-else>History is available for your own decks and collections.</p>
  </div>
</template>
