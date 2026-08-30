<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full flex flex-col items-center">
      <SearchSEOTitleAndDescription
        :seo-entry="seoEntry"
        fallback-title="MTG Smart Search"
        fallback-description="Search for cards using semantic natural language vector search."
      />

      <Search
        default-search-type="smart"
        :platform="searchPlatformProp"
        class="mt-6 max-w-5xl"
      />

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults
          :is-loading="isLoading"
          :search-results="searchResults"
          :query-param="displayQuery"
          :help-text="
            seoEntry
              ? `Loading ${platformName} results...`
              : `Please enter a search query to find ${platformName} cards.`
          "
        />
      </div>
    </div>
  </UContainer>
  <LazyIssuesFab
    v-if="searchResults && searchResults.length"
    :onClick="handleFabClick"
  />
  <LazyBackToTop />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import { WordSearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useColbertSearch } from '~/composables/useSearch';
import { getSeoEntry } from '~/utils/seoQueries';
import {
  isValidPlatform,
  getPlatformFilters,
  getSearchPlatformProp,
  getPlatformDisplayName,
  type Platform,
} from '~/utils/platformConfig';

const route = useRoute();
const platform = String(route.params.platform) as Platform;
const slug = route.params.slug ? String(route.params.slug) : undefined;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const seoEntry = slug ? getSeoEntry(platform, 'smart', slug) : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);

// Query from URL params (landing page mode)
const queryParam = computed(() => String(route.query?.query || ''));
const displayQuery = computed(() => seoEntry?.query || queryParam.value);

useSeoMeta({
  robots: () =>
    seoEntry
      ? 'index, follow'
      : queryParam.value
        ? 'noindex, follow'
        : 'index, follow',
  title: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : queryParam.value
        ? `${queryParam.value} - ${platformName} Smart Search | CardMystic`
        : `${platformName} Smart Search | CardMystic`,
  description: () =>
    seoEntry
      ? seoEntry.description
      : queryParam.value
        ? `Find ${platformName} cards matching "${queryParam.value}" using smart search.`
        : `Search for ${platformName} cards using semantic natural language search.`,
  ogType: 'website',
  ogTitle: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : `${platformName} Smart Search | CardMystic`,
  ogDescription: () =>
    seoEntry
      ? seoEntry.description
      : `Semantic ${platformName} card search on CardMystic.`,
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || `${platformName} Smart Search`,
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : `${platformName} Smart Search | CardMystic`,
  twitterDescription: () =>
    seoEntry
      ? seoEntry.description
      : `Semantic ${platformName} card search on CardMystic.`,
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Smart Search' });

const limitParam = computed(() => {
  const n = Number(route.query?.limit);
  return n > 0 ? n : undefined;
});
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    try {
      return CardSearchFiltersSchema.parse(
        JSON.parse(String(route.query.filters)),
      );
    } catch {
      /* fall through to defaults on malformed input */
    }
  }
  return CardSearchFiltersSchema.parse(
    seoEntry ? { ...seoEntry.filters, ...platformFilters } : platformFilters,
  );
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `${platformName} Smart Search: ${displayQuery.value}`,
  query: displayQuery.value,
  filters: parsedFilters.value,
  labels: [platform, 'Smart search'],
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

const { searchResults, isLoading } = useColbertSearch(wordSearch);

const { saveSearchQuery } = useSearchType();
watch(
  () => route.query,
  (query) => {
    if (query.query) saveSearchQuery('smart', query);
  },
  { immediate: true },
);
</script>
