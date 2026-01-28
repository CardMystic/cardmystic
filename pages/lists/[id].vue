<template>
  <!-- Banner Background Image -->
  <div v-if="bannerImageUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${bannerImageUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Banner Section -->
    <div v-if="list" class="mb-6 relative group">
      <!-- Banner Image -->
      <div class="relative h-48 md:h-64 rounded-lg overflow-hidden shadow-xl">
        <div v-if="bannerImageUrl" class="absolute inset-0 bg-cover bg-center"
          :style="{ backgroundImage: `url(${bannerImageUrl})` }">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div v-else class="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600"></div>

        <!-- Banner Content -->
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">{{ list.name }}</h1>
          <p v-if="list.description" class="text-gray-200 text-lg">{{ list.description }}</p>
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
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" label="Back to Lists" class="mb-4" />
      </NuxtLink>

      <div v-if="list" class="flex flex-row justify-between">
        <!-- Action Buttons -->
        <div class="flex gap-2 flex-wrap items-center">
          <UButton icon="i-lucide-copy" color="primary" variant="outline" label="Copy Names" @click="copyCardNames"
            :disabled="!cards || cards.length === 0" />
          <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid"
            :label="`Buy on TCGPlayer ($${totalPrice.toFixed(2)})`" @click="openMassEntry"
            :disabled="!cards || cards.length === 0" />
        </div>
        <!-- Sort Component -->
        <div v-if="cards && cards.length > 0">
          <Sort @sort="handleSort" />
        </div>
      </div>
    </div>

    <!-- Cards Results -->
    <ListSearchResults :isLoading="loading" :searchResults="sortedCards" :queryParam="null" :skeletonCount="20"
      helpText="Your list is loading..." />
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
import { useCardLists } from '~/composables/useCardLists'
import { useUserProfile } from '~/composables/useUserProfile'
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

const { userLists, isLoadingLists, useListItems, updateListAvatarMutation } = useCardLists()
const { userProfile, fetchUser } = useUserProfile()

const list = computed(() => userLists.value?.find((l: any) => l.id === listId))
const error = ref('')

// Use TanStack Query for list items
const { data: listItems, isLoading: isLoadingItems } = useListItems(listId)

// Use TanStack Query to fetch card details
const { data: cardsData, isLoading: isLoadingCards } = useQuery({
  queryKey: ['list-cards', listId],
  queryFn: async () => {
    if (!listItems.value || listItems.value.length === 0) return []

    const cardIds = listItems.value.map((item: any) => item.card_id)
    const cardPromises = cardIds.map((id: string) =>
      $fetch(`https://api.scryfall.com/cards/${id}`)
    )
    const cardsData = await Promise.all(cardPromises)

    return cardsData.map((cardData: any) => ({
      card_name: cardData.name,
      card_data: cardData,
      score: undefined
    }))
  },
  enabled: computed(() => (listItems.value?.length ?? 0) > 0),
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

// Computed sorted results - skip the first card (we're already viewing it on the page)
const sortedCards = computed(() => {
  if (!cards.value || cards.value.length === 0) {
    return [];
  }

  // Skip the first card (the current card being viewed)
  return sortSearchResults(cards.value, sortBy.value, sortDirection.value) || [];
});


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

// Get banner image URL from avatar_card_name or first card
const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name || (cards.value.length > 0 ? cards.value[0].card_data.name : null)
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

onMounted(async () => {
  await fetchUser()

  if (!userProfile.value) {
    navigateTo('/')
  }

  // Check if list exists after data loads
  watch(list, (newList) => {
    if (!isLoadingLists.value && !newList) {
      error.value = 'List not found'
    }
  }, { immediate: true })
})
</script>
