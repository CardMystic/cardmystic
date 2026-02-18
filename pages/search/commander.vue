<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <SearchForm class="mt-6 w-full" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" help-text="Please describe the commander you're looking for." />
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, WordSearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useColbertSearch } from '~/composables/useSearch';

const route = useRoute();

// Parse query params into a WordSearch model
const queryParam = computed(() => String(route.query?.query || ''));

useSeoMeta({
  robots: () =>
    queryParam.value
      ? 'noindex, follow'
      : 'index, follow',
  title: () => queryParam.value
    ? `${queryParam.value} - Commander Search | CardMystic`
    : 'Commander Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTG commanders matching "${queryParam.value}" using AI search. Discover legendary creatures for your EDH deck.`
    : 'Search for Magic: The Gathering commanders using natural language AI. Find the perfect legendary creature for your EDH deck.',
  ogType: 'website',

  ogTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - Commander Search | CardMystic`
      : 'Commander Search | CardMystic',

  ogDescription: () =>
    queryParam.value
      ? `Explore MTG commanders related to "${queryParam.value}" with AI-powered search on CardMystic.`
      : 'AI-powered commander search for Magic: The Gathering on CardMystic.',

  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'AI Commander Search',

  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - Commander Search | CardMystic`
      : 'Commander Search | CardMystic',

  twitterDescription: () =>
    queryParam.value
      ? `Explore commanders related to "${queryParam.value}" with AI-powered search on CardMystic.`
      : 'AI-powered commander search for Magic: The Gathering on CardMystic.',

  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})
// Used for the github issues logic as it can't be dynamic.
definePageMeta({
  title: 'Commander Search',
});

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => route.query?.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : undefined);

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `Search: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['Commander Search'],
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

// Number of skeleton cards to show while loading (matches typical search result count)
const skeletonCount = computed(() => limitParam.value || 20);

const { searchResults, isLoading } = useColbertSearch(wordSearch);

</script>

<style lang="sass" scoped>
</style>
