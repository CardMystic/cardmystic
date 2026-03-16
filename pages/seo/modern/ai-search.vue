<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="ai" class="mt-6 w-full" />

      <SearchAbout type="modern-ai" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" :error-message="searchError?.message"
        help-text="Please enter a search query to find Modern-legal cards." />
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
    ? `${queryParam.value} - Modern Card Search | CardMystic`
    : 'MTG Modern Card Search | CardMystic',
  description: () => queryParam.value
    ? `Find Modern-legal cards matching "${queryParam.value}" using AI search. Discover cards for your Modern deck!`
    : 'Search for Modern-legal Magic: The Gathering cards using AI-powered natural language search. Find cards for competitive Modern, FNM, and more.',
  ogType: 'website',
  ogTitle: () => queryParam.value
    ? `"${queryParam.value}" - Modern Card Search | CardMystic`
    : 'MTG Modern Card Search | CardMystic',
  ogDescription: () => queryParam.value
    ? `Find Modern-legal cards matching "${queryParam.value}" on CardMystic.`
    : 'AI-powered Modern format card search on CardMystic.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTG Modern Card Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () => queryParam.value
    ? `"${queryParam.value}" - Modern Card Search | CardMystic`
    : 'MTG Modern Card Search | CardMystic',
  twitterDescription: () => queryParam.value
    ? `Find Modern-legal cards related to "${queryParam.value}" on CardMystic.`
    : 'AI-powered Modern format card search on CardMystic.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTG Modern Card Search' });

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return {
    selectedColorFilterOption: 'Contains At Least' as const,
    selectedCardFormats: [{ format: 'Modern' as const, status: 'Legal' as const }],
  };
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `Modern Search: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['modern', 'AI search'],
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
