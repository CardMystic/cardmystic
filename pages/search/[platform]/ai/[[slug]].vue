<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="ai" :platform="searchPlatformProp" class="mt-6 w-full" />

      <!-- SEO slug page: show pre-generated title + description -->
      <template v-if="seoEntry">
        <h1 class="text-2xl sm:text-3xl font-bold text-center mt-6 mb-2">{{ seoEntry.title }}</h1>
        <p class="text-gray-400 text-center mb-6 max-w-2xl">{{ seoEntry.description }}</p>
      </template>

      <!-- Landing page: show about section -->
      <SearchAbout v-else :type="aboutType" />

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="displayQuery"
          :skeleton-count="skeletonCount" :error-message="searchError?.message"
          :help-text="seoEntry ? `Loading ${platformName} results...` : `Please enter a search query to find ${platformName} cards.`" />
      </div>

    </div>
  </UContainer>
  <LazyIssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <LazyBackToTop />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, WordSearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useColbertSearch } from '~/composables/useSearch';
import { getSeoEntry } from '~/utils/seoQueries';
import { isValidPlatform, getPlatformFilters, getSearchPlatformProp, getPlatformDisplayName, type Platform } from '~/utils/platformConfig';
import type { SearchAboutType } from '~/components/search/SearchAbout.vue';

const route = useRoute();
const platform = String(route.params.platform) as Platform;
const slug = route.params.slug ? String(route.params.slug) : undefined;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const seoEntry = slug ? getSeoEntry(platform, 'ai', slug) : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);
const aboutType: SearchAboutType = platform === 'all' ? 'ai' : `${platform}-ai`;

// Query from URL params (landing page mode)
const queryParam = computed(() => String(route.query?.query || ''));
const displayQuery = computed(() => seoEntry?.query || queryParam.value);

useSeoMeta({
  robots: () => seoEntry ? 'index, follow' : (queryParam.value ? 'noindex, follow' : 'index, follow'),
  title: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : queryParam.value
      ? `${queryParam.value} - ${platformName} AI Search | CardMystic`
      : `${platformName} AI Search | CardMystic`,
  description: () => seoEntry
    ? seoEntry.description
    : queryParam.value
      ? `Find ${platformName} cards matching "${queryParam.value}" using AI search.`
      : `Search for ${platformName} cards using AI-powered natural language search.`,
  ogType: 'website',
  ogTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} AI Search | CardMystic`,
  ogDescription: () => seoEntry
    ? seoEntry.description
    : `AI-powered ${platformName} card search on CardMystic.`,
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || `${platformName} AI Search`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} AI Search | CardMystic`,
  twitterDescription: () => seoEntry
    ? seoEntry.description
    : `AI-powered ${platformName} card search on CardMystic.`,
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'AI Search' });

const limitParam = computed(() => { const n = Number(route.query?.limit); return n > 0 ? n : undefined; });
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return seoEntry ? { ...seoEntry.filters, ...platformFilters } : platformFilters;
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `${platformName} AI Search: ${displayQuery.value}`,
  query: displayQuery.value,
  filters: parsedFilters.value,
  labels: [platform, 'AI search'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const wordSearch = computed(() => {
  const query = seoEntry?.query || queryParam.value;
  if (!query) return undefined;
  return WordSearchSchema.parse({
    query,
    limit: limitParam.value || (seoEntry ? 40 : undefined),
    filters: parsedFilters.value,
    exclude_card_data: false,
  });
});

const skeletonCount = computed(() => limitParam.value || (seoEntry ? 40 : 20));
const { searchResults, isLoading, error: searchError } = useColbertSearch(wordSearch);

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.query) saveSearchQuery('ai', query);
}, { immediate: true });
</script>
