<script setup lang="ts">
defineOptions({ name: 'PopularByCardPage' });
import { PopularCommandersForCardRequestSchema } from '~/models/deckStatsModel';
import { CardSearchFiltersSchema } from '~/models/frontend-specific/filtersModel';
import { getPlatformFilters, isValidPlatform } from '~/utils/platformConfig';
const route = useRoute();
const platform = String(route.params.platform);
if (!isValidPlatform(platform))
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
const cardName = computed(() => String(route.query.card_name ?? '').trim());
const queryText = computed(() => String(route.query.query ?? '').trim());
const filters = computed(() => {
  try {
    return CardSearchFiltersSchema.parse({
      ...getPlatformFilters(platform),
      ...JSON.parse(String(route.query.filters || '{}')),
    });
  } catch {
    return undefined;
  }
});
const searchParams = computed(() => {
  if (!cardName.value || !filters.value) return undefined;
  const parsed = PopularCommandersForCardRequestSchema.safeParse({
    card_name: cardName.value,
    query: queryText.value || undefined,
    filters: filters.value,
    useRerank: route.query.useRerank !== 'false',
    limit: 100,
  });
  return parsed.success ? parsed.data : undefined;
});
const invalid = computed(
  () => !filters.value || (!!cardName.value && !searchParams.value),
);
const { searchResults, isLoading, isFetching, error, refetch } =
  usePopularCommandersForCard(searchParams);
const { cards, isLoading: cardLoading } = useCardsByName(
  computed(() => (searchParams.value ? [cardName.value] : [])),
);
const title = computed(() =>
  cardName.value
    ? `Popular Commanders for ${cardName.value}`
    : 'Popular Commanders for a Card',
);
const description = computed(() =>
  cardName.value
    ? `Find commanders most often played with ${cardName.value}.`
    : 'Choose a card to find the commanders whose decks include it.',
);
const canonical = `https://cardmystic.com/popular-by-card/${platform}`;
useHead(() => ({
  link: cardName.value ? [] : [{ rel: 'canonical', href: canonical }],
}));
useSeoMeta({
  title: () => `${title.value} | CardMystic`,
  description: () => description.value,
  robots: () =>
    cardName.value || queryText.value || route.query.filters
      ? 'noindex, follow'
      : 'index, follow',
  ogType: 'website',
  ogTitle: () => `${title.value} | CardMystic`,
  ogDescription: () => description.value,
  ogImage: 'https://cardmystic.com/cardmystic_preview.png',
  twitterCard: 'summary_large_image',
});
definePageMeta({ title: 'Popular Commanders for a Card' });
</script>
<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full flex flex-col items-center">
      <SearchSEOTitleAndDescription
        :fallback-title="title"
        :fallback-description="description"
      />
      <StatsSearch
        default-stats-type="popular-by-card"
        class="mt-6 w-full max-w-5xl"
      />
      <UAlert
        v-if="invalid"
        class="mt-4 w-full"
        color="error"
        title="Invalid search"
        description="Choose a card and reset the filters to try again."
      />
      <div v-if="searchParams" class="w-full mt-4 max-w-50 sm:max-w-70">
        <CardSkeleton
          v-if="cardLoading"
          :show-card-info="true"
          hide-progress-bar
        />
        <Card
          v-else-if="cards?.[0]"
          :card="cards[0]"
          :show-card-info="true"
          hide-progress-bar
          hide-thumbs-down-button
          is-searched
        />
      </div>
      <SearchResults
        v-if="!invalid"
        class="w-full mb-10"
        :search-results="searchResults"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :error="error"
        @retry="refetch()"
        :query-param="cardName"
        :reranking-enabled="route.query.useRerank !== 'false'"
        :help-text="
          cardName
            ? `Showing popular commanders whose decks include ${cardName}.`
            : 'Choose a card above to find commanders that play it.'
        "
        empty-title="No commander data for this card"
        empty-description="Try another card or change the filters."
        hide-thumbs-down-button
      />
    </div>
  </UContainer>
  <BackToTop />
</template>
