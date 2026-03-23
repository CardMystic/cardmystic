<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <StatsSearch default-stats-type="popular-cards" :platform="searchPlatformProp" class="mt-6 w-full" />

      <SearchAbout type="popular-cards" />

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="queryParam || 'top'"
          :skeleton-count="skeletonCount" :error-message="searchError?.message"
          :help-text="`Showing the most popular ${platformName} cards across all decks.`"
          :hide-thumbs-down-button="true" />
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
import { TopCardsSearchSchema } from '~/models/deckStatsModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useTopCardsSearch } from '~/composables/useDeckStats';
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
    ? `${queryParam.value} - ${platformName} Popular Cards | CardMystic`
    : `${platformName} Popular Cards | CardMystic`,
  description: () => queryParam.value
    ? `Top ${platformName} cards re-ranked by "${queryParam.value}".`
    : `Discover the most popular ${platformName} cards across all decks on CardMystic.`,
  ogType: 'website',
  ogTitle: () => `${platformName} Popular Cards | CardMystic`,
  ogDescription: () => `Discover the most popular ${platformName} cards across all decks on CardMystic.`,
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => `${platformName} Popular Cards`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${platformName} Popular Cards | CardMystic`,
  twitterDescription: () => `Discover the most popular ${platformName} cards across all decks on CardMystic.`,
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
});

definePageMeta({ title: 'Popular Cards' });

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : 100);
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
  page_name: `${platformName} Popular Cards`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: [platform, 'popular cards'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const topCardsSearch = computed(() => {
  return TopCardsSearchSchema.parse({
    query: queryParam.value || undefined,
    limit: limitParam.value,
    filters: parsedFilters.value,
  });
});

const skeletonCount = computed(() => limitParam.value || 100);
const { searchResults, isLoading, error: searchError } = useTopCardsSearch(topCardsSearch);
</script>
