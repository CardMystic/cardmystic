<template>
  <div class="flex items-center gap-2 justify-start min-h-10">
    <UIcon name="i-lucide-layout-dashboard" class="size-4 shrink-0" />
    <span class="text-sm w-11 shrink-0">View</span>
    <USelect
      v-model="selectedView"
      :items="viewOptions"
      aria-label="View"
      size="sm"
      class="cursor-pointer min-w-0 flex-1"
    />
  </div>
</template>

<script setup lang="ts">
type CardView = 'grid' | 'text';

const props = defineProps<{
  defaultValue?: CardView;
}>();

const emit = defineEmits<{
  (e: 'update:view', value: CardView): void;
}>();

const viewOptions = [
  { value: 'grid', label: 'Card Grid' },
  { value: 'text', label: 'Card Text' },
];

const selectedView = ref<CardView>(props.defaultValue ?? 'grid');

watch(
  () => props.defaultValue,
  (value) => {
    if (value && value !== selectedView.value) selectedView.value = value;
  },
);

watch(
  selectedView,
  (val) => {
    emit('update:view', val);
  },
  { immediate: true },
);
</script>
