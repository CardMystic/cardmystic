<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <StatsSearch default-stats-type="popular-by-commander" class="mt-6 w-full" />

      <SearchAbout type="popular-by-commander" />

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="commanderParam || ''"
          :skeleton-count="skeletonCount" :error-message="searchError?.message" :help-text="helpText"
          :hide-thumbs-down-button="true" default-group-by="type" />
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
import { PopularByCommanderSearchSchema } from '~/models/deckStatsModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePopularByCommander } from '~/composables/useDeckStats';
import { isValidPlatform, type Platform } from '~/utils/platformConfig';

const route = useRoute();
const platform = String(route.params.platform) as Platform;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const commanderParam = computed(() => String(route.query.commander || ''));
const partnerParam = computed(() => String(route.query.partner || ''));
const queryParam = computed(() => String(route.query.query || ''));

const commanderDisplay = computed(() => {
  if (!commanderParam.value) return '';
  if (partnerParam.value) return `${commanderParam.value} & ${partnerParam.value}`;
  return commanderParam.value;
});

const helpText = computed(() => {
  if (!commanderParam.value) return 'Select a commander above to see the most popular cards in their decks.';
  if (queryParam.value) {
    return `Showing popular cards in ${commanderDisplay.value} decks, re-ranked by "${queryParam.value}".`;
  }
  return `Showing the most popular cards in ${commanderDisplay.value} decks.`;
});

useSeoMeta({
  robots: () => commanderParam.value ? 'noindex, follow' : 'index, follow',
  title: () => commanderParam.value
    ? `${commanderDisplay.value} Popular Cards | CardMystic`
    : 'Popular Cards by Commander | CardMystic',
  description: () => commanderParam.value
    ? `Discover the most popular cards in ${commanderDisplay.value} commander decks.`
    : 'Find the most popular cards for any commander on CardMystic.',
  ogType: 'website',
  ogTitle: () => commanderParam.value
    ? `${commanderDisplay.value} Popular Cards | CardMystic`
    : 'Popular Cards by Commander | CardMystic',
  ogDescription: () => 'Find the most popular cards for any commander on CardMystic.',
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: 'Popular Cards by Commander',
  twitterCard: 'summary_large_image',
  twitterTitle: () => commanderParam.value
    ? `${commanderDisplay.value} Popular Cards | CardMystic`
    : 'Popular Cards by Commander | CardMystic',
  twitterDescription: () => 'Find the most popular cards for any commander on CardMystic.',
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Popular Cards by Commander' });

const limitParam = computed(() => { const n = Number(route.query?.limit); return n > 0 ? n : 100; });

const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return {};
});

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: 'Popular Cards by Commander',
  query: commanderParam.value,
  filters: parsedFilters.value,
  labels: ['popular-by-commander'],
});

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const searchParams = computed(() => {
  if (!commanderParam.value) return undefined;
  const commanders = [commanderParam.value];
  if (partnerParam.value) commanders.push(partnerParam.value);

  return PopularByCommanderSearchSchema.parse({
    commanders,
    query: queryParam.value || undefined,
    limit: limitParam.value,
    filters: parsedFilters.value,
  });
});

const skeletonCount = computed(() => limitParam.value || 100);
const { searchResults, isLoading, error: searchError } = usePopularByCommander(searchParams);
</script>
