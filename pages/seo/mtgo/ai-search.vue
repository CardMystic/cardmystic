<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="ai" platform="mtgo" class="mt-6 w-full" />

      <SearchAbout type="mtgo-ai" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" :error-message="searchError?.message"
        help-text="Please enter a search query to find MTGO cards." />
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

const queryParam = computed(() => String(route.query?.query || ''));

useSeoMeta({
  robots: () => queryParam.value ? 'noindex, follow' : 'index, follow',
  title: () => queryParam.value
    ? `${queryParam.value} - MTGO Card Search | CardMystic`
    : 'MTGO Card Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTGO cards matching "${queryParam.value}" using AI search. Discover cards for Magic: The Gathering Online!`
    : 'Search for MTGO cards using AI-powered natural language search. Find cards for Vintage, Legacy, Modern, Pauper, and more on Magic: The Gathering Online.',
  ogType: 'website',
  ogTitle: () => queryParam.value
    ? `"${queryParam.value}" - MTGO Card Search | CardMystic`
    : 'MTGO Card Search | CardMystic',
  ogDescription: () => queryParam.value
    ? `Find MTGO cards matching "${queryParam.value}" on CardMystic.`
    : 'AI-powered MTGO card search on CardMystic.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTGO Card Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () => queryParam.value
    ? `"${queryParam.value}" - MTGO Card Search | CardMystic`
    : 'MTGO Card Search | CardMystic',
  twitterDescription: () => queryParam.value
    ? `Find MTGO cards related to "${queryParam.value}" on CardMystic.`
    : 'AI-powered MTGO card search on CardMystic.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTGO Card Search' });

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return { isMTGO: true, selectedColorFilterOption: 'Contains At Least' as const };
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `MTGO Search: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['mtgo', 'AI search'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const wordSearch = computed(() => {
  if (!queryParam.value) return undefined;
  return WordSearchSchema.parse({
    query: queryParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
    exclude_card_data: false,
  });
});

const skeletonCount = computed(() => limitParam.value || 20);
const { searchResults, isLoading, error: searchError } = useColbertSearch(wordSearch);

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.query) saveSearchQuery('ai', query);
}, { immediate: true });
</script>
