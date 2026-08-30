<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full pt-4 flex flex-col items-center">
      <StatsSearch
        default-stats-type="popular-by-commander"
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

      <SearchAbout v-else type="popular-by-commander" />

      <!-- Commander Card(s) -->
      <div
        v-if="commanderNames.length"
        class="w-full mt-4 flex flex-wrap gap-4 justify-center"
      >
        <template v-if="commanderCardsLoading">
          <div
            v-for="name in commanderNames"
            :key="name"
            class="w-full max-w-50 sm:max-w-70"
          >
            <CardSkeleton :show-card-info="true" />
          </div>
        </template>
        <template v-else-if="commanderCards && commanderCards.length">
          <div
            v-for="cmd in commanderCards"
            :key="cmd.card_name"
            class="w-full max-w-50 sm:max-w-70"
          >
            <Card
              :card="cmd"
              :show-card-info="true"
              :hide-progress-bar="true"
              :hide-thumbs-down-button="true"
              :gold-highlight="true"
              :is-commander="true"
            />
          </div>
        </template>
      </div>

      <!-- Results -->
      <div class="mb-10 w-full">
        <SearchResults
          :is-loading="isLoading"
          :search-results="searchResults"
          :query-param="commanderParam || ''"
          :help-text="helpText"
          empty-title="No Commander Data Yet"
          empty-description="Our model doesn't have enough data on this card yet. We are always working to improve our coverage, please check back later!"
          :hide-thumbs-down-button="true"
          default-group-by="type"
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
import { PopularByCommanderRequestSchema } from '~/models/deckStatsModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePopularByCommander } from '~/composables/useDeckStats';
import { useCardsByName } from '~/composables/useCards';
import { isValidPlatform, type Platform } from '~/utils/platformConfig';
import { getSeoEntry } from '~/utils/seoQueries';

const route = useRoute();
const platform = String(route.params.platform) as Platform;
const slug = route.params.slug ? String(route.params.slug) : undefined;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const seoEntry = slug
  ? getSeoEntry(platform, 'popular-by-commander', slug)
  : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const commanderParam = computed(
  () => seoEntry?.query || String(route.query.commander || ''),
);
const partnerParam = computed(() => String(route.query.partner || ''));
const queryParam = computed(() => String(route.query.query || ''));

const commanderNames = computed(() =>
  [commanderParam.value, partnerParam.value].filter(Boolean),
);

const { cards: commanderCards, isLoading: commanderCardsLoading } =
  useCardsByName(commanderNames);

const commanderDisplay = computed(() => {
  if (!commanderParam.value) return '';
  if (partnerParam.value)
    return `${commanderParam.value} & ${partnerParam.value}`;
  return commanderParam.value;
});

const helpText = computed(() => {
  if (!commanderParam.value)
    return 'Select a commander above to see the most popular cards in their decks.';
  if (queryParam.value) {
    return `Showing popular cards in ${commanderDisplay.value} decks, re-ranked by "${queryParam.value}".`;
  }
  return `Showing the most popular cards in ${commanderDisplay.value} decks.`;
});

useSeoMeta({
  robots: () =>
    seoEntry
      ? 'index, follow'
      : commanderParam.value
        ? 'noindex, follow'
        : 'index, follow',
  title: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : commanderParam.value
        ? `${commanderDisplay.value} Popular Cards | CardMystic`
        : 'Popular Cards by Commander | CardMystic',
  description: () =>
    seoEntry
      ? seoEntry.description
      : commanderParam.value
        ? `Discover the most popular cards in ${commanderDisplay.value} commander decks.`
        : 'Find the most popular cards for any commander on CardMystic.',
  ogType: 'website',
  ogTitle: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : commanderParam.value
        ? `${commanderDisplay.value} Popular Cards | CardMystic`
        : 'Popular Cards by Commander | CardMystic',
  ogDescription: () =>
    seoEntry?.description ||
    'Find the most popular cards for any commander on CardMystic.',
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || 'Popular Cards by Commander',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    seoEntry
      ? `${seoEntry.title} | CardMystic`
      : commanderParam.value
        ? `${commanderDisplay.value} Popular Cards | CardMystic`
        : 'Popular Cards by Commander | CardMystic',
  twitterDescription: () =>
    seoEntry?.description ||
    'Find the most popular cards for any commander on CardMystic.',
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Popular Cards by Commander' });

const limitParam = computed(() => {
  const n = Number(route.query?.limit);
  return n > 0 ? n : 100;
});

const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(
      JSON.parse(String(route.query.filters)),
    );
  }
  return CardSearchFiltersSchema.parse(seoEntry?.filters || {});
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

  return PopularByCommanderRequestSchema.parse({
    commanders,
    query: queryParam.value || undefined,
    limit: limitParam.value,
    filters: parsedFilters.value,
  });
});

const { searchResults, isLoading } = usePopularByCommander(searchParams);
</script>
