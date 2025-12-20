<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <!-- Shared Search Form -->
      <SearchForm class="mt-6 w-full" />

      <!-- Results -->
      <div class="mt-3 w-full">
        <!-- Loading skeletons -->
        <template v-if="isLoading">
          <div style="height: 32px"></div> <!-- Sort spacer to prevent layout shift -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
          </div>
        </template>

        <!-- Results found -->
        <template v-else-if="searchResults && searchResults.length">
          <SortComponent @sort="handleSort" class="mb-3" />
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="card in sortedResults" :key="card.card_data.id">
              <CardComponent :card="card" :showCardInfo="true" :hideProgressBar="true" :hideThumbsDownButton="true" />
            </div>
          </div>
        </template>

        <!-- No query entered -->
        <template v-else-if="!queryParam">
          <div>
            <UAlert color="info" icon="i-lucide-info" title="Enter keywords to search"
              description="Try describing what the card does or listing mechanics or types." class="mb-4" />
          </div>
        </template>

        <!-- No results returned -->
        <template v-else>
          <UContainer>
            <div class="flex flex-col items-center">
              <UIcon name="i-lucide-search-x" class="text-5xl text-primary mb-4" />
              <div class="font-bold text-2xl mb-2">No cards found</div>
              <div class="subtitle2 mt-2 mb-4">
                Try adjusting your search terms or filters.<br />
                If you think this is a mistake,
                <NuxtLink :to="searchFeedbackUrl(getPageInfo())" target="_blank" class="important-text underline">
                  let us know
                </NuxtLink>.
              </div>
            </div>
          </UContainer>
        </template>
      </div>
    </div>
  </UContainer>

  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, KeywordSearchSchema } from '~/models/searchModel';

import SearchForm from '~/components/search/Search.vue';
import IssuesFab from '~/components/search/IssuesFab.vue';
import CardSkeleton from '~/components/CardSkeleton.vue';
import CardComponent from '~/components/Card.vue';
import SortComponent from '~/components/search/Sort.vue';

import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePageInfo } from '~/composables/usePageInfo';

const route = useRoute();

// Extract keyword search params
const queryParam = computed(() => String(route.query.query || ''));

useSeoMeta({
  robots: () =>
    queryParam.value
      ? 'noindex, follow'
      : 'index, follow',
  title: () => queryParam.value
    ? `${queryParam.value} - Keyword Search | CardMystic`
    : 'Keyword Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTG cards matching "${queryParam.value}" using Keyword search. Discover the perfect cards for your deck!`
    : 'Search for Magic: The Gathering cards. Discover the perfect cards for your deck.',
  ogType: 'website',

  ogTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - Keyword Search | CardMystic`
      : 'Keyword Search | CardMystic',

  ogDescription: () =>
    queryParam.value
      ? `Explore MTG cards related to "${queryParam.value}" with Keyword search on CardMystic.`
      : 'Keyword search for Magic: The Gathering on CardMystic.',

  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => 'Keyword Card Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - Keyword Search | CardMystic`
      : 'Keyword Search | CardMystic',

  twitterDescription: () =>
    queryParam.value
      ? `Explore cards related to "${queryParam.value}" with Keyword search on CardMystic.`
      : 'Keyword search for Magic: The Gathering on CardMystic.',

  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
})
// Used for the github issues logic as it can't be dynamic.
definePageMeta({
  title: 'Keyword Search',
});

const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 40);

const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return undefined;
});

const { setPageInfo, getPageInfo } = usePageInfo();

// Update analytics + feedback info
watch([queryParam, parsedFilters], ([newQuery, newFilters]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `Keyword Search: ${newQuery}`,
    query: newQuery,
    filters: newFilters,
    labels: ['keyword search'],
  });
}, { immediate: true });

// Build Keyword Search model from URL params
const keywordSearch = computed(() => {
  if (!queryParam.value) return undefined;

  return KeywordSearchSchema.parse({
    query: queryParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
  });
});

const queryEnabled = computed(() => !!keywordSearch.value?.query);

const skeletonCount = computed(() => limitParam.value || 20);

// Run the keyword search request
const { data: searchResults, isLoading } = useQuery({
  queryKey: ['search', 'keyword', keywordSearch],
  queryFn: async () => {
    const response = await fetch('/api/search/keyword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keywordSearch.value),
    });
    if (!response.ok) throw new Error('Network response was not ok');

    return await response.json() as Card[];
  },
  staleTime: 1000 * 60 * 5, // 5 min cache in UI
  enabled: queryEnabled,
});

// Sorting state
const sortBy = ref<string | undefined>(undefined);
const sortDirection = ref<'asc' | 'desc'>('asc');

// Handle sort changes
function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

// Computed sorted results
const sortedResults = computed(() => {
  return sortSearchResults(searchResults.value, sortBy.value, sortDirection.value);
});

function handleFabClick() {
  const url = searchFeedbackUrl(getPageInfo());
  window.open(url, '_blank');
}
</script>

<style scoped>
.subtitle2 {
  font-size: 1.01rem;
  position: relative;
  top: -14px;
}

.important-text {
  color: rgb(var(--color-primary-500));
  font-style: italic;
}
</style>
