<template>
  <!-- Loading State -->
  <div v-if="loading || isLoadingCards" class="flex justify-center py-12">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
  </div>

  <!-- Error State -->
  <div v-else-if="error || cardsError" class="text-center py-12">
    <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
    <p class="text-red-500 mb-2 text-lg font-semibold">Error loading card history</p>
    <p class="text-gray-500">{{ error || cardsError }}</p>
  </div>

  <!-- Empty State -->
  <div v-else-if="safeCards.length === 0" class="text-center py-12">
    <UIcon name="i-lucide-clock" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
    <p class="text-gray-500 text-lg mb-4">No recently viewed cards</p>
    <p class="text-gray-400 text-sm">Cards you view will appear here</p>
  </div>

  <!-- Cards Grid -->
  <div v-else>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <Card v-for="card in displayedCards" :key="card.id"
        :card="{ card_name: card.name, card_data: card, score: undefined }" :show-card-info="true"
        :hide-progress-bar="true" :hide-thumbs-down-button="true" />
    </div>

    <!-- Show More Button -->
    <div v-if="safeCards.length > 10 && !showAll" class="flex justify-center pt-6">
      <UButton @click="showAll = true" color="primary" variant="outline" size="lg">
        Show More ({{ safeCards.length - 10 }} more)
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from '~/components/Card.vue'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
const config = useRuntimeConfig();

const props = defineProps<{
  cardHistory: any[]
  loading: boolean
  error: string
}>()

const showAll = ref(false)

// Get unique card IDs from history
const cardIds = computed(() => {
  if (!props.cardHistory || props.cardHistory.length === 0) return []
  return [...new Set(props.cardHistory.map(h => h.card_id).filter(Boolean))]
})

// Fetch card details from backend using TanStack Query
const { data: cards, isLoading: isLoadingCards, error: fetchError } = useQuery({
  queryKey: ['card-history-details', cardIds],
  queryFn: async () => {
    if (cardIds.value.length === 0) return []

    const cardsData = await $fetch(`${config.public.backendUrl}/cards/cards-by-ids`, {
      method: 'POST',
      body: { cardIds: cardIds.value }
    })

    return cardsData || []
  },
  enabled: computed(() => cardIds.value.length > 0),
  staleTime: 1000 * 60 * 10, // 10 minutes cache
})

const cardsError = computed(() => fetchError.value?.message || '')

// Always use an array for all card usages
const safeCards = computed(() => Array.isArray(cards.value) ? cards.value : [])

const displayedCards = computed(() => {
  if (showAll.value) return safeCards.value
  return safeCards.value.slice(0, 10)
})
</script>
