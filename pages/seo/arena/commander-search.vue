<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="commander" platform="arena" class="mt-6 w-full" />

      <SearchAbout type="arena-commander" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam"
        :skeleton-count="skeletonCount" :error-message="searchError?.message"
        help-text="Please describe the MTG Arena commander you're looking for." />
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
    ? `${queryParam.value} - MTG Arena Commander Search | CardMystic`
    : 'MTG Arena Commander Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTG Arena commanders matching "${queryParam.value}" using AI search. Discover Arena-legal commanders for Brawl and Historic Brawl!`
    : 'Search for MTG Arena commanders using AI-powered natural language search. Find Arena-legal legendary creatures for Brawl, Historic Brawl, and more.',
  ogType: 'website',
  ogTitle: () => queryParam.value
    ? `"${queryParam.value}" - MTG Arena Commander Search | CardMystic`
    : 'MTG Arena Commander Search | CardMystic',
  ogDescription: () => queryParam.value
    ? `Find MTG Arena commanders matching "${queryParam.value}" on CardMystic.`
    : 'AI-powered MTG Arena commander search on CardMystic.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTG Arena Commander Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () => queryParam.value
    ? `"${queryParam.value}" - MTG Arena Commander Search | CardMystic`
    : 'MTG Arena Commander Search | CardMystic',
  twitterDescription: () => queryParam.value
    ? `Find Arena commanders related to "${queryParam.value}" on CardMystic.`
    : 'AI-powered MTG Arena commander search on CardMystic.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTG Arena Commander Search' });

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return { isArena: true, isCommander: true, selectedColorFilterOption: 'Contains At Least' as const };
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `MTG Arena Commander Search: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['arena', 'commander search'],
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
  if (query.query) saveSearchQuery('commander', query);
}, { immediate: true });
</script>
