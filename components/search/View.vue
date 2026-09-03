<template>
  <div class="flex items-center gap-1 justify-start h-8">
    <UIcon name="i-lucide-layout-dashboard" class="size-4 shrink-0" />
    <span class="text-sm w-11">View</span>
    <USelect
      v-model="selectedView"
      :items="viewOptions"
      size="sm"
      class="cursor-pointer w-32"
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
