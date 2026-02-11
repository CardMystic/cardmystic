<template>
  <!-- Banner Background Image -->
  <div v-if="bannerImageUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${bannerImageUrl})` }"></div>
  </div>

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
          <textarea v-model="editedDescription" @blur="updateListDescription" @keyup.esc="isEditingDescription = false"
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

  <!-- Edit Banner Modal -->
  <UModal v-model:open="isEditBannerModalOpen" title="Change Banner Image"
    description="Select a card to use as the banner image for this list">
    <template #content>
      <div class="p-4 space-y-4">
        <!-- Card Search and Selection (autocomplete) -->
        <USelectMenu v-model="selectedBannerCard" v-model:search-term="searchTerm"
          :loading="cardsStatus === 'pending' || bannerUpdateLoading" :items="filteredBannerCards"
          placeholder="Search for a card..." icon="i-lucide-search" class="w-full" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Search for an MTG card to use as the banner image
        </p>

        <!-- Preview -->
        <div v-if="previewBannerUrl" class="mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
          <div class="h-32 rounded-lg overflow-hidden">
            <div class="h-full bg-cover bg-center" :style="{ backgroundImage: `url(${previewBannerUrl})` }"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton class="cursor-pointer" color="neutral" variant="ghost" label="Cancel"
            @click="isEditBannerModalOpen = false" />
          <UButton class="cursor-pointer" color="primary" variant="solid" label="Save" :loading="bannerUpdateLoading"
            :disabled="!selectedBannerCard" @click="updateBannerImage" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { useCardLists } from '~/composables/useCardLists'
import { useToast } from '#imports'

const props = defineProps<{
  list: any | null | undefined
  isLoading: boolean
}>()

const toast = useToast()

const { updateListAvatarMutation, updateListMutation } = useCardLists()

// Banner state
const isEditBannerModalOpen = ref(false)
const selectedBannerCard = ref('')
const searchTerm = ref('')
const debouncedSearchTerm = refDebounced(searchTerm, 150)
const bannerUpdateLoading = ref(false)

// Editable title and description state
const isEditingTitle = ref(false)
const isEditingDescription = ref(false)
const editedTitle = ref('')
const editedDescription = ref('')

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
  const cardName = props.list?.avatar_card_name
  if (!cardName) return null

  // Scryfall's card image API
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`
})

// Preview URL for modal
const previewBannerUrl = computed(() => {
  if (!selectedBannerCard.value) return null
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(selectedBannerCard.value)}&format=image&version=art_crop`
})

const updateBannerImage = async () => {
  if (!selectedBannerCard.value || !props.list) return

  bannerUpdateLoading.value = true
  try {
    await updateListAvatarMutation.mutateAsync({
      listId: props.list.id,
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
  } finally {
    bannerUpdateLoading.value = false
  }
}

const updateListName = async () => {
  if (!props.list || !editedTitle.value.trim()) {
    isEditingTitle.value = false
    return
  }

  try {
    if (editedTitle.value.trim() === props.list.name) {
      isEditingTitle.value = false
      return
    }
    await updateListMutation.mutateAsync({
      listId: props.list.id,
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
  if (!props.list) {
    isEditingDescription.value = false
    return
  }

  try {
    if (editedDescription.value.trim() === (props.list.description || '')) {
      isEditingDescription.value = false
      return
    }
    await updateListMutation.mutateAsync({
      listId: props.list.id,
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
  if (props.list) {
    editedTitle.value = props.list.name
    isEditingTitle.value = true
  }
}

const startEditingDescription = () => {
  if (props.list) {
    editedDescription.value = props.list.description || ''
    isEditingDescription.value = true
  }
}
</script>
