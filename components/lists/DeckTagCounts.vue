<script setup lang="ts">
import type { CardLabels } from '~/composables/useLibrary';

const props = defineProps<{
  items: { board: string; oracle_id: string; num_copies: number }[];
  labels: Record<string, CardLabels>;
  loading: boolean;
  error: boolean;
}>();
defineEmits<{ retry: [] }>();

const expanded = ref(false);
const rankedTags = computed(() => {
  const counts = new Map<string, number>();
  for (const item of props.items) {
    if (item.board !== 'Mainboard') continue;
    for (const name of props.labels[item.oracle_id]?.tags ?? []) {
      counts.set(name, (counts.get(name) ?? 0) + item.num_copies);
    }
  }
  return [...counts].sort(
    ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b),
  );
});
const visibleTags = computed(() =>
  expanded.value ? rankedTags.value : rankedTags.value.slice(0, 4),
);
</script>

<template>
  <section aria-labelledby="deck-top-tags-title" class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h3 id="deck-top-tags-title" class="text-lg font-semibold">Top Tags</h3>
      <UButton
        v-if="!loading && !error && rankedTags.length > 4"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-controls="deck-tag-counts"
        :aria-expanded="expanded"
        :label="expanded ? 'Show less' : 'Show all'"
        @click="expanded = !expanded"
      />
    </div>
    <div
      v-if="loading"
      aria-label="Loading tag counts"
      aria-busy="true"
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <div v-for="n in 4" :key="n" class="rounded-lg border border-default p-3">
        <USkeleton class="my-1 h-3 w-2/3" /><USkeleton class="my-1 h-6 w-8" />
      </div>
    </div>
    <div v-else-if="error" class="text-sm text-muted">
      Could not load your card tags.
      <UButton label="Retry" variant="link" @click="$emit('retry')" />
    </div>
    <dl
      v-else-if="visibleTags.length"
      id="deck-tag-counts"
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <div
        v-for="[name, count] in visibleTags"
        :key="name"
        class="min-w-0 rounded-lg border border-default p-3"
      >
        <dt class="text-sm text-info wrap-anywhere">{{ name }}</dt>
        <dd class="text-2xl font-semibold tabular-nums">{{ count }}</dd>
      </div>
    </dl>
    <p v-else class="text-sm text-muted">No tagged cards in this deck.</p>
  </section>
</template>
