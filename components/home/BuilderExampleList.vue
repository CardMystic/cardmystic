<script setup lang="ts">
import type { DecklistSummary } from '~/models/cardListModel';
defineProps<{
  id: string;
  label: string;
  decklist?: DecklistSummary;
  loading: boolean;
}>();
</script>

<template>
  <div class="min-h-60">
    <CardListLink v-if="decklist" :list="decklist" :show-author="true" />
    <CardListLinkSkeleton v-else-if="loading" />
    <NuxtLink
      v-else
      :to="`/lists/${id}`"
      no-prefetch
      class="flex h-full min-h-60 items-center justify-center gap-2 rounded-lg border border-default p-4 text-primary underline"
    >
      {{ label
      }}<UIcon
        name="i-lucide-arrow-up-right"
        class="size-4"
        aria-hidden="true"
      />
    </NuxtLink>
  </div>
</template>
