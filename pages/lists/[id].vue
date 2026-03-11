<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"></div>
    </div>

    <CardListBanner :list="list" :is-loading="isLoadingLists" />

    <!-- Actions + Add Card + Commander (single row) -->
    <div v-if="list" class="mb-2">
      <div class="flex gap-2 flex-wrap items-center">
        <UTooltip text="Copy card names">
          <UButton icon="i-lucide-copy" color="primary" variant="outline" @click="copyCardNames"
            :disabled="!cards || cards.length === 0" class="cursor-pointer" label="Copy" />
        </UTooltip>
        <UTooltip text="Bulk add cards">
          <UButton icon="i-lucide-list-plus" color="primary" variant="outline" @click="isBulkAddModalOpen = true"
            class="cursor-pointer" label="Bulk Add" />
        </UTooltip>
        <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid"
          :label="`Buy ($${totalPrice.toFixed(2)})`" @click="openMassEntry" :disabled="!cards || cards.length === 0"
          class="cursor-pointer" />
        <USelectMenu v-model="selectedCardToAdd" v-model:search-term="addCardSearchTerm"
          :loading="(!!addCardSearchTerm && cardsStatus === 'pending') || addCardLoading" :items="filteredAddCards"
          placeholder="Search for a card to add..." icon="i-lucide-plus" class="flex-1 min-w-45 cursor-pointer"
          @update:model-value="handleAddCard" />
      </div>
    </div>

    <!-- Deck Recommender -->
    <div v-if="list && cards && cards.length > 0" class="mb-2">
      <div class="flex gap-2 items-center">
        <UInput v-model="recommendDescription"
          placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations."
          icon="i-lucide-box" class="flex-1" :ui="{ base: 'text-sm h-8' }" size="sm" />
        <UButton icon="i-lucide-box" color="primary" variant="solid" label="Recommend" @click="goToRecommend"
          class="cursor-pointer h-8" size="sm" />
      </div>
    </div>

    <!-- Sort (centered) -->
    <div v-if="list && cards && cards.length > 0" class="mb-4 flex justify-center">
      <Sort @sort="handleSort" />
    </div>

    <!-- Cards Results -->
    <ClientOnly>
      <CardListResults :isLoading="loading" :cards="sortedCards" :skeletonCount="20"
        :commander-card-id="currentCommanderItem?.card_id" @removeCard="handleRemoveCard"
        @setCommander="handleSetCommander" @clearCommander="handleClearCommander" />
      <template #fallback>
        <div class="mt-3 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <CardSkeleton v-for="i in 20" :key="`skeleton-${i}`" :showCardInfo="true" />
        </div>
      </template>
    </ClientOnly>
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
  setCommanderMutation,
  clearCommanderMutation,
} = useCardLists()

const list = computed(() => userLists.value?.find((l: any) => l.id === listId))

// Banner background image URL
const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name
  if (!cardName) return null
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`
})

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

// Computed sorted results - commander always first, then sort rest
const sortedCards = computed(() => {
  if (!cards.value || cards.value.length === 0) {
    return [];
  }

  const commanderCardId = currentCommanderItem.value?.card_id
  if (commanderCardId) {
    const commander = cards.value.find((c: any) => c.card_data.id === commanderCardId)
    const rest = cards.value.filter((c: any) => c.card_data.id !== commanderCardId)
    const sortedRest = sortSearchResults(rest, sortBy.value, sortDirection.value) || []
    return commander ? [commander, ...sortedRest] : sortedRest
  }

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

// Recommend state
const recommendDescription = ref('')
const router = useRouter()

function goToRecommend() {
  if (!cards.value || cards.value.length === 0) return
  const decklist = cards.value.map((card: any) => card.card_data.name).join('\n')
  const query: Record<string, any> = {
    decklist,
    searchType: 'recommend',
  }
  if (recommendDescription.value.trim()) {
    query.description = recommendDescription.value.trim()
  }
  if (currentCommanderName.value) {
    query.commander = currentCommanderName.value
  }
  router.push({ path: '/search/recommend', query })
}

const { data: rawCards, status: cardsStatus } = useFetch('/card-names.min.json', {
  key: 'banner-card-names',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
})

// Commander autocomplete
const setCommanderLoading = ref(false)

// Find the current commander from list items
const currentCommanderItem = computed(() => {
  return listItems.value?.find((item: any) => item.is_commander === true)
})

const currentCommanderName = computed(() => {
  if (!currentCommanderItem.value || !cards.value) return null
  const commanderItem = currentCommanderItem.value
  const card = cards.value.find((c: any) => c.card_data.id === commanderItem.card_id)
  return card?.card_data?.name || null
})

async function handleSetCommander(commanderName: string) {
  if (!commanderName || !list.value) return

  setCommanderLoading.value = true
  try {
    await setCommanderMutation.mutateAsync({
      listId: list.value.id,
      commanderName,
    })

    toast.add({
      title: `${commanderName} set as commander`,
      icon: 'i-lucide-crown'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error setting commander',
      description: error.message,
      color: 'error'
    })
  } finally {
    setCommanderLoading.value = false
  }
}

async function handleClearCommander() {
  if (!list.value) return

  setCommanderLoading.value = true
  try {
    await clearCommanderMutation.mutateAsync(list.value.id)

    toast.add({
      title: 'Commander cleared',
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error clearing commander',
      description: error.message,
      color: 'error'
    })
  } finally {
    setCommanderLoading.value = false
  }
}

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
