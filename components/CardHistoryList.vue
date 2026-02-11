<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoadingHistory || isLoadingCards" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="historyError || cardsError" class="text-center py-12">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
      <p class="text-red-500 mb-2 text-lg font-semibold">Error loading card history</p>
      <p class="text-gray-500">{{ historyError?.message || cardsError }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="safeCards.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-clock" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-500 text-lg mb-4">No recently viewed cards</p>
      <p class="text-gray-400 text-sm">Cards you view will appear here</p>
    </div>

    <!-- Cards Grid -->
    <div v-else>
      <!-- Clear All Button -->
      <div class="flex justify-end mb-4">
        <UButton icon="i-lucide-trash-2" color="error" variant="outline" label="Clear All" @click="confirmClearAll" />
      </div>

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

    <!-- Clear All Confirmation Modal -->
    <UModal v-model:open="isClearAllModalOpen" title="Clear All Card History">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all card history? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="isClearAllModalOpen = false"
              :disabled="clearAllLoading" />
            <UButton color="error" variant="solid" label="Clear All" :loading="clearAllLoading"
              @click="handleClearAll" />
          </div>
        </div>
      </template>
    </UModal>
  </div>

</template>

<script setup lang="ts">
import Card from '~/components/Card.vue'
import { computed, ref } from 'vue'
import { useCardsByIds } from '~/composables/useCards'
import { useCardHistory } from '~/composables/useCardHistory'
import { useToast } from '#imports'

const { cardHistory, isLoadingHistory, historyError, clearAllHistoryMutation } = useCardHistory()
const toast = useToast()

const showAll = ref(false)
const isClearAllModalOpen = ref(false)
const clearAllLoading = computed(() => clearAllHistoryMutation.isPending.value)

const confirmClearAll = () => {
  isClearAllModalOpen.value = true
}

const handleClearAll = async () => {
  try {
    await clearAllHistoryMutation.mutateAsync()
    toast.add({
      title: 'Card history cleared',
      icon: 'i-lucide-check-circle'
    })
    isClearAllModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error clearing history',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}

// Get unique card IDs from history
const cardIds = computed(() => {
  if (!cardHistory.value || cardHistory.value.length === 0) return []
  return [...new Set(cardHistory.value.map(h => h.card_id).filter(Boolean))] as string[]
})

// Fetch card details from backend using TanStack Query
const { cards, isLoading: isLoadingCards, error: fetchError } = useCardsByIds(cardIds, 'card-history-details')

const cardsError = computed(() => fetchError.value?.message || '')

// Always use an array for all card usages
const safeCards = computed(() => Array.isArray(cards.value) ? cards.value : [])

const displayedCards = computed(() => {
  if (showAll.value) return safeCards.value
  return safeCards.value.slice(0, 10)
})
</script>
