<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full pt-4 flex flex-col items-center">
      <Search default-search-type="keyword" :platform="searchPlatformProp" class="mt-6 max-w-7xl" />

      <!-- SEO slug page: show pre-generated title + description -->
      <template v-if="seoEntry">
        <h1 class="text-2xl sm:text-3xl font-bold text-center mt-6 mb-2">{{ seoEntry.title }}</h1>
        <p class="text-gray-400 text-center mb-6 max-w-2xl">{{ seoEntry.description }}</p>
      </template>

      <!-- Landing page: show about section -->
      <SearchAbout v-else :type="aboutType" />

      <div class="mb-10 w-full">
        <!-- Results -->
        <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="displayQuery"
          :error-message="searchError?.message"
          :help-text="seoEntry ? `Loading ${platformName} keyword results...` : `Try describing what the card does or listing mechanics or types.`"
          :hide-thumbs-down-button="true" :hide-progress-bar="true" />
      </div>
    </div>
  </UContainer>
  <LazyIssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <LazyBackToTop />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, KeywordSearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useKeywordSearch } from '~/composables/useSearch';
import { getSeoEntry } from '~/utils/seoQueries';
import { isValidPlatform, getPlatformFilters, getSearchPlatformProp, getPlatformDisplayName, type Platform } from '~/utils/platformConfig';
import type { SearchAboutType } from '~/components/search/SearchAbout.vue';

const route = useRoute();
const platform = String(route.params.platform) as Platform;
const slug = route.params.slug ? String(route.params.slug) : undefined;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const seoEntry = slug ? getSeoEntry(platform, 'keyword', slug) : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);
const aboutType: SearchAboutType = platform === 'all' ? 'keyword' : `${platform}-keyword`;

const queryParam = computed(() => String(route.query?.query || ''));
const displayQuery = computed(() => seoEntry?.query || queryParam.value);

useSeoMeta({
  robots: () => seoEntry ? 'index, follow' : (queryParam.value ? 'noindex, follow' : 'index, follow'),
  title: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : queryParam.value
      ? `${queryParam.value} - ${platformName} Keyword Search | CardMystic`
      : `${platformName} Keyword Search | CardMystic`,
  description: () => seoEntry
    ? seoEntry.description
    : queryParam.value
      ? `Find ${platformName} cards matching "${queryParam.value}" using keyword search.`
      : `Search for ${platformName} cards using keyword search.`,
  ogType: 'website',
  ogTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} Keyword Search | CardMystic`,
  ogDescription: () => seoEntry
    ? seoEntry.description
    : `Keyword search for ${platformName} cards on CardMystic.`,
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || `${platformName} Keyword Search`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} Keyword Search | CardMystic`,
  twitterDescription: () => seoEntry
    ? seoEntry.description
    : `Keyword search for ${platformName} cards on CardMystic.`,
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Keyword Search' });

const limitParam = computed(() => { const n = Number(route.query?.limit); return n > 0 ? n : 40; });
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    try {
      return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
    } catch { /* fall through to defaults on malformed input */ }
  }
  return seoEntry ? { ...seoEntry.filters, ...platformFilters } : platformFilters;
});

const { setPageInfo, getPageInfo } = usePageInfo();
watch([displayQuery, parsedFilters], ([newQuery, newFilters]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `${platformName} Keyword Search: ${newQuery}`,
    query: newQuery,
    filters: newFilters,
    labels: [platform, 'keyword search'],
  });
}, { immediate: true });

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const keywordSearch = computed(() => {
  const query = seoEntry?.query || queryParam.value;
  if (!query) return undefined;
  return KeywordSearchSchema.parse({
    query,
    limit: limitParam.value || (seoEntry ? 100 : 40),
    filters: parsedFilters.value,
  });
});

const { searchResults, isLoading, error: searchError } = useKeywordSearch(keywordSearch);

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.query) saveSearchQuery('keyword', query);
}, { immediate: true });
</script>
