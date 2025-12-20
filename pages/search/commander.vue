<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <SearchForm class="mt-6 w-full" />

      <!-- Results -->
      <div class="mt-3 w-full">
        <template v-if="isLoading">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
          </div>
        </template>

        <template v-else-if="searchResults && searchResults.length">
          <SortComponent @sort="handleSort" class="mb-3" />
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <div v-for="result in sortedResults" :key="result.card_data.id">
              <CardComponent :card="result" :showCardInfo="true" />
            </div>
          </div>
        </template>

        <template v-else-if="!queryParam">
          <div>
            <UAlert color="info" icon="i-lucide-info" title="Enter a search query"
              description="Please describe the commander you're looking for." class="mb-4" />
          </div>
        </template>

        <template v-else>
          <UContainer>
            <div class="flex flex-col items-center">
              <UIcon name="i-lucide-search-x" class="text-5xl text-primary mb-4" />
              <div class="font-bold text-2xl mb-2">No results found</div>
              <div class="subtitle2 mb-4">
                Try adjusting your search terms or filters.<br>
                If you think this is a mistake, <NuxtLink :to="searchFeedbackUrl(getPageInfo())" target="_blank"
                  class="important-text underline">let us know</NuxtLink>.
              </div>
            </div>
          </UContainer>
        </template>
      </div>
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, WordSearchSchema } from '~/models/searchModel';
import SearchForm from '~/components/search/Search.vue';
import IssuesFab from '~/components/search/IssuesFab.vue';
import CardSkeleton from '~/components/CardSkeleton.vue';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { UContainer } from '#components';
import CardComponent from '~/components/Card.vue';
import SortComponent from '~/components/search/Sort.vue';

const route = useRoute();

// Parse query params into a WordSearch model
const queryParam = computed(() => String(route.query?.query || ''));

useSeoMeta({
  robots: () =>
    queryParam.value
      ? 'noindex, follow'
      : 'index, follow',
  title: () => queryParam.value
    ? `${queryParam.value} - Commander Search | CardMystic`
    : 'Commander Search | CardMystic',
  description: () => queryParam.value
    ? `Find MTG commanders matching "${queryParam.value}" using AI search. Discover legendary creatures for your EDH deck.`
    : 'Search for Magic: The Gathering commanders using natural language AI. Find the perfect legendary creature for your EDH deck.',
  ogType: 'website',

  ogTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - Commander Search | CardMystic`
      : 'Commander Search | CardMystic',

  ogDescription: () =>
    queryParam.value
      ? `Explore MTG commanders related to "${queryParam.value}" with AI-powered search on CardMystic.`
      : 'AI-powered commander search for Magic: The Gathering on CardMystic.',

  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => 'AI Commander Search',

  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    queryParam.value
      ? `"${queryParam.value}" - Commander Search | CardMystic`
      : 'Commander Search | CardMystic',

  twitterDescription: () =>
    queryParam.value
      ? `Explore commanders related to "${queryParam.value}" with AI-powered search on CardMystic.`
      : 'AI-powered commander search for Magic: The Gathering on CardMystic.',

  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
})
// Used for the github issues logic as it can't be dynamic.
definePageMeta({
  title: 'Commander Search',
});

const limitParam = computed(() => route.query?.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => route.query?.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : undefined);

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `Search: ${queryParam.value}`,
  query: queryParam.value,
  filters: parsedFilters.value,
  labels: ['Commander Search'],
});

function handleFabClick() {
  const url = searchFeedbackUrl(getPageInfo());
  window.open(url, '_blank');
}

const wordSearch = computed(() => {
  if (!queryParam.value) {
    return undefined; // Return undefined if no query is provided
  }
  return WordSearchSchema.parse({
    query: queryParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
    exclude_card_data: false, // Default to false, can be overridden by query param
  });
});

const queryEnabled = computed(() => !!wordSearch.value?.query);

// Number of skeleton cards to show while loading (matches typical search result count)
const skeletonCount = computed(() => limitParam.value || 20);

const { data: searchResults, isLoading } = useQuery({
  queryKey: [
    'search',
    'colbert',
    wordSearch,
  ],
  queryFn: async () => {
    const response = await fetch('/api/search/colbert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wordSearch.value),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json() as Promise<Array<Card>>;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: queryEnabled,
});

// Sorting state
const sortBy = ref<string | undefined>(undefined);
const sortDirection = ref<'asc' | 'desc'>('asc');

// Handle sort changes
function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

// Computed sorted results
const sortedResults = computed(() => {
  return sortSearchResults(searchResults.value, sortBy.value, sortDirection.value);
});

</script>

<style lang="sass" scoped>
.title::after
  content: '|'
  animation: blink 1s infinite
  margin-left: 5px

@keyframes blink
  0%, 100%
    opacity: 1
  50%
    opacity: 0

.image
  position: relative
  bottom: -35px

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  top: 160px
  left: 0
  right: 0
  margin: auto

.title
  font-size: 3.5rem
  color: rgb(var(--color-primary-500))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)

.subtitle
  font-size: 1.05rem
  position: relative
  top: -14px

.subtitle2
  font-size: 1.01rem
  position: relative
  top: -14px

.important-text
  color: rgb(var(--color-primary-500))
  font-style: italic

.chip
  display: flex
  justify-content: center
  align-content: center
  background-color: black

.primary
  color: rgb(var(--color-primary-500))

.glow-wrapper
  position: relative
  display: inline-block

.glow-wrapper::after
  content: ''
  position: absolute
  top: 72%
  left: 49%
  width: 100px
  height: 100px
  background: radial-gradient(circle at center, rgba(147,114,255,0.6) 0%, rgba(147,114,255,0.3) 40%, rgba(147,114,255,0.1) 70%, rgba(147,114,255,0) 100%)
  border-radius: 50%
  transform: translate(-50%, -50%)
  animation: glowPulse 5s ease-in-out infinite
  pointer-events: none
  z-index: 1

@keyframes glowPulse
  0%, 100%
    opacity: 0.6
    transform: translate(-50%, -50%) scale(1)
  50%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.4)

.stat-label
  color: rgba(255, 255, 255, 0.8)
  font-size: 0.9rem

.stat-value
  color: rgb(var(--color-primary-500))
  font-weight: 600
</style>
