<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <SearchForm class="mt-6 w-full" />

      <!-- Results -->
      <ListSearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" help-text="Please enter a search query to find cards." />
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, WordSearchSchema } from '~/models/searchModel';
import SearchForm from '~/components/search/Search.vue';
import IssuesFab from '~/components/search/IssuesFab.vue';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { UContainer } from '#components';

const route = useRoute();

// Parse query params into a WordSearch model
const queryParam = computed(() => String(route.query?.query || ''));

useSeoMeta({
  robots: () =>
    queryParam.value
      ? 'noindex, follow'
      : 'index, follow',
  title: () => queryParam.value
    ? `${queryParam.value} - AI Search | CardMystic`
    : 'AI Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTG cards matching "${queryParam.value}" using AI search. Discover the perfect cards for your deck!`
    : 'Search for Magic: The Gathering cards using natural language AI. Discover the perfect cards for your deck.',
  ogType: 'website',

  ogTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - AI Search | CardMystic`
      : 'AI Search | CardMystic',

  ogDescription: () =>
    queryParam.value
      ? `Explore MTG cards related to "${queryParam.value}" with AI-powered search on CardMystic.`
      : 'AI-powered card search for Magic: The Gathering on CardMystic.',

  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => 'AI Card Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - AI Search | CardMystic`
      : 'AI Search | CardMystic',

  twitterDescription: () =>
    queryParam.value
      ? `Explore cards related to "${queryParam.value}" with AI-powered search on CardMystic.`
      : 'AI-powered card search for Magic: The Gathering on CardMystic.',

  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
})
// Used for the github issues logic as it can't be dynamic.
definePageMeta({
  title: 'AI Search',
});

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => route.query?.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : undefined);

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `Search: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['AI search'],
});

function handleFabClick() {
  const url = searchFeedbackUrl(getPageInfo());
  window.open(url, '_blank');
}

const wordSearch = computed(() => {
  if (!queryParam.value) {
    return undefined; // Return undefined if no query is provided
  }
  return WordSearchSchema.parse({
    query: queryParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
    exclude_card_data: false, // Default to false, can be overridden by query param
  });
});

const queryEnabled = computed(() => !!wordSearch.value?.query);

// Number of skeleton cards to show while loading (matches typical search result count)
const skeletonCount = computed(() => limitParam.value || 20);

const { data: searchResults, isLoading } = useQuery({
  queryKey: [
    'search',
    'colbert',
    wordSearch,
  ],
  queryFn: async () => {
    const response = await fetch('/api/search/colbert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wordSearch.value),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json() as Promise<Array<Card>>;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: queryEnabled,
});

</script>

<style lang="sass" scoped>
</style>
