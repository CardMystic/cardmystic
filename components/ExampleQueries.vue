<template>
  <div class="mb-2">
    <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center">Try An Example Query</h2>
    <div v-if="isLoading" class="example-content">
      <!-- Skeleton for query header -->
      <div class="query-header">
        <div class="flex items-center">
          <USkeleton class="h-5 w-5 mr-2" />
          <USkeleton class="h-6 w-48" />
        </div>
        <div class="button-group">
          <USkeleton class="h-8 w-8" :ui="{ rounded: 'rounded-md' }" />
          <USkeleton class="h-8 w-12" :ui="{ rounded: 'rounded-md' }" />
        </div>
      </div>

      <!-- Skeleton for carousel cards -->
      <div class="skeleton-carousel">
        <div v-for="index in 6" :key="`skeleton-${index}`" class="skeleton-card">
          <USkeleton class="h-32 w-full mb-2" :ui="{ rounded: 'rounded-lg' }" />
          <USkeleton class="h-3 w-3/4 mb-1" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </div>
    </div>

    <div v-else-if="results && results.cards.length > 0" class="example-content">
      <!-- Query display and TRY IT button -->
      <div class="query-header">
        <div>
          <UIcon name="i-lucide-lightbulb" class="mr-2" color="primary" />
          <span class="query-value">"{{ results.query }}"</span>
        </div>
        <div class="button-group">
          <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" @click="loadRandomExample"
            :loading="isLoading" size="sm" class="cursor-pointer" />
          <UButton color="primary" variant="outline" @click="tryQuery" icon="i-lucide-search" class="cursor-pointer">
            TRY
          </UButton>
        </div>
      </div>
      <!-- Horizontal scrolling results -->
      <UCarousel v-slot="{ item }" loop wheel-gestures :auto-scroll="{ speed: 1 }" :items="results.cards" :ui="{
        item: 'flex-[1_0_20%] max-w-[180px] min-w-[155px] shrink-0'
      }">
        <Card :card="item" :normalization-context="allScores" size="small" />
      </UCarousel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query'
import { type ExampleQueryResponse } from '~/models/searchModel';
const router = useRouter();

// Computed property to get all scores for normalization context
const allScores = computed(() => results.value?.cards.map((r) => r.score || 0) || []);

const { data: results, isLoading, refetch } = useQuery({
  queryKey: [
    'search',
    'example',
  ],
  queryFn: async () => {
    const response = await fetch('/api/search/example', {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json() as Promise<ExampleQueryResponse>;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: true, // Enable lazy loading
  refetchOnWindowFocus: false,
});

// Call refetch() to manually trigger the query again
function loadRandomExample() {
  refetch();
}

function tryQuery() {
  // Navigate to search page with the current query
  router.push({
    name: 'search',
    query: {
      query: results.value?.query,
    },
  });
}
</script>

<style scoped lang="sass">
.example-content
  border-radius: 24px
  padding: 16px
  backdrop-filter: blur(20px) saturate(180%)
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
  border: 1px solid rgba(147, 114, 255, 0.3)
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)
  position: relative

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))
    pointer-events: none

.query-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 6px
  flex-wrap: wrap

.skeleton-carousel
  display: flex
  gap: 12px
  overflow-x: hidden
  padding: 4px 0

.skeleton-card
  flex: 0 0 155px
  min-width: 155px
  max-width: 180px
  padding: 8px
  border-radius: 8px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(147, 114, 255, 0.02))
  border: 1px solid rgba(147, 114, 255, 0.1)

.button-group
  display: flex
  align-items: center
  gap: 12px
  flex-shrink: 0

.query-value
  font-size: 16px
  font-weight: bold
  font-style: italic
  @media (max-width: 768px)
    font-size: 12px
</style>