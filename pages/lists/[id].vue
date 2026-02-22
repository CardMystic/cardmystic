<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <CardListBanner :list="list" :is-loading="isLoadingLists" />

    <!-- Back Button and Actions -->
    <div class="mb-6">
      <NuxtLink to="/lists">
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" label="Back to Lists"
          class="mb-4 cursor-pointer" />
      </NuxtLink>

      <div v-if="list" class="flex flex-col sm:flex-row sm:justify-between gap-2">
        <div class="flex gap-2 flex-wrap items-center">
          <UButton icon="i-lucide-copy" color="primary" variant="outline" label="Copy Names" @click="copyCardNames"
            :disabled="!cards || cards.length === 0" class="cursor-pointer" />
          <UButton icon="i-lucide-list-plus" color="primary" variant="outline" label="Bulk Add"
            @click="isBulkAddModalOpen = true" class="cursor-pointer" />
          <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid"
            :label="`Buy on TCGPlayer ($${totalPrice.toFixed(2)})`" @click="openMassEntry"
            :disabled="!cards || cards.length === 0" class="cursor-pointer" />
        </div>
        <!-- Sort Component -->
        <div v-if="cards && cards.length > 0" class="sm:self-end mt-4 sm:mt-0 ">
          <Sort @sort="handleSort" />
        </div>
      </div>
    </div>

    <!-- Add Card Search -->
    <div v-if="list" class="mb-6">
      <div class="flex gap-2">
        <USelectMenu v-model="selectedCardToAdd" v-model:search-term="addCardSearchTerm"
          :loading="cardsStatus === 'pending' || addCardLoading" :items="filteredAddCards"
          placeholder="Search for a card to add..." icon="i-lucide-plus" class="flex-1 cursor-pointer"
          @update:model-value="handleAddCard" />
      </div>
    </div>

    <!-- Cards Results -->
    <CardListResults :isLoading="loading" :cards="sortedCards" :skeletonCount="20" @removeCard="handleRemoveCard" />
  </div>

  <!-- Bulk Add Modal -->
  <BulkAddCardsModal v-model:open="isBulkAddModalOpen" :list-id="listId" />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { useCardLists } from '~/composables/useCardLists'
import { useClipboard } from '@vueuse/core'
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer'
import { useToast } from '#imports'
import { refDebounced } from '@vueuse/core'
import { sortSearchResults } from '~/utils/sort'

const route = useRoute()
const listId = route.params.id as string
const toast = useToast()
const { copy } = useClipboard()

const {
  userLists,
  isLoadingLists,
  useListItems,
  useListCards,
  removeCardFromListMutation,
  addCardsToListMutation,
} = useCardLists()

const list = computed(() => userLists.value?.find((l: any) => l.id === listId))

// Add card state
const selectedCardToAdd = ref('')
const addCardSearchTerm = ref('')
const debouncedAddCardSearchTerm = refDebounced(addCardSearchTerm, 150)
const addCardLoading = ref(false)
const error = ref('')

// Use TanStack Query for list items
const { data: listItems, isLoading: isLoadingItems } = useListItems(listId)

// Computed card IDs from list items - used as dependency for card details query
const cardIds = computed(() => listItems.value?.map((item: any) => item.card_id) || [])

// Use TanStack Query to fetch card details
const { data: cardsData, isLoading: isLoadingCards } = useListCards(listId, cardIds)

const cards = computed(() => cardsData.value || [])

const loading = computed(() => isLoadingLists.value || isLoadingItems.value || isLoadingCards.value)

// Sorting state
const sortBy = ref<string | undefined>(undefined)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Handle sort changes
function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

// Handle removing a card from the list
async function handleRemoveCard(cardId: string) {
  try {
    if (!listId || !cardId) {
      throw new Error('Cannot remove card: missing listId or cardId');
    }
    await removeCardFromListMutation.mutateAsync({ listId, cardId });
    toast.add({
      title: 'Card removed from list',
      icon: 'i-lucide-check'
    });
  } catch (error: any) {
    toast.add({
      title: 'Error removing card',
      description: error.message,
      color: 'error'
    });
  }
}

// Computed sorted results - skip the first card (we're already viewing it on the page)
const sortedCards = computed(() => {
  if (!cards.value || cards.value.length === 0) {
    return [];
  }

  // Skip the first card (the current card being viewed)
  return sortSearchResults(cards.value, sortBy.value, sortDirection.value) || [];
});


// Filter cards for add card autocomplete
const filteredAddCards = computed(() => {
  if (!debouncedAddCardSearchTerm.value || debouncedAddCardSearchTerm.value.length < 2) {
    return []
  }

  const searchLower = debouncedAddCardSearchTerm.value.toLowerCase()
  const filtered: string[] = []

  for (let i = 0; i < rawCards.value.length && filtered.length < 100; i++) {
    const card = rawCards.value[i]
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card)
    }
  }

  return filtered
})

// Handle adding a card to the list
async function handleAddCard(cardName: string) {
  if (!cardName || !list.value) return

  addCardLoading.value = true
  try {
    // First get the card ID from Scryfall
    const cardData: any = await $fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`)

    if (!cardData?.id) {
      throw new Error('Card not found')
    }

    await addCardsToListMutation.mutateAsync({
      listId: list.value.id,
      cardIds: [cardData.id]
    })

    toast.add({
      title: `Added ${cardName} to list`,
      icon: 'i-lucide-check'
    })

    // Clear the selection
    selectedCardToAdd.value = ''
    addCardSearchTerm.value = ''
  } catch (error: any) {
    toast.add({
      title: 'Error adding card',
      description: error.message,
      color: 'error'
    })
  } finally {
    addCardLoading.value = false
  }
}

// Bulk add state
const isBulkAddModalOpen = ref(false)

const { data: rawCards, status: cardsStatus } = await useFetch('/card-names.min.json', {
  key: 'banner-card-names',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
})

const totalPrice = computed(() => {
  if (!cards.value || cards.value.length === 0) return 0
  return cards.value.reduce((sum: number, card: any) => {
    const price = card.card_data?.prices?.usd
    return sum + (price ? parseFloat(price) : 0)
  }, 0)
})

function copyCardNames() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.map((card: any) => card.card_data.name).join('\n')
  copy(names)
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check'
  })
}

function openMassEntry() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.map((card: any) => card.card_data.name)
  const url = getMassEntryAffiliateLink(names)
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  // Check if list exists after data loads
  watch(list, (newList) => {
    if (!isLoadingLists.value && !newList) {
      error.value = 'List not found'
    }
  }, { immediate: true })
})
</script>
