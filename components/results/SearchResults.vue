<template>
  <!-- Results -->
  <div class="mt-3 w-full">
    <template v-if="isLoading">
      <div style="height: 32px"></div> <!-- Sort spacer to prevent layout shift -->
      <div v-if="defaultGroupBy" style="height: 26px"></div> <!-- Spacer for expand all/collapse all buttons -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </template>

    <template v-else-if="searchResults && searchResults.length">
      <div class="flex flex-wrap items-center justify-center gap-4 mb-3">
        <GroupBy :default-value="defaultGroupBy" @update:groupBy="handleGroupBy" />
        <SortComponent @sort="handleSort" />
      </div>

      <!-- Searched card pinned at top when grouped (similarity search) -->
      <div v-if="searchedCard && groupedResults && groupedResults.length > 0 && groupedResults[0].label"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
        <Card :card="searchedCard" :showCardInfo="true" :is-similarity-search="true" :is-searched="true"
          :hide-progress-bar="false" :hide-thumbs-down-button="true" :score-scale="scoreScale" />
      </div>

      <!-- Grouped results (accordion) -->
      <template v-if="groupedResults && groupedResults.length > 0 && groupedResults[0].label">
        <div class="flex justify-center sm:justify-end gap-1 mb-1">
          <UButton class="cursor-pointer" icon="i-lucide-chevrons-down" label="Expand All" size="xs" color="neutral"
            variant="ghost" @click="openAccordionValues = accordionItems.map(i => i.value as string)" />
          <UButton class="cursor-pointer" icon="i-lucide-chevrons-up" label="Collapse All" size="xs" color="neutral"
            variant="ghost" @click="openAccordionValues = []" />
        </div>
        <UAccordion type="multiple" v-model="openAccordionValues" :items="accordionItems"
          :ui="{ item: 'w-full mx-auto sm:mx-0', trigger: 'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1' }">
          <template v-for="group in groupedResults" :key="group.label" #[group.label]>
            <div :id="groupToId(group.label)" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-4">
              <div v-for="(result, index) in group.cards" :key="result.card_data.id">
                <Card :card="result" :showCardInfo="true" :is-similarity-search="isSimilaritySearch"
                  :is-searched="false" :hide-progress-bar="isKeywordSearch"
                  :hide-thumbs-down-button="hideThumbsDownButton || isKeywordSearch || isSimilaritySearch"
                  :score-scale="scoreScale" :show-add-to-deckbuilder-button="showAddToDeckbuilderButton" />
              </div>
            </div>
          </template>
        </UAccordion>
      </template>

      <!-- Flat results (no grouping) -->
      <template v-else>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div v-for="(result, index) in sortedResults" :key="result.card_data.id">
            <Card :card="result" :showCardInfo="true" :is-similarity-search="isSimilaritySearch"
              :is-searched="isSimilaritySearch && index === 0" :hide-progress-bar="isKeywordSearch"
              :hide-thumbs-down-button="hideThumbsDownButton || isKeywordSearch || isSimilaritySearch"
              :show-add-to-deckbuilder-button="showAddToDeckbuilderButton" :score-scale="scoreScale" />
          </div>
        </div>
      </template>
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
          <div v-if="errorMessage" class="subtitle2 mb-2 text-center text-red-400">
            {{ errorMessage }}
          </div>
          <div class="subtitle2 mb-4">
            Try adjusting your search terms or filters.<br>
            If you think this is a mistake, <NuxtLink :to="searchFeedbackUrl(getPageInfo())" target="_blank"
              class="important-text underline">let us know</NuxtLink>.
          </div>
        </div>
      </UContainer>
    </template>
  </div>

  <Teleport to="body">
    <JumpTo :groups="(groupedResults || []).filter(g => g.label).map(g => g.label)" />
  </Teleport>
</template>

<script lang="ts" setup>
import type { Card } from '~/models/cardModel';
import type { CardGroup } from '~/utils/sort';
import type { AccordionItem } from '@nuxt/ui';
import SortComponent from '~/components/search/Sort.vue';
import GroupBy from '~/components/search/GroupBy.vue';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { sortSearchResults, groupAndSortCards } from '~/utils/sort';

const { getPageInfo } = usePageInfo();

const props = defineProps<{
  isLoading: boolean;
  searchResults: undefined | Card[];
  queryParam: string | null;
  skeletonCount: number;
  helpText?: string;
  errorMessage?: string;
  isSimilaritySearch?: boolean;
  isKeywordSearch?: boolean;
  showAddToDeckbuilderButton?: boolean;
  hideSearchedCard?: boolean;
  hideThumbsDownButton?: boolean;
  scoreScale?: 'normalized' | 'raw';
  defaultGroupBy?: string;
}>();

// Sorting state
const sortBy = ref<string | undefined>(undefined);
const sortDirection = ref<'asc' | 'desc'>('asc');

// Grouping state
const groupBy = ref<string | undefined>(props.defaultGroupBy);

function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

function handleGroupBy(value: string | undefined) {
  groupBy.value = value;
}

// Computed sorted results for flat display (no grouping, or similarity search)
const sortedResults = computed(() => {
  if (!props.searchResults || props.searchResults.length === 0) {
    return props.searchResults;
  }

  // For similarity search, keep the first card (the searched card) separate
  if (props.isSimilaritySearch && !props.hideSearchedCard) {
    const [firstCard, ...restCards] = props.searchResults;
    const sortedRest = sortSearchResults(restCards, sortBy.value, sortDirection.value);
    return sortedRest ? [firstCard, ...sortedRest] : [firstCard];
  }

  return sortSearchResults(props.searchResults, sortBy.value, sortDirection.value);
});

// The searched card for similarity search (first result)
const searchedCard = computed(() => {
  if (!props.isSimilaritySearch || props.hideSearchedCard || !props.searchResults || props.searchResults.length === 0) {
    return undefined;
  }
  return props.searchResults[0];
});

// Computed grouped results
const groupedResults = computed<CardGroup[] | null>(() => {
  if (!groupBy.value || !props.searchResults || props.searchResults.length === 0) {
    return null;
  }

  // For similarity search, keep first card out of groups
  if (props.isSimilaritySearch && !props.hideSearchedCard) {
    const [, ...restCards] = props.searchResults;
    return groupAndSortCards(restCards, groupBy.value, sortBy.value, sortDirection.value);
  }

  return groupAndSortCards(props.searchResults, groupBy.value, sortBy.value, sortDirection.value);
});

const accordionItems = computed<AccordionItem[]>(() => {
  if (!groupedResults.value) return [];
  return groupedResults.value
    .filter(g => g.label)
    .map(g => ({
      label: g.label,
      value: g.label,
      slot: g.label as any,
    }));
});

const openAccordionValues = ref<string[]>([]);

watch(accordionItems, (items) => {
  openAccordionValues.value = items.map(i => i.value as string);
}, { immediate: true });

function groupToId(label: string): string {
  return 'group-' + label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase();
}

</script>

<style lang="scss" scoped>
.subtitle2 {
  font-size: 1.01rem;
  position: relative;
  top: -14px;
}
</style>
