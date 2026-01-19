<template>
  <!-- Banner Background Image -->
  <div v-if="bannerImageUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
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

    <!-- Back Button and Actions -->
    <div class="mb-6">
      <NuxtLink to="/lists">
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" label="Back to Lists" class="mb-4" />
      </NuxtLink>

      <div v-if="list">
        <!-- Action Buttons -->
        <div class="flex gap-2 flex-wrap">
          <UButton icon="i-lucide-copy" color="primary" variant="outline" label="Copy Names" @click="copyCardNames"
            :disabled="!cards || cards.length === 0" />
          <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid"
            :label="`Buy on TCGPlayer ($${totalPrice.toFixed(2)})`" @click="openMassEntry"
            :disabled="!cards || cards.length === 0" />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <UButton @click="loadListAndCards">Try Again</UButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="!cards || cards.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-500 text-lg">No cards in this list yet</p>
    </div>

    <!-- Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <Card v-for="card in cards" :key="card.id" :card="card" :show-card-info="true" :hide-progress-bar="true"
        :hide-thumbs-down-button="true" />
    </div>
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
import Card from '~/components/Card.vue'
import { refDebounced } from '@vueuse/core'

const route = useRoute()
const listId = route.params.id as string
const toast = useToast()
const { copy } = useClipboard()

const { fetchUserLists, getListItems, updateListAvatar } = useCardLists()
const { userProfile, fetchUser } = useUserProfile()

const list = ref<any>(null)
const cards = ref<any[]>([])
const loading = ref(true)
const error = ref('')

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
  return cards.value.reduce((sum, card) => {
    const price = card.card_data?.prices?.usd
    return sum + (price ? parseFloat(price) : 0)
  }, 0)
})

const updateBannerImage = async () => {
  if (!selectedBannerCard.value || !list.value) return

  bannerUpdateLoading.value = true

  const { error: updateError } = await updateListAvatar(listId, selectedBannerCard.value)

  bannerUpdateLoading.value = false

  if (updateError) {
    toast.add({
      title: 'Error updating banner',
      description: updateError.message,
      color: 'error'
    })
  } else {
    list.value.avatar_card_name = selectedBannerCard.value
    toast.add({
      title: 'Banner updated!',
      icon: 'i-lucide-check'
    })
    isEditBannerModalOpen.value = false
  }
}

function copyCardNames() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.map(card => card.card_data.name).join('\n')
  copy(names)
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check'
  })
}

function openMassEntry() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.map(card => card.card_data.name)
  const url = getMassEntryAffiliateLink(names)
  window.open(url, '_blank', 'noopener,noreferrer')
}

const loadListAndCards = async () => {
  loading.value = true
  error.value = ''

  // Fetch list details
  const { data: listsData, error: listsError } = await fetchUserLists()
  if (listsError) {
    error.value = listsError.message
    loading.value = false
    return
  }

  list.value = listsData?.find((l: any) => l.id === listId)

  if (!list.value) {
    error.value = 'List not found'
    loading.value = false
    return
  }

  // Fetch list items (card IDs)
  const { data: itemsData, error: itemsError } = await getListItems(listId)
  if (itemsError) {
    error.value = itemsError.message
    loading.value = false
    return
  }

  // Fetch card details from Scryfall
  if (itemsData && itemsData.length > 0) {
    const cardIds = itemsData.map((item: any) => item.card_id)

    try {
      const cardPromises = cardIds.map((id: string) =>
        $fetch(`https://api.scryfall.com/cards/${id}`)
      )
      const cardsData = await Promise.all(cardPromises)

      // Wrap cards in the format expected by Card component
      cards.value = cardsData.map((cardData: any) => ({
        card_data: cardData,
        score: undefined
      }))
    } catch (err) {
      error.value = 'Failed to load card details'
      console.error('Error fetching cards:', err)
    }
  }

  loading.value = false
}

onMounted(async () => {
  await fetchUser()

  if (!userProfile.value) {
    navigateTo('/')
  } else {
    loadListAndCards()
  }
})
</script>
