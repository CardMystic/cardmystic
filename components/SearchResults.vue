<template>
  <!-- Results -->
  <div class="mt-3 w-full">
    <template v-if="isLoading">
      <div style="height: 32px"></div> <!-- Sort spacer to prevent layout shift -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </template>

    <template v-else-if="searchResults && searchResults.length">
      <SortComponent @sort="handleSort" class="mb-3" />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div v-for="(result, index) in sortedResults" :key="result.card_data.id">
          <CardComponent :card="result" :showCardInfo="true" :is-similarity-search="isSimilaritySearch"
            :is-searched="isSimilaritySearch && index === 0" :hide-progress-bar="isKeywordSearch"
            :hide-thumbs-down-button="isKeywordSearch || isSimilaritySearch" />
        </div>
      </div>
    </template>

    <template v-else-if="!queryParam">
      <div>
        <UAlert color="info" icon="i-lucide-info" title="Enter a search query"
          :description="props.helpText || 'Please enter a search above.'" class="mb-4" />
      </div>
    </template>

    <template v-else>
      <UContainer>
        <div class="flex flex-col items-center">
          <UIcon name="i-lucide-search-x" class="text-5xl text-primary mb-4" />
          <div class="font-bold text-2xl mb-2">No results found</div>
          <div class="subtitle2 mb-4">
            Try adjusting your search terms or filters.<br>
            If you think this is a mistake, <NuxtLink :to="searchFeedbackUrl(getPageInfo())" target="_blank"
              class="important-text underline">let us know</NuxtLink>.
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
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { sortSearchResults } from '~/utils/sort';

const { getPageInfo } = usePageInfo();

const props = defineProps<{
  isLoading: boolean;
  searchResults: undefined | Card[];
  queryParam: string | null;
  skeletonCount: number;
  helpText?: string;
  isSimilaritySearch?: boolean;
  isKeywordSearch?: boolean;
}>();

// Sorting state
const sortBy = ref<string | undefined>(undefined);
const sortDirection = ref<'asc' | 'desc'>('asc');

// Handle sort changes
function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

// Computed sorted results - optionally keep first result (searched card) at the top for similarity search
const sortedResults = computed(() => {
  if (!props.searchResults || props.searchResults.length === 0) {
    return props.searchResults;
  }

  // For similarity search, keep the first card (the searched card) separate
  if (props.isSimilaritySearch) {
    const [firstCard, ...restCards] = props.searchResults;
    const sortedRest = sortSearchResults(restCards, sortBy.value, sortDirection.value);
    return sortedRest ? [firstCard, ...sortedRest] : [firstCard];
  }

  // For other searches, sort all results
  return sortSearchResults(props.searchResults, sortBy.value, sortDirection.value);
});

</script>

<style lang="scss" scoped>
.subtitle2 {
  font-size: 1.01rem;
  position: relative;
  top: -14px;
}
</style>
