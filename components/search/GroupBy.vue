<template>
  <div class="flex items-center gap-1 justify-start h-8">
    <UIcon name="i-lucide-group" class="size-4 shrink-0" />
    <span class="text-sm w-11">Group</span>
    <USelect
      v-model="selectedGroupBy"
      :items="groupByOptions"
      placeholder="None"
      size="sm"
      class="cursor-pointer w-32"
    />
    <UButton
      v-if="selectedGroupBy"
      class="cursor-pointer"
      icon="i-lucide-x"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="clearGroupBy"
      title="Clear grouping"
    />
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

watch(
  selectedGroupBy,
  (val) => {
    emit('update:groupBy', val);
  },
  { immediate: true },
);
</script>
