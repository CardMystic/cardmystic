<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="similarity" :platform="searchPlatformProp" class="mt-6 w-full" />

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
          :skeleton-count="skeletonCount" :error-message="searchError?.message"
          :help-text="seoEntry ? `Loading similar cards...` : `Please enter a card name to search for similar ${platformName} cards.`"
          :is-similarity-search="true" :hide-thumbs-down-button="true" />
      </div>
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, SimilaritySearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useSimilaritySearch } from '~/composables/useSearch';
import { getSeoEntry } from '~/utils/seoQueries';
import { isValidPlatform, getPlatformFilters, getSearchPlatformProp, getPlatformDisplayName, type Platform } from '~/utils/platformConfig';
import type { SearchAboutType } from '~/components/search/SearchAbout.vue';

const route = useRoute();
const platform = String(route.params.platform) as Platform;
const slug = route.params.slug ? String(route.params.slug) : undefined;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const seoEntry = slug ? getSeoEntry(platform, 'similarity', slug) : undefined;
if (slug && !seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);
const aboutType: SearchAboutType = platform === 'all' ? 'similarity' : `${platform}-similarity`;

const cardNameParam = computed(() => String(route.query?.card_name || ''));
const displayQuery = computed(() => seoEntry?.query || cardNameParam.value);

useSeoMeta({
  robots: () => seoEntry ? 'index, follow' : (cardNameParam.value ? 'noindex, follow' : 'index, follow'),
  title: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : cardNameParam.value
      ? `${cardNameParam.value} - ${platformName} Similarity Search | CardMystic`
      : `${platformName} Similarity Search | CardMystic`,
  description: () => seoEntry
    ? seoEntry.description
    : cardNameParam.value
      ? `Find ${platformName} cards similar to ${cardNameParam.value}.`
      : `Find similar ${platformName} cards using similarity search.`,
  ogType: 'website',
  ogTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} Similarity Search | CardMystic`,
  ogDescription: () => seoEntry
    ? seoEntry.description
    : `${platformName} similarity search on CardMystic.`,
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => seoEntry?.title || `${platformName} Similarity Search`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoEntry
    ? `${seoEntry.title} | CardMystic`
    : `${platformName} Similarity Search | CardMystic`,
  twitterDescription: () => seoEntry
    ? seoEntry.description
    : `${platformName} similarity search on CardMystic.`,
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
});

definePageMeta({ title: 'Similarity Search' });

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : 40);
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return seoEntry ? { ...seoEntry.filters, ...platformFilters } : platformFilters;
});

const { setPageInfo, getPageInfo } = usePageInfo();
watch([displayQuery, parsedFilters], ([newQuery, newFilters]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `${platformName} Similarity Search: ${newQuery}`,
    card_name: newQuery,
    filters: newFilters,
    labels: [platform, 'similarity search'],
  });
}, { immediate: true });

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const similaritySearch = computed(() => {
  const cardName = seoEntry?.query || cardNameParam.value;
  if (!cardName) return undefined;
  return SimilaritySearchSchema.parse({
    card_name: cardName,
    limit: limitParam.value || 40,
    filters: parsedFilters.value,
    exclude_card_data: false,
  });
});

const skeletonCount = computed(() => limitParam.value || 20);
const { searchResults, isLoading, error: searchError } = useSimilaritySearch(similaritySearch);

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.card_name) saveSearchQuery('similarity', query);
}, { immediate: true });
</script>
