<template>
  <div class="top-queries-container">
    <div v-if="isLoading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
      <p class="mt-2 text-white text-caption">Loading popular queries...</p>
    </div>

    <div v-else-if="topQueries && topQueries.length > 0" class="top-queries-content">
      <div class="queries-header">
        <v-icon class="mr-2" color="primary" size="20">mdi-trending-up</v-icon>
        <h3 class="queries-title">Top Searches This Week</h3>
      </div>

      <div class="queries-grid">
        <!-- Left column: queries 1-5 -->
        <div class="queries-column">
          <div v-for="(queryData, index) in leftColumnQueries" :key="queryData.query" class="query-item">
            <div class="query-rank">#{{ index + 1 }}</div>
            <div class="query-text">{{ queryData.query }}</div>
            <v-btn color="primary" variant="outlined" size="small" @click="tryQuery(queryData.query)"
              prepend-icon="mdi-magnify" class="try-btn">
              Try
            </v-btn>
          </div>
        </div>

        <!-- Right column: queries 6-10 -->
        <div class="queries-column">
          <div v-for="(queryData, index) in rightColumnQueries" :key="queryData.query" class="query-item">
            <div class="query-rank">#{{ index + 6 }}</div>
            <div class="query-text">{{ queryData.query }}</div>
            <v-btn color="primary" variant="outlined" size="small" @click="tryQuery(queryData.query)"
              prepend-icon="mdi-magnify" class="try-btn">
              Try
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-state">
      <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
      <span class="error-text">Failed to load popular queries</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import type { TopQuery } from '~/models/topQueryModel';

const router = useRouter();

const { data: topQueries, isLoading, error } = useQuery({
  queryKey: [
    'cache',
    'topQueries',
  ],
  queryFn: async () => {
    const response = await fetch('/api/cache/top');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json() as Promise<TopQuery[]>;
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Split queries into left and right columns
const leftColumnQueries = computed(() => {
  return topQueries.value?.slice(0, 5) || [];
});

const rightColumnQueries = computed(() => {
  return topQueries.value?.slice(5, 10) || [];
});

function tryQuery(query: string) {
  // Navigate to search page with the current query
  router.push({
    name: 'search',
    query: {
      query,
    },
  });
}
</script>

<style scoped lang="sass">
.top-queries-container
  width: 100%
  max-width: 768px
  margin: 0 auto

.top-queries-content
  border-radius: 16px
  padding: 20px
  backdrop-filter: blur(10px)
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8))
  border: 1px solid rgba(147, 114, 255, 0.2)

.queries-header
  display: flex
  align-items: center
  margin-bottom: 16px

.queries-title
  color: white
  font-size: 1.3rem
  font-weight: 600
  margin: 0

.queries-grid
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 16px

  @media (max-width: 768px)
    grid-template-columns: 1fr
    gap: 8px

.queries-column
  display: flex
  flex-direction: column
  gap: 8px

.query-item
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 16px
  border-radius: 12px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.1), rgba(147, 114, 255, 0.05))
  border: 1px solid rgba(147, 114, 255, 0.2)
  cursor: pointer
  transition: all 0.3s ease

  &:hover
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.2), rgba(147, 114, 255, 0.1))
    border-color: rgba(147, 114, 255, 0.4)
    transform: translateY(-2px)
    box-shadow: 0 4px 12px rgba(147, 114, 255, 0.3)

.query-rank
  display: flex
  align-items: center
  justify-content: center
  width: 24px
  height: 24px
  border-radius: 50%
  background-color: black
  color: white
  font-size: 12px
  font-weight: 600
  flex-shrink: 0

.query-text
  color: white
  font-size: 0.95rem
  font-weight: 500
  flex: 1
  line-height: 1.2

  @media (max-width: 768px)
    font-size: 0.9rem

.try-btn
  min-width: 50px !important
  font-size: 0.8rem !important

.error-state
  display: flex
  align-items: center
  justify-content: center
  padding: 16px
  color: rgba(255, 255, 255, 0.7)

.error-text
  font-size: 0.9rem
</style>