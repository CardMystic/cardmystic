<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <StatsSearch default-stats-type="popular-commanders" :platform="searchPlatformProp" class="mt-6 w-full" />

      <SearchAbout type="popular-commanders" />

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam || 'top'"
          :skeleton-count="skeletonCount" :error-message="searchError?.message"
          :help-text="`Showing the most popular ${platformName} commanders across all decks.`" />
      </div>
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema } from '~/models/searchModel';
import { TopCommandersSearchSchema } from '~/models/deckStatsModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useTopCommandersSearch } from '~/composables/useDeckStats';
import { isValidPlatform, getPlatformFilters, getSearchPlatformProp, getPlatformDisplayName, type Platform } from '~/utils/platformConfig';

const route = useRoute();
const platform = String(route.params.platform) as Platform;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);

const queryParam = computed(() => String(route.query?.query || ''));

useSeoMeta({
  robots: () => queryParam.value ? 'noindex, follow' : 'index, follow',
  title: () => queryParam.value
    ? `${queryParam.value} - ${platformName} Popular Commanders | CardMystic`
    : `${platformName} Popular Commanders | CardMystic`,
  description: () => queryParam.value
    ? `Top ${platformName} commanders re-ranked by "${queryParam.value}".`
    : `Discover the most popular ${platformName} commanders across all decks on CardMystic.`,
  ogType: 'website',
  ogTitle: () => `${platformName} Popular Commanders | CardMystic`,
  ogDescription: () => `Discover the most popular ${platformName} commanders across all decks on CardMystic.`,
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => `${platformName} Popular Commanders`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${platformName} Popular Commanders | CardMystic`,
  twitterDescription: () => `Discover the most popular ${platformName} commanders across all decks on CardMystic.`,
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
});

definePageMeta({ title: 'Popular Commanders' });

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : 40);
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return platformFilters;
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `${platformName} Popular Commanders`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: [platform, 'popular commanders'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const topCommandersSearch = computed(() => {
  return TopCommandersSearchSchema.parse({
    query: queryParam.value || undefined,
    limit: limitParam.value,
    filters: parsedFilters.value,
  });
});

const skeletonCount = computed(() => limitParam.value || 40);
const { searchResults, isLoading, error: searchError } = useTopCommandersSearch(topCommandersSearch);
</script>
