<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="similarity" platform="mtgo" class="mt-6 w-full" />

      <SearchAbout type="mtgo-similarity" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" :error-message="searchError?.message"
        help-text="Please enter a card name to find similar MTGO cards." />
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, SimilaritySearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useSimilaritySearch } from '~/composables/useSearch';

const route = useRoute();

const queryParam = computed(() => String(route.query?.query || ''));

useSeoMeta({
  robots: () => queryParam.value ? 'noindex, follow' : 'index, follow',
  title: () => queryParam.value
    ? `Cards Similar to ${queryParam.value} on MTGO | CardMystic`
    : 'MTGO Similarity Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTGO cards similar to "${queryParam.value}" using AI-powered similarity search. Discover alternatives for Magic: The Gathering Online!`
    : 'Search for similar MTGO cards using AI-powered similarity search. Find card alternatives for Vintage, Legacy, Modern, Pauper, and more on Magic: The Gathering Online.',
  ogType: 'website',
  ogTitle: () => queryParam.value
    ? `Cards Similar to "${queryParam.value}" on MTGO | CardMystic`
    : 'MTGO Similarity Search | CardMystic',
  ogDescription: () => queryParam.value
    ? `Find MTGO cards similar to "${queryParam.value}" on CardMystic.`
    : 'AI-powered MTGO similarity search on CardMystic.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTGO Similarity Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () => queryParam.value
    ? `Cards Similar to "${queryParam.value}" on MTGO | CardMystic`
    : 'MTGO Similarity Search | CardMystic',
  twitterDescription: () => queryParam.value
    ? `Find MTGO cards similar to "${queryParam.value}" on CardMystic.`
    : 'AI-powered MTGO similarity search on CardMystic.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTGO Similarity Search' });

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
  page_name: `MTGO Similarity: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['mtgo', 'similarity search'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const similaritySearch = computed(() => {
  if (!queryParam.value) return undefined;
  return SimilaritySearchSchema.parse({
    query: queryParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
    exclude_card_data: false,
  });
});

const skeletonCount = computed(() => limitParam.value || 20);
const { searchResults, isLoading, error: searchError } = useSimilaritySearch(similaritySearch);

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.query) saveSearchQuery('similarity', query);
}, { immediate: true });
</script>
