<template>
  <!-- Background Image -->
  <div v-if="profileIconUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${profileIconUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Back Button and Header -->
    <div class="mb-6">
      <NuxtLink to="/lists">
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" label="Back to Lists" class="mb-4" />
      </NuxtLink>

      <div v-if="list">
        <h1 class="text-3xl font-bold mb-2">{{ list.name }}</h1>
        <p v-if="list.description" class="text-gray-600 dark:text-gray-400 mb-4">{{ list.description }}</p>

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
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useUserProfile } from '~/composables/useUserProfile'
import { useClipboard } from '@vueuse/core'
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer'
import { useToast } from '#imports'
import Card from '~/components/Card.vue'

const route = useRoute()
const listId = route.params.id as string
const toast = useToast()
const { copy } = useClipboard()

const { fetchUserLists, getListItems } = useCardLists()
const { userProfile, profileIconUrl } = useUserProfile()

const list = ref<any>(null)
const cards = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const totalPrice = computed(() => {
  if (!cards.value || cards.value.length === 0) return 0
  return cards.value.reduce((sum, card) => {
    const price = card.card_data?.prices?.usd
    return sum + (price ? parseFloat(price) : 0)
  }, 0)
})

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

onMounted(() => {
  if (!userProfile.value) {
    navigateTo('/')
  } else {
    loadListAndCards()
  }
})
</script>
