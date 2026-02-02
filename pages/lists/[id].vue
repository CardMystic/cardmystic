<template>
  <!-- Banner Background Image -->
  <div v-if="bannerImageUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${bannerImageUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Banner Section -->
    <div v-if="list" class="mb-6 relative group cursor-pointer">
      <!-- Banner Image -->
      <div class="relative h-48 md:h-64 rounded-lg overflow-hidden shadow-xl">
        <div v-if="bannerImageUrl" class="absolute inset-0 bg-cover bg-center"
          :style="{ backgroundImage: `url(${bannerImageUrl})` }">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div v-else class="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600"></div>

        <!-- Banner Content -->
        <div class="absolute bottom-0 left-0 right-0 p-6 ">
          <div v-if="isEditingTitle" class="mb-2">
            <input v-model="editedTitle" @blur="updateListName" @keyup.enter="updateListName"
              @keyup.esc="isEditingTitle = false"
              class="text-3xl md:text-4xl font-bold text-white bg-black/50 px-2 py-1 rounded w-full outline-none focus:bg-black/70"
              autofocus />
          </div>
          <h1 v-else @click="startEditingTitle"
            class="text-3xl md:text-4xl font-bold text-white mb-2 cursor-pointer hover:opacity-80 transition-opacity">
            {{ list.name }}
          </h1>

          <div v-if="isEditingDescription" class="mb-2">
            <textarea v-model="editedDescription" @blur="updateListDescription"
              @keyup.esc="isEditingDescription = false"
              class="text-gray-200 text-lg bg-black/50 px-2 py-1 rounded w-full outline-none focus:bg-black/70 resize-none"
              rows="2" autofocus />
          </div>
          <p v-else-if="list.description" @click="startEditingDescription"
            class="text-gray-200 text-lg cursor-pointer hover:opacity-80 transition-opacity">
            {{ list.description }}
          </p>
          <p v-else @click="startEditingDescription"
            class="text-gray-400 text-lg italic cursor-pointer hover:opacity-80 transition-opacity">
            Click to add description
          </p>
        </div>

        <!-- Edit Icon (visible on hover) -->
        <button @click="isEditBannerModalOpen = true"
          class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-3"
          aria-label="Change banner image">
          <UIcon name="i-lucide-pencil" class="w-5 h-5 text-white" />
        </button>
      </div>
    </div>

    <!-- Banner Skeleton -->
    <div v-else class="mb-6">
      <USkeleton class="h-48 md:h-64 rounded-lg" />
    </div>

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
          placeholder="Search for a card to add..." icon="i-lucide-plus" class="flex-1"
          @update:model-value="handleAddCard" />
      </div>
    </div>

    <!-- Cards Results -->
    <ListSearchResults :isLoading="loading" :searchResults="sortedCards" :queryParam="null" :skeletonCount="20"
      :isList="true" :listId="listId" helpText="Your list is loading..." @removeCard="handleRemoveCard" />
  </div>

  <!-- Edit Banner Modal -->
  <UModal v-model:open="isEditBannerModalOpen" title="Change Banner Image"
    description="Select a card to use as the banner image for this list">
    <template #content>
      <div class="p-4 space-y-4">
        <!-- Card Search and Selection (autocomplete) -->
        <USelectMenu v-model="selectedBannerCard" v-model:search-term="searchTerm"
          :loading="cardsStatus === 'pending' || bannerUpdateLoading" :items="filteredBannerCards"
          placeholder="Search for a card..." icon="i-lucide-search" class="w-full" />
        <p class="text-xs text-gray-500 dark:text-gray-400">Search for an MTG card to use as the banner image</p>

        <!-- Preview -->
        <div v-if="previewBannerUrl" class="mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
          <div class="h-32 rounded-lg overflow-hidden">
            <div class="h-full bg-cover bg-center" :style="{ backgroundImage: `url(${previewBannerUrl})` }"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isEditBannerModalOpen = false" />
          <UButton color="primary" variant="solid" label="Save" :loading="bannerUpdateLoading"
            :disabled="!selectedBannerCard" @click="updateBannerImage" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { useCardLists } from '~/composables/useCardLists'
import { useClipboard } from '@vueuse/core'
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer'
import { useToast } from '#imports'
import ListSearchResults from '~/components/ListSearchResults.vue'
import Sort from '~/components/search/Sort.vue'
import { refDebounced } from '@vueuse/core'
import { sortSearchResults } from '~/utils/sort'
import { useQuery } from '@tanstack/vue-query'

