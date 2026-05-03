<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full pt-4 flex flex-col items-center">
      <Search default-search-type="commander" :platform="searchPlatformProp" class="mt-6 max-w-5xl" />

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
          :error-message="searchError?.message"
          :help-text="seoEntry ? `Loading ${platformName} commander results...` : `Please describe the ${platformName} commander you're looking for.`" />
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

const seoEntry = slug ? getSeoEntry(platform, 'commander', slug) : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);
const aboutType: SearchAboutType = platform === 'all' ? 'commander' : `${platform}-commander`;

const queryParam = computed(() => String(route.query?.query || ''));
const displayQuery = computed(() => seoEntry?.query || queryParam.value);

useSeoMeta({
  robots: () => seoEntry ? 'index, follow' : (queryParam.value ? 'noindex, follow' : 'index, follow'),
  title: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : queryParam.value
      ? `${queryParam.value} - ${platformName} Commander Search | CardMystic`
      : `${platformName} Commander Search | CardMystic`,
  description: () => seoEntry
    ? seoEntry.description
    : queryParam.value
      ? `Find ${platformName} commanders matching "${queryParam.value}" using AI search.`
      : `Search for ${platformName} commanders using AI-powered natural language search.`,
  ogType: 'website',
  ogTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} Commander Search | CardMystic`,
  ogDescription: () => seoEntry
    ? seoEntry.description
    : `AI-powered ${platformName} commander search on CardMystic.`,
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || `${platformName} Commander Search`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} Commander Search | CardMystic`,
  twitterDescription: () => seoEntry
    ? seoEntry.description
    : `AI-powered ${platformName} commander search on CardMystic.`,
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Commander Search' });

const limitParam = computed(() => { const n = Number(route.query?.limit); return n > 0 ? n : undefined; });
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    try {
      return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
    } catch { /* fall through to defaults on malformed input */ }
  }
  return seoEntry
    ? { ...seoEntry.filters, ...platformFilters, isCommander: true }
    : { ...platformFilters, isCommander: true };
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `${platformName} Commander Search: ${displayQuery.value}`,
  query: displayQuery.value,
  filters: parsedFilters.value,
  labels: [platform, 'commander search'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const wordSearch = computed(() => {
  const query = seoEntry?.query || queryParam.value;
  if (!query) return undefined;
  return WordSearchSchema.parse({
    query,
    limit: limitParam.value || undefined,
    filters: parsedFilters.value,
    exclude_card_data: false,
  });
});

const { searchResults, isLoading, error: searchError } = useColbertSearch(wordSearch);

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.query) saveSearchQuery('commander', query);
}, { immediate: true });
</script>
