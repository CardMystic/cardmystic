<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full pt-4 flex flex-col items-center">
      <StatsSearch
        default-stats-type="popular-commanders"
        :platform="searchPlatformProp"
        class="mt-6 max-w-5xl"
      />

      <template v-if="seoEntry">
        <h1 class="text-2xl sm:text-3xl font-bold text-center mt-6 mb-2">
          {{ seoEntry.title }}
        </h1>
        <p class="text-gray-400 text-center mb-6 max-w-2xl">
          {{ seoEntry.description }}
        </p>
      </template>

      <SearchAbout v-else type="popular-commanders" />

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults
          :is-loading="isLoading"
          :search-results="searchResults ?? []"
          :query-param="queryParam || 'top'"
          :help-text="`Showing the most popular ${platformName} commanders across all decks.`"
          :hide-thumbs-down-button="true"
        />
      </div>
    </div>
  </UContainer>
  <IssuesFab
    v-if="searchResults && searchResults.length"
    :onClick="handleFabClick"
  />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import { TopCommandersRequestSchema } from '~/models/deckStatsModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useTopCommandersSearch } from '~/composables/useDeckStats';
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

const seoEntry = slug
  ? getSeoEntry(platform, 'popular-commanders', slug)
  : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);

const queryParam = computed(
  () => seoEntry?.query || String(route.query?.query || ''),
);

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
        ? `${queryParam.value} - ${platformName} Popular Commanders | CardMystic`
        : `${platformName} Popular Commanders | CardMystic`,
  description: () =>
    seoEntry
      ? seoEntry.description
      : queryParam.value
        ? `Top ${platformName} commanders re-ranked by "${queryParam.value}".`
        : `Discover the most popular ${platformName} commanders across all decks on CardMystic.`,
  ogType: 'website',
  ogTitle: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : `${platformName} Popular Commanders | CardMystic`,
  ogDescription: () =>
    seoEntry?.description ||
    `Discover the most popular ${platformName} commanders across all decks on CardMystic.`,
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || `${platformName} Popular Commanders`,
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : `${platformName} Popular Commanders | CardMystic`,
  twitterDescription: () =>
    seoEntry?.description ||
    `Discover the most popular ${platformName} commanders across all decks on CardMystic.`,
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Popular Commanders' });

const limitParam = computed(() => {
  const n = Number(route.query?.limit);
  return n > 0 ? n : 100;
});
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(
      JSON.parse(String(route.query.filters)),
    );
  }
  return CardSearchFiltersSchema.parse(
    seoEntry ? { ...seoEntry.filters, ...platformFilters } : platformFilters,
  );
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
  return TopCommandersRequestSchema.parse({
    query: queryParam.value || undefined,
    limit: limitParam.value,
    filters: parsedFilters.value,
  });
});

const { searchResults, isLoading } =
  useTopCommandersSearch(topCommandersSearch);
</script>
