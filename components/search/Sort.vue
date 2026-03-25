<template>
  <div class="flex items-center gap-1 justify-center h-8">
    <UIcon name="i-lucide-arrow-up-down" />
    <span class="text-sm">Sort by:</span>
    <USelect v-model="selectedSortValue" :items="sortOptions" placeholder="Select sort option"
      class="cursor-pointer min-w-45" />
    <UButton v-if="selectedSortValue" class="cursor-pointer"
      :icon="sortDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" color="neutral" variant="ghost"
      size="sm" @click="toggleSortDirection" :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'" />
    <UButton v-if="selectedSortValue" class="cursor-pointer" icon="i-lucide-x" color="neutral" variant="ghost" size="sm"
      @click="clearSort" title="Clear sort" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

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
  if (props.hasPopularity) options.unshift({ value: 'popularity', label: 'Popularity' });
  if (props.hasAlsScore) options.unshift({ value: 'deck_score', label: 'Deck Score' });
  if (props.hasAiScore) options.unshift({ value: 'ai_score', label: 'AI Score' });
  return options;
});

const selectedSortValue = ref<string | undefined>(props.defaultSortBy);
const sortDirection = ref<'asc' | 'desc'>(props.defaultDirection ?? 'asc');

onMounted(() => {
  if (props.defaultSortBy) {
    emit('sort', props.defaultSortBy, sortDirection.value);
  }
});

const emit = defineEmits<{
  (e: 'sort', sortBy: string | undefined, direction: 'asc' | 'desc'): void;
}>();

const scoreOptions = ['ai_score', 'deck_score', 'popularity'];

function updateSort(defaultDesc = false) {
  if (selectedSortValue.value) {
    if (defaultDesc && scoreOptions.includes(selectedSortValue.value)) {
      sortDirection.value = 'desc';
    }
    emit('sort', selectedSortValue.value, sortDirection.value);
  }
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

// Watch for changes to selectedSortValue
watch(selectedSortValue, () => {
  updateSort(true);
});
</script>

<style scoped lang="sass">
</style>
