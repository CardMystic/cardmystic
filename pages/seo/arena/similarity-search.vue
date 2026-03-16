<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="similarity" platform="arena" class="mt-6 w-full" />

      <SearchAbout type="arena-similarity" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="cardNameParam"
        :skeleton-count="skeletonCount" :error-message="searchError?.message"
        help-text="Please enter a card name to search for similar MTG Arena cards." :is-similarity-search="true" />
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
    ? `${cardNameParam.value} - MTG Arena Similarity Search | CardMystic`
    : 'MTG Arena Similarity Search | CardMystic',
  description: () => cardNameParam.value
    ? `Find MTG Arena cards similar to ${cardNameParam.value}. Discover Arena-legal alternatives and similar effects.`
    : 'Find similar MTG Arena cards. Search for Arena-legal alternatives and cards with similar effects.',
  ogType: 'website',
  ogTitle: () => cardNameParam.value
    ? `"${cardNameParam.value}" - MTG Arena Similarity Search | CardMystic`
    : 'MTG Arena Similarity Search | CardMystic',
  ogDescription: () => cardNameParam.value
    ? `Explore MTG Arena cards related to "${cardNameParam.value}" on CardMystic.`
    : 'MTG Arena similarity search on CardMystic.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTG Arena Similarity Search',
  twitterCard: 'summary_large_image',
  twitterTitle: () => cardNameParam.value
    ? `"${cardNameParam.value}" - MTG Arena Similarity Search | CardMystic`
    : 'MTG Arena Similarity Search | CardMystic',
  twitterDescription: () => cardNameParam.value
    ? `Explore Arena cards related to "${cardNameParam.value}" on CardMystic.`
    : 'MTG Arena similarity search on CardMystic.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTG Arena Similarity Search' });

const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 40);
const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return { isArena: true, selectedColorFilterOption: 'Contains At Least' as const };
});

const { setPageInfo, getPageInfo } = usePageInfo();
watch([cardNameParam, parsedFilters], ([newCardName, newFilters]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `MTG Arena Similarity Search: ${newCardName}`,
    card_name: newCardName,
    filters: newFilters,
    labels: ['arena', 'similarity search'],
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
