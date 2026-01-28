<template>
  <div>
    <h2 class="section-title">Where You Left Off</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Searches -->
      <div class="recent-section">
        <h3 class="subsection-title">
          <UIcon name="i-lucide-search" class="inline-block" />
          Recent Searches
        </h3>
        <div v-if="recentSearches.length > 0" class="recent-search-container space-y-2 flex justify-center flex-col">
          <NuxtLink v-for="search in recentSearches" :key="search.id" :to="search.url" class="recent-item group">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-clock" class="text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="search-query truncate">{{ search.query }}</p>
                <p class="search-meta">{{ formatRelativeTime(search.timestamp) }}</p>
              </div>
              <UIcon name="i-lucide-arrow-right" class="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </NuxtLink>
        </div>
        <p v-else class="empty-state">No recent searches</p>
        <div class="mt-4">
          <NuxtLink to="/history?tab=search">
            <UButton color="primary" variant="outline" class="w-full">
              See More
            </UButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Cards -->
      <div class="recent-section">
        <h3 class="subsection-title">
          <UIcon name="i-lucide-layers" class="inline-block" />
          Recent Cards
        </h3>
        <div v-if="isLoadingCards" class="grid grid-cols-3 gap-2">
          <USkeleton v-for="i in 3" :key="`card-skeleton-${i}`" class="aspect-[5/7] rounded-lg" />
        </div>
        <div v-else-if="cardsError" class="text-center py-8">
          <p class="text-red-500 text-sm">Error loading cards</p>
        </div>
        <div v-else-if="displayedCards.length > 0" class="grid grid-cols-3 gap-2">
          <CardSimple v-for="card in displayedCards" :key="card.id" :card="card" />
        </div>
        <p v-else class="empty-state">No recent cards viewed</p>
        <div class="mt-4">
          <NuxtLink to="/history?tab=cards">
            <UButton color="primary" variant="outline" class="w-full">
              See More
            </UButton>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchHistory } from '~/composables/useSearchHistory';
import { useCardHistory } from '~/composables/useCardHistory';
import { useQuery } from '@tanstack/vue-query';
import { formatRelativeTime } from '~/utils/dateFormatter';
import CardSimple from '~/components/CardSimple.vue';

const { searchHistory } = useSearchHistory();
const { cardHistory } = useCardHistory();

interface SearchItem {
  id: string;
  query: string;
  url: string;
  timestamp: number;
}

const recentSearches = computed<SearchItem[]>(() => {
  if (!searchHistory.value) return [];

  return searchHistory.value.slice(0, 3).map(search => ({
    id: search.id,
    query: search.query,
    url: buildSearchUrl(search),
    timestamp: new Date(search.created_at).getTime()
  }));
});

// Get unique card IDs from history
const cardIds = computed<string[]>(() => {
  if (!cardHistory.value || cardHistory.value.length === 0) return [];
  return [...new Set(cardHistory.value.slice(0, 4).map(h => h.card_id).filter(Boolean))];
});

// Fetch card details using TanStack Query
const { data: cards, isLoading: isLoadingCards, error: fetchError } = useQuery({
  queryKey: ['recent-cards-details', cardIds],
  queryFn: async () => {
    const ids = cardIds.value;
    if (ids.length === 0) return [];

    const cardsData = await $fetch('/api/cards/cards-by-ids', {
      method: 'POST',
      body: { cardIds: ids }
    });

    return cardsData || [];
  },
  enabled: computed(() => cardIds.value.length > 0),
  staleTime: 1000 * 60 * 10, // 10 minutes cache
});

const cardsError = computed(() => fetchError.value?.message || '');

const displayedCards = computed(() =>
  (cards.value || []).slice(0, 3).map((card: any) => ({
    card_data: card,
    card_name: card.name
  }))
);

function buildSearchUrl(search: any): string {
  const searchType = search.search_type || 'keyword';
  const basePath = `/search/${searchType}`;
  const params = new URLSearchParams();

  if (search.query) {
    if (searchType === 'similarity') {
      params.set('card_name', search.query);
    } else {
      params.set('query', search.query);
    }
  }

  if (search.filters) {
    params.set('filters', JSON.stringify(search.filters));
  }

  return `${basePath}?${params.toString()}`;
}
</script>

<style scoped lang="sass">
.recent-search-container
  min-height: 247px
  @media (max-width: 1023px)
    min-height: auto
  
.section-title
  font-size: 2rem
  font-weight: 700
  margin-bottom: 1.5rem
  text-align: center
  
.recent-section
  padding: 1.5rem
  border-radius: 1rem
  border: 1px solid rgba(147, 114, 255, 0.2)
  backdrop-filter: blur(20px) saturate(180%)
  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

.subsection-title
  font-size: 1.25rem
  font-weight: 600
  margin-bottom: 1rem
  display: flex
  align-items: center
  gap: 0.5rem

.recent-item
  display: block
  padding: 0.8rem
  border-radius: 0.5rem
  transition: all 0.2s
  cursor: pointer
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.1), rgba(147, 114, 255, 0.05))
  border: 1px solid rgba(147, 114, 255, 0.2)

  &:hover
    background: rgba(147, 114, 255, 0.1)
    transform: translateX(4px)

  @media (prefers-color-scheme: dark)
    &:hover
      background: rgba(147, 114, 255, 0.15)

.search-query
  font-weight: 500
  font-size: 0.95rem
  line-height: 1.3

.search-meta
  font-size: 0.8rem
  opacity: 0.7
  margin-top: 0.25rem

.empty-state
  text-align: center
  padding: 2rem
  opacity: 0.6
  font-style: italic
</style>
