<template>
  <UTooltip
    text="Reranking adds a second relevance check to reorder results. It can improve matches but takes longer and may not help every search. Turn it off for faster results in the original search order. Turning it on clears your selected sort so you can see the reranked order."
    :ui="{ content: 'h-auto max-w-xs', text: 'whitespace-normal' }"
  >
    <UButton
      type="button"
      icon="i-lucide-list-filter"
      :color="enabled ? 'primary' : 'neutral'"
      :variant="enabled ? 'soft' : 'outline'"
      size="sm"
      class="cursor-pointer shrink-0"
      aria-label="Reranking"
      :aria-pressed="enabled"
      @click="toggle"
    >
      Reranking: {{ enabled ? 'On' : 'Off' }}
    </UButton>
  </UTooltip>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const enabled = computed(() => route.query.useRerank !== 'false');

function toggle() {
  return router.push({
    path: route.path,
    query: { ...route.query, useRerank: String(!enabled.value) },
    hash: route.hash,
  });
}
</script>
