<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <SearchForm similarity class="mt-6 w-full" />

      <!-- Results -->
      <ListSearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="cardNameParam"
        :skeleton-count="skeletonCount" help-text="Please enter a card name to search for similar cards."
        :is-similarity-search="true" />
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, SimilaritySearchSchema } from '~/models/searchModel';
import SearchForm from '~/components/search/Search.vue';
import IssuesFab from '~/components/search/IssuesFab.vue';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';

const route = useRoute();

// Parse query params into a SimilaritySearch model
const cardNameParam = computed(() => String(route.query.card_name || ''));

useSeoMeta({
  robots: () =>
    cardNameParam.value
      ? 'noindex, follow'
      : 'index, follow',
  title: () => cardNameParam.value
    ? `${cardNameParam.value} - Similarity Search | CardMystic`
    : 'Similarity Search | CardMystic',
  description: () => cardNameParam.value
    ? `Find Magic: The Gathering cards similar to ${cardNameParam.value}. Discover alternatives and similar effects for your MTG deck.`
    : 'Find similar Magic: The Gathering cards. Search for alternatives and cards with similar effects using similarity search.',
  ogType: 'website',

  ogTitle: () =>
    cardNameParam.value
      ? `"${cardNameParam.value}" - Similarity Search | CardMystic`
      : 'Similarity Search | CardMystic',

  ogDescription: () =>
    cardNameParam.value
      ? `Explore MTG cards related to "${cardNameParam.value}" with Similarity search on CardMystic.`
      : 'Similarity search for Magic: The Gathering on CardMystic.',

  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => 'Similarity Card Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    cardNameParam.value
      ? `"${cardNameParam.value}" - Similarity Search | CardMystic`
      : 'Similarity Search | CardMystic',

  twitterDescription: () =>
    cardNameParam.value
      ? `Explore cards related to "${cardNameParam.value}" with Similarity search on CardMystic.`
      : 'Similarity search for Magic: The Gathering on CardMystic.',

  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
})
// Used for the github issues logic as it can't be dynamic.
definePageMeta({
  title: 'Keyword Search',
});

const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 40);
const parsedFilters = computed(() => route.query.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : undefined);

const { setPageInfo, getPageInfo } = usePageInfo();

// Update page info whenever cardNameParam or filters change
watch([cardNameParam, parsedFilters], ([newCardName, newFilters]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `Similarity Search: ${newCardName}`,
    card_name: newCardName,
    filters: newFilters,
    labels: ['similarity search'],
  });
}, { immediate: true });

function handleFabClick() {
  const url = searchFeedbackUrl(getPageInfo());
  window.open(url, '_blank');
}

const similaritySearch = computed(() => {
  if (!cardNameParam.value) {
    return undefined; // Return undefined if no card name is provided
  }

  return SimilaritySearchSchema.parse({
    card_name: cardNameParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
    exclude_card_data: false, // Default to false, can be overridden by query param
  });
});

const queryEnabled = computed(() => !!similaritySearch.value?.card_name);

// Number of skeleton cards to show while loading (matches typical search result count)
const skeletonCount = computed(() => limitParam.value || 20);

const { data: searchResults, isLoading } = useQuery({
  queryKey: [
    'search',
    'similarity',
    similaritySearch,
  ],
  queryFn: async () => {
    const response = await fetch('/api/search/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(similaritySearch.value),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const results = await response.json() as Array<Card>;
    return results;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: queryEnabled,
});

</script>

<style lang="sass" scoped>
</style>
