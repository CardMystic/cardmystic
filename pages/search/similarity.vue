<template>
  <UContainer class="mb-6">
    <div class="w-full max-w-7xl px-4 pt-4 flex flex-col items-center">
      <SearchForm similarity class="mt-6 w-full" />

      <!-- Results -->
      <div class="mt-3 w-full">
        <template v-if="isLoading">
          <div class="flex justify-center items-center py-12">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-primary text-3xl" />
          </div>
        </template>

        <template v-else-if="searchResults && searchResults.length">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="result in searchResults" :key="result.card_data.id" class="cursor-pointer"
              @click="navigateToCard(result.card_data.id)">
              <card :card="result" :is-similarity-search="true" />
            </div>
          </div>
        </template>

        <template v-else-if="!cardNameParam">
          <div class="no-results-container">
            <UAlert color="info" icon="i-lucide-info" title="Enter a card name"
              description="Please enter a card name to search for similar cards." class="mb-4" />
          </div>
        </template>

        <template v-else>
          <UContainer>
            <div class="flex flex-col items-center">
              <UIcon name="i-lucide-search-x" class="text-5xl text-primary mb-4" />
              <div class="font-bold text-2xl mb-2">No cards found</div>
              <div class="subtitle2 mb-4">
                Try adjusting your search terms or filters.<br>
                If you think this is a mistake, <a :href="searchFeedbackUrl(getPageInfo())" target="_blank"
                  class="important-text underline">let us know</a>.
              </div>
            </div>
          </UContainer>
        </template>
      </div>
    </div>
  </UContainer>
  <IssuesFab :onClick="handleFabClick" />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, SimilaritySearchSchema } from '~/models/searchModel';
import SearchForm from '~/components/search/Search.vue';
import IssuesFab from '~/components/search/IssuesFab.vue';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';

const router = useRouter();
const route = useRoute();

// Navigation helper
function navigateToCard(cardId: string | undefined) {
  if (!cardId) {
    console.warn('Cannot navigate to card: ID is undefined');
    return;
  }
  router.push(`/card/${cardId}`);
}

// Parse query params into a SimilaritySearch model
const cardNameParam = computed(() => String(route.query.card_name || ''));
const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => route.query.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : undefined);

useHead(() => ({
  title: cardNameParam.value
    ? `CardMystic | ${cardNameParam.value}`
    : 'CardMystic | Similarity Search',
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
  ],
}));

const { setPageInfo, getPageInfo } = usePageInfo();
setPageInfo({
  page_url: route.fullPath,
  page_name: `Similarity Search: ${cardNameParam.value}`,
  card_name: cardNameParam.value,
  filters: parsedFilters.value,
  labels: ['similarity search'],
});

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
    console.log('Similarity search results:', results);
    return results;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: queryEnabled,
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
  color: white
  position: relative
  top: -14px

.subtitle2
  font-size: 1.01rem
  color: white
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

.cache-stats-card
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.95), rgba(66, 66, 66, 0.9)) !important
  border: 1px solid rgba(33, 150, 243, 0.3) !important
  border-radius: 12px !important
  padding: 16px !important

.cache-stats-header
  display: flex
  align-items: center
  margin-bottom: 12px

.cache-stats-title
  color: white
  font-size: 1.1rem
  font-weight: 600

.cache-stats-content
  display: flex
  flex-direction: column
  gap: 8px

.cache-stat
  display: flex
  justify-content: space-between
  align-items: center

.stat-label
  color: rgba(255, 255, 255, 0.8)
  font-size: 0.9rem

.stat-value
  color: rgb(var(--color-primary-500))
  font-weight: 600
</style>
