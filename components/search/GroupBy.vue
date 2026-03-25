<template>
  <div class="flex items-center gap-1 justify-center h-8">
    <UIcon name="i-lucide-group" />
    <span class="text-sm">Group by:</span>
    <USelect v-model="selectedGroupBy" :items="groupByOptions" placeholder="None" class="cursor-pointer min-w-37.5" />
    <UButton v-if="selectedGroupBy" class="cursor-pointer" icon="i-lucide-x" color="neutral" variant="ghost" size="sm"
      @click="clearGroupBy" title="Clear grouping" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  defaultValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:groupBy', value: string | undefined): void;
}>();

const groupByOptions = [
  { value: 'type', label: 'Card Type' },
  { value: 'color', label: 'Color' },
  { value: 'colorIdentity', label: 'Color Identity' },
  { value: 'cmc', label: 'Mana Value' },
];

const selectedGroupBy = ref<string | undefined>(props.defaultValue);

function clearGroupBy() {
  selectedGroupBy.value = undefined;
}

watch(selectedGroupBy, (val) => {
  emit('update:groupBy', val);
}, { immediate: true });
</script>
