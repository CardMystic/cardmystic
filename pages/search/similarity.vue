<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <SearchForm similarity class="mt-6 w-full" />

      <!-- Results -->
      <div class="mt-3 w-full">
        <template v-if="isLoading">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
          </div>
        </template>

        <template v-else-if="searchResults && searchResults.length">
          <div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="(result, index) in searchResults" :key="result.card_data.id">
                <CardComponent :card="result" :showCardInfo="true" :is-similarity-search="true"
                  :is-searched="index == 0" />
              </div>
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
              <div class="subtitle2 mt-2 mb-4">
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
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, SimilaritySearchSchema } from '~/models/searchModel';
import SearchForm from '~/components/search/Search.vue';
import IssuesFab from '~/components/search/IssuesFab.vue';
import CardSkeleton from '~/components/CardSkeleton.vue';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import CardComponent from '~/components/Card.vue';

const route = useRoute();

// Parse query params into a SimilaritySearch model
const cardNameParam = computed(() => String(route.query.card_name || ''));
const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 40);
const parsedFilters = computed(() => route.query.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : undefined);

useHead(() => ({
  title: cardNameParam.value
    ? `CardMystic | ${cardNameParam.value}`
    : 'CardMystic | Similarity Search',
}));

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

.searched-card-highlight
  background: #f7f3e7
  border-radius: 18px
  padding: 18px 12px 12px 12px
  box-shadow: 0 2px 12px rgba(147, 114, 255, 0.08)
  margin-bottom: 18px
  display: flex
  justify-content: center
  align-items: center

  // Limit the card size to match grid
  & > *
    width: 100%
    max-width: 320px
</style>
