<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="similarity" class="mt-6 w-full" />

      <SearchAbout type="modern-similarity" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="cardNameParam"
        :skeleton-count="skeletonCount" :error-message="searchError?.message"
        help-text="Please enter a card name to find similar Modern-legal cards." :is-similarity-search="true" />
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, SimilaritySearchSchema } from '~/models/searchModel';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { useSimilaritySearch } from '~/composables/useSearch';

const route = useRoute();

const cardNameParam = computed(() => String(route.query.card_name || ''));

useSeoMeta({
  robots: () => cardNameParam.value ? 'noindex, follow' : 'index, follow',
  title: () => cardNameParam.value
    ? `Cards Similar to ${cardNameParam.value} in Modern | CardMystic`
    : 'MTG Modern Similarity Search | CardMystic',
  description: () => cardNameParam.value
    ? `Find Modern-legal cards similar to "${cardNameParam.value}". Discover alternatives and similar effects for your Modern deck.`
    : 'Find similar Modern-legal cards. Search for alternatives, budget replacements, and cards with similar effects in the Modern format.',
  ogType: 'website',
  ogTitle: () => cardNameParam.value
    ? `Cards Similar to "${cardNameParam.value}" in Modern | CardMystic`
    : 'MTG Modern Similarity Search | CardMystic',
  ogDescription: () => cardNameParam.value
    ? `Find Modern-legal cards similar to "${cardNameParam.value}" on CardMystic.`
    : 'Modern format similarity search on CardMystic.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTG Modern Similarity Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () => cardNameParam.value
    ? `Cards Similar to "${cardNameParam.value}" in Modern | CardMystic`
    : 'MTG Modern Similarity Search | CardMystic',
  twitterDescription: () => cardNameParam.value
    ? `Find Modern-legal cards similar to "${cardNameParam.value}" on CardMystic.`
    : 'Modern format similarity search on CardMystic.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTG Modern Similarity Search' });

const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 40);
const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return {
    selectedColorFilterOption: 'Contains At Least' as const,
    selectedCardFormats: [{ format: 'Modern' as const, status: 'Legal' as const }],
  };
});

const { setPageInfo, getPageInfo } = usePageInfo();
watch([cardNameParam, parsedFilters], ([newCardName, newFilters]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `Modern Similarity Search: ${newCardName}`,
    card_name: newCardName,
    filters: newFilters,
    labels: ['modern', 'similarity search'],
  });
}, { immediate: true });

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const similaritySearch = computed(() => {
  if (!cardNameParam.value) return undefined;
  return SimilaritySearchSchema.parse({
    card_name: cardNameParam.value,
    limit: limitParam.value,
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
