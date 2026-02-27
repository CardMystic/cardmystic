<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <!-- Shared Search Form -->
      <Search class="mt-6 w-full" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" help-text="Try describing what the card does or listing mechanics or types."
        :is-keyword-search="true" />
    </div>
  </UContainer>

  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, KeywordSearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePageInfo } from '~/composables/usePageInfo';
import { useKeywordSearch } from '~/composables/useSearch';

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

  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
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

  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
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

const skeletonCount = computed(() => limitParam.value || 20);

// Run the keyword search request
const { searchResults, isLoading } = useKeywordSearch(keywordSearch);

function handleFabClick() {
  const url = searchFeedbackUrl(getPageInfo());
  window.open(url, '_blank');
}
</script>

<style scoped></style>
