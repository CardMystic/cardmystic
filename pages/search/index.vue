<template>
  <v-container class="fill-height d-flex align-start justify-center pt-0">
    <v-col justify="center" align="center" class="col-container pt-4">
      <!-- Results -->
      <div style="max-width: 1072px" class="mt-6">

        <template v-if="isLoading">
          <v-row>
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate color="primary" />
            </v-col>
          </v-row>
        </template>

        <template v-else-if="searchResults && searchResults.length">
          <v-row>
            <v-col class="px-0 py-0 flex-grow-1 mb-2" v-for="result in searchResults" :key="result.card_data.id">
              <card :card="result" @click="navigateToCard(result.card_data.id)" />
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <div class="no-results-container">
            <v-btn to="/" class="mt-4" color="primary">Home</v-btn>
          </div>
        </template>
      </div>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Card } from '~/models/cardModel';
import { CardSearchFiltersSchema, WordSearchSchema } from '~/models/searchModel';

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

// Parse query params into a WordSearch model
const queryParam = computed(() => String(route.query.query || ''));
const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : undefined);
const parsedFilters = computed(() => route.query.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : {});

useHead(() => ({
  title: queryParam.value
    ? `CardMystic | ${queryParam.value}`
    : 'CardMystic | Search',
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
  ],
}));

const wordSearch = computed(() =>
  WordSearchSchema.parse({
    query: queryParam.value,
    limit: limitParam.value,
    filters: parsedFilters.value,
    exclude_card_data: false, // Default to false, can be overridden by query param
  })
);

const { data: searchResults, isLoading } = useQuery({
  queryKey: [
    'search',
    'colbert',
    JSON.stringify(wordSearch.value)
  ],
  queryFn: async () => {
    const response = await fetch('/api/proxy/search/colbert', {
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
  enabled: !!wordSearch.value.query,
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

.col-container
  position: relative

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
  color: rgb(var(--v-theme-primary))
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
  color: rgb(var(--v-theme-primary))
  font-style: italic

.chip
  display: flex
  justify-content: center
  align-content: center
  background-color: black

.primary
  color: rgb(var(--v-theme-primary))

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

.no-results-container
  margin-top: 40px
  display: flex
  align-items: center
  justify-content: center
  text-align: center
  color: white
  font-size: 1.5rem
  display: flex
  flex-direction: column

.filters-btn
  width: 40px
  height: 56px
  border-radius: 4px
  margin-left: 12px

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
  color: rgb(var(--v-theme-primary))
  font-weight: 600
</style>
