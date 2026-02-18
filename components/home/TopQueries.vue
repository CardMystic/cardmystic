<template>
  <div class="top-queries-container mt-2 mb-2">
    <TopQueriesSkeleton v-if="isLoading" />

    <div v-else-if="topQueries && topQueries.length > 0" class="top-queries-content">
      <div class="queries-header">
        <UIcon name="i-lucide-trending-up" class="mr-2 text-primary text-xl" />
        <h3 class="queries-title">Top Searches This Week</h3>
      </div>

      <div class="queries-grid">
        <!-- Left column: queries 1-5 -->
        <div class="queries-column">
          <div v-for="(queryData, index) in leftColumnQueries" :key="queryData.query" class="query-item">
            <div class="query-rank">#{{ index + 1 }}</div>
            <div class="query-text">{{ queryData.query }}</div>
            <UButton color="primary" variant="outline" size="sm" @click="tryQuery(queryData.query)"
              icon="i-lucide-search" class="try-btn cursor-pointer">
              Try
            </UButton>
          </div>
        </div>

        <!-- Right column: queries 6-10 -->
        <div class="queries-column">
          <div v-for="(queryData, index) in rightColumnQueries" :key="queryData.query" class="query-item">
            <div class="query-rank">#{{ index + 6 }}</div>
            <div class="query-text">{{ queryData.query }}</div>
            <UButton color="primary" variant="outline" size="sm" @click="tryQuery(queryData.query)"
              icon="i-lucide-search" class="try-btn cursor-pointer">
              Try
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-state">
      <UIcon name="i-lucide-alert-circle" class="mr-2 text-red-500" />
      <span class="error-text">Failed to load popular queries</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTopQueries } from '~/composables/useTopQueries';

const router = useRouter();

const { topQueries, isLoading, error } = useTopQueries();

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
    path: '/search',
    query: {
      query,
    },
  });
}
</script>

<style scoped lang="sass">
.top-queries-container
  width: 100%

.top-queries-content
  border-radius: 24px
  padding: 16px
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    pointer-events: none

    @media (prefers-color-scheme: light)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.06), rgba(255, 255, 255, 0.25))

    @media (prefers-color-scheme: dark)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))

.queries-header
  display: flex
  align-items: center
  margin-bottom: 16px

.queries-title
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