const route = useRoute()
const listId = route.params.id as string
const toast = useToast()
const { copy } = useClipboard()

const { userLists, isLoadingLists, useListItems, updateListAvatarMutation, updateListMutation, removeCardFromListMutation, addCardsToListMutation } = useCardLists()

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
const { data: cardsData, isLoading: isLoadingCards } = useQuery({
  // Include cardIds in the queryKey so it refetches when the list items change
  queryKey: computed(() => ['list-cards', listId, cardIds.value]),
  queryFn: async () => {
    if (cardIds.value.length === 0) return []

    const cardPromises = cardIds.value.map((id: string) =>
      $fetch(`https://api.scryfall.com/cards/${id}`)
    )
    const cardsData = await Promise.all(cardPromises)

    return cardsData.map((cardData: any) => ({
      card_name: cardData.name,
      card_data: cardData,
      score: undefined
    }))
  },
  enabled: computed(() => cardIds.value.length > 0),
  staleTime: 1000 * 60 * 10, // 10 minutes
})

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

// Banner state
const isEditBannerModalOpen = ref(false)
const selectedBannerCard = ref('')
const searchTerm = ref('')
const debouncedSearchTerm = refDebounced(searchTerm, 150)
const bannerUpdateLoading = ref(false)

// Load card names for banner selection
const { data: rawCards, status: cardsStatus } = await useFetch('/card-names.min.json', {
  key: 'banner-card-names',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
})

// Filter cards based on search
const filteredBannerCards = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (selectedBannerCard.value) {
      return [selectedBannerCard.value]
    }
    return []
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase()
  const filtered: string[] = []

  if (selectedBannerCard.value) {
    filtered.push(selectedBannerCard.value)
  }

  for (let i = 0; i < rawCards.value.length && filtered.length < 100; i++) {
    const card = rawCards.value[i]
    if (card.toLowerCase().includes(searchLower) && !filtered.includes(card)) {
      filtered.push(card)
    }
  }

  return filtered
})

// Get banner image URL from avatar_card_name only
const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name
  if (!cardName) return null

  // Scryfall's card image API
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`
})

// Preview URL for modal
const previewBannerUrl = computed(() => {
  if (!selectedBannerCard.value) return null
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(selectedBannerCard.value)}&format=image&version=art_crop`
})

const totalPrice = computed(() => {
  if (!cards.value || cards.value.length === 0) return 0
  return cards.value.reduce((sum: number, card: any) => {
    const price = card.card_data?.prices?.usd
    return sum + (price ? parseFloat(price) : 0)
  }, 0)
})

const updateBannerImage = async () => {
  if (!selectedBannerCard.value || !list.value) return

  try {
    await updateListAvatarMutation.mutateAsync({
      listId: list.value.id,
      cardName: selectedBannerCard.value
    })
    toast.add({
      title: 'Banner updated!',
      icon: 'i-lucide-check'
    })
    isEditBannerModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error updating banner',
      description: error.message,
      color: 'error'
    })
  }
}

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

// Editable title and description state
const isEditingTitle = ref(false)
const isEditingDescription = ref(false)
const editedTitle = ref('')
const editedDescription = ref('')

const updateListName = async () => {
  if (!list.value || !editedTitle.value.trim()) {
    isEditingTitle.value = false
    return
  }

  try {
    if (editedTitle.value.trim() === list.value.name) {
      isEditingTitle.value = false
      return
    }
    await updateListMutation.mutateAsync({
      listId: list.value.id,
      updates: { name: editedTitle.value.trim() }
    })
    toast.add({
      title: 'List name updated!',
      icon: 'i-lucide-check'
    })
    isEditingTitle.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error updating list name',
      description: error.message,
      color: 'error'
    })
  }
}

const updateListDescription = async () => {
  if (!list.value) {
    isEditingDescription.value = false
    return
  }

  try {
    if (editedDescription.value.trim() === (list.value.description || '')) {
      isEditingDescription.value = false
      return
    }
    await updateListMutation.mutateAsync({
      listId: list.value.id,
      updates: { description: editedDescription.value.trim() || undefined }
    })
    toast.add({
      title: 'List description updated!',
      icon: 'i-lucide-check'
    })
    isEditingDescription.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error updating list description',
      description: error.message,
      color: 'error'
    })
  }
}

const startEditingTitle = () => {
  if (list.value) {
    editedTitle.value = list.value.name
    isEditingTitle.value = true
  }
}

const startEditingDescription = () => {
  if (list.value) {
    editedDescription.value = list.value.description || ''
    isEditingDescription.value = true
  }
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
