<template>
  <div class="mb-2">
    <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center">
      Try An Example Query:
    </h2>
    <ExampleQueriesSkeleton v-if="isLoading" />

    <div
      v-else-if="results && results.cards.length > 0"
      class="example-content"
    >
      <!-- Query display and TRY IT button -->
      <div class="query-header">
        <div>
          <UIcon name="i-lucide-lightbulb" class="mr-2" color="primary" />
          <span class="query-value">"{{ results.query }}"</span>
        </div>
        <div class="button-group">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="loadRandomExample"
            :loading="isLoading"
            size="sm"
            class="cursor-pointer"
            aria-label="Load another example query"
          />
          <UButton
            color="primary"
            variant="outline"
            @click="tryQuery"
            icon="i-lucide-search"
            class="cursor-pointer"
          >
            TRY
          </UButton>
        </div>
      </div>
      <!-- Horizontal scrolling results -->
      <div class="card-scroll-track">
        <div
          v-for="(card, i) in results.cards"
          :key="i"
          class="card-scroll-item"
        >
          <Card :card="card" size="small" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExampleQueries } from '~/composables/useExampleQueries';

const router = useRouter();

const { results, isLoading, refetch } = useExampleQueries();

// Call refetch() to manually trigger the query again
function loadRandomExample() {
  refetch();
}

function tryQuery() {
  // Navigate to the Smart search page with the current example query.
  // We can't use a `name` here — search routes are nested under
  // `/search/[platform]/[type]/[[slug]]` and don't have a single
  // stable name; use the path directly.
  if (!results.value?.query) return;
  router.push({
    path: '/search/all/ai',
    query: {
      query: results.value.query,
    },
  });
}
</script>

<style scoped lang="sass">
.example-content
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

.query-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 6px
  flex-wrap: wrap

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

.card-scroll-track
  display: flex
  gap: 10px
  overflow-x: auto
  padding-bottom: 8px
  scroll-behavior: smooth
  -webkit-overflow-scrolling: touch
  scrollbar-width: thin
  scrollbar-color: rgba(147, 114, 255, 0.4) transparent

  &::-webkit-scrollbar
    height: 4px

  &::-webkit-scrollbar-track
    background: transparent

  &::-webkit-scrollbar-thumb
    background: rgba(147, 114, 255, 0.4)
    border-radius: 2px

.card-scroll-item
  flex: 0 0 auto
  width: 160px
  @media (min-width: 768px)
    width: 180px
</style>
