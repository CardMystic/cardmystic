<script setup lang="ts">
import type { AnalysisCard } from '~/utils/deckAnalysis';
const props = defineProps<{
  entries: AnalysisCard[];
  format: string;
  name: string;
  loading?: boolean;
}>();
const playtestOpen = ref(false);
const launched = ref(false);
const hasCards = computed(() =>
  props.entries.some((entry) => !entry.commander && entry.quantity > 0),
);
</script>
<template>
  <UButton
    label="Playtest"
    icon="i-lucide-play"
    variant="ghost"
    :disabled="loading || !hasCards"
    @click="
      launched = true;
      playtestOpen = true;
    "
  />
  <LazyPlaytestBoard
    v-if="launched"
    v-model:open="playtestOpen"
    :entries="entries"
    :format="format"
    :name="name"
  />
</template>
