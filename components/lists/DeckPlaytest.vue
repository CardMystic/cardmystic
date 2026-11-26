<script setup lang="ts">
import type { AnalysisCard } from '~/utils/deckAnalysis';
const props = defineProps<{
  entries: AnalysisCard[];
  format: string;
  name: string;
  loading?: boolean;
}>();
const playtestOpen = defineModel<boolean>('open', { default: false });
const launched = ref(false);
const hasCards = computed(() =>
  props.entries.some((entry) => !entry.commander && entry.quantity > 0),
);
const disabled = computed(() => !!props.loading || !hasCards.value);
function launch() {
  if (disabled.value) return;
  launched.value = true;
  playtestOpen.value = true;
}
defineExpose({ launch, disabled });
</script>
<template>
  <UButton
    label="Playtest"
    icon="i-lucide-play"
    variant="ghost"
    :disabled="disabled"
    @click="launch"
  />
  <LazyPlaytestBoard
    v-if="launched"
    v-model:open="playtestOpen"
    :entries="entries"
    :format="format"
    :name="name"
  />
</template>
