<template>
  <div class="flex items-center gap-1 justify-start h-8">
    <UIcon name="i-lucide-arrow-up-down" class="size-4 shrink-0" />
    <span class="text-sm w-11">Sort</span>
    <USelect
      :model-value="selectedSortValue"
      @update:model-value="selectSort"
      aria-label="Search sorting"
      :items="sortOptions"
      placeholder="Select sort option"
      size="sm"
      class="cursor-pointer w-32"
    />
    <UButton
      v-if="selectedSortValue"
      class="cursor-pointer"
      :icon="
        sortDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
      "
      color="neutral"
      variant="ghost"
      size="sm"
      @click="toggleSortDirection"
      :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
    />
    <UButton
      v-if="selectedSortValue"
      class="cursor-pointer"
      icon="i-lucide-x"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="clearSort"
      title="Clear sort"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  defaultSortBy?: string;
  defaultDirection?: 'asc' | 'desc';
  hasAlsScore?: boolean;
  hasAiScore?: boolean;
  hasPopularity?: boolean;
}>();

const sortOptions = computed(() => {
  const options = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'cmc', label: 'Mana Cost' },
    { value: 'price', label: 'Price' },
    { value: 'rarity', label: 'Rarity' },
    { value: 'power', label: 'Power' },
    { value: 'toughness', label: 'Toughness' },
    { value: 'released', label: 'Release Date' },
  ];
  if (props.hasPopularity)
    options.unshift({ value: 'popularity', label: 'Popularity' });
  if (props.hasAlsScore)
    options.unshift({ value: 'deck_score', label: 'Deck Score' });
  if (props.hasAiScore)
    options.unshift({ value: 'ai_score', label: 'Smart Score' });
  return options;
});

const selectedSortValue = ref<string | undefined>(props.defaultSortBy);
const sortDirection = ref<'asc' | 'desc'>(props.defaultDirection ?? 'asc');

const emit = defineEmits<{
  (e: 'sort', sortBy: string | undefined, direction: 'asc' | 'desc'): void;
}>();

const scoreOptions = ['ai_score', 'deck_score', 'popularity'];

// Incoming choices are synchronization, not new selections. In particular,
// syncing an ascending score sort must not apply the descending default again.
watch(
  [() => props.defaultSortBy, () => props.defaultDirection],
  ([sortBy, direction]) => {
    selectedSortValue.value = sortBy;
    sortDirection.value = direction ?? 'asc';
  },
);

function selectSort(value: string) {
  selectedSortValue.value = value;
  if (scoreOptions.includes(value)) sortDirection.value = 'desc';
  emit('sort', value, sortDirection.value);
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  emit('sort', selectedSortValue.value, sortDirection.value);
}

function clearSort() {
  selectedSortValue.value = undefined;
  sortDirection.value = 'asc';
  emit('sort', undefined, 'asc');
}
</script>

<style scoped lang="sass"></style>
