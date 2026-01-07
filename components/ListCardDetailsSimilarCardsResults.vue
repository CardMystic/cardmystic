<template>
  <!-- Results -->
  <div class="mt-3 w-full">
    <template v-if="isLoading">
      <div style="height: 32px"></div> <!-- Sort spacer to prevent layout shift -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </template>

    <template v-else-if="searchResults && searchResults.length > 1">
      <SortComponent @sort="handleSort" class="mb-3" />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div v-for="result in displayedResults" :key="result.card_data.id">
          <CardComponent :card="result" :showCardInfo="true" :hideProgressBar="true" :hideThumbsDownButton="true" />
        </div>
      </div>
      <div v-if="hasMoreCards && !showAll" class="flex justify-center mt-6">
        <UButton @click="showAll = true" color="primary" variant="solid" size="lg" icon="i-heroicons-chevron-down">
          Show More ({{ sortedResults.length - initialDisplayCount }} more cards)
        </UButton>
      </div>
    </template>

    <template v-else>
      <UContainer>
        <div class="flex flex-col items-center">
          <UIcon name="i-lucide-search-x" class="text-5xl text-primary mb-4" />
          <div class="font-bold text-2xl mb-2">No similar cards found</div>
          <div class="subtitle2 mb-4">
            There are no similar cards available for this card at the moment.
          </div>
        </div>
      </UContainer>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { Card } from '~/models/cardModel';
import CardComponent from '~/components/Card.vue';
import CardSkeleton from '~/components/CardSkeleton.vue';
import SortComponent from '~/components/search/Sort.vue';
import { sortSearchResults } from '~/utils/sort';

const props = defineProps<{
  isLoading: boolean;
  searchResults: undefined | Card[];
  skeletonCount: number;
}>();

// Sorting state
const sortBy = ref<string | undefined>(undefined);
const sortDirection = ref<'asc' | 'desc'>('asc');

// Show more state
const showAll = ref(false);
const initialDisplayCount = 8;

// Handle sort changes
function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

// Computed sorted results - skip the first card (we're already viewing it on the page)
const sortedResults = computed(() => {
  if (!props.searchResults || props.searchResults.length === 0) {
    return [];
  }

  // Skip the first card (the current card being viewed)
  const [, ...restCards] = props.searchResults;
  return sortSearchResults(restCards, sortBy.value, sortDirection.value) || [];
});

// Display results based on showAll state
const displayedResults = computed(() => {
  if (showAll.value || sortedResults.value.length <= initialDisplayCount) {
    return sortedResults.value;
  }
  return sortedResults.value.slice(0, initialDisplayCount);
});

// Check if there are more cards to show
const hasMoreCards = computed(() => sortedResults.value.length > initialDisplayCount);

</script>

<style lang="scss" scoped>
.subtitle2 {
  font-size: 1.01rem;
  position: relative;
  top: -14px;
}
</style>
