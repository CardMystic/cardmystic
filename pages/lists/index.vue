<template>
  <!-- Background Image -->
  <div v-if="profileIconUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${profileIconUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold">My Card Lists</h1>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <UButton @click="loadLists">Try Again</UButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="!lists || lists.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-500 text-lg mb-4">You haven't created any lists yet</p>
      <p class="text-gray-400 text-sm">Add cards to your clipboard and save them to a list to get started!</p>
    </div>

    <!-- Lists Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="list in lists" :key="list.id"
        class="relative border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group">
        <!-- Background Image -->
        <div v-if="getListImageUrl(list)"
          class="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
          :style="{ backgroundImage: `url(${getListImageUrl(list)})` }"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        <!-- Delete Button (visible on hover) -->
        <UButton @click.stop="confirmDelete(list)"
          class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
          color="error" variant="solid" icon="i-lucide-trash-2" size="sm" aria-label="Delete list" />

        <!-- Content (clickable) -->
        <div class="relative p-4" @click="navigateTo(`/lists/${list.id}`)">
          <h3 class="text-xl font-semibold mb-2 text-white">{{ list.name }}</h3>
          <p v-if="list.description" class="text-gray-200 text-sm mb-3 line-clamp-2">
            {{ list.description }}
          </p>
          <div class="flex items-center justify-between text-sm text-gray-300">
            <span>{{ formatDate(list.updated_at) }}</span>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <UModal v-model:open="isDeleteModalOpen" title="Delete List">
    <template #content>
      <div class="p-4 space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <span class="font-semibold text-white">"{{ listToDelete?.name }}"</span>?
          This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isDeleteModalOpen = false"
            :disabled="deleteLoading" />
          <UButton color="error" variant="solid" label="Delete" :loading="deleteLoading" @click="handleDelete" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useUserProfile } from '~/composables/useUserProfile'
import { useToast } from '#imports'

const { fetchUserLists, deleteList } = useCardLists()
const { userProfile, profileIconUrl, fetchUser } = useUserProfile()
const toast = useToast()

const lists = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Delete modal state
const isDeleteModalOpen = ref(false)
const listToDelete = ref<any>(null)
const deleteLoading = ref(false)

const loadLists = async () => {
  loading.value = true
  error.value = ''

  const { data, error: fetchError } = await fetchUserLists()

  if (fetchError) {
    error.value = fetchError.message
  } else {
    lists.value = data || []
  }

  loading.value = false
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getListImageUrl = (list: any) => {
  if (!list.avatar_card_name) return null
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(list.avatar_card_name)}&format=image&version=art_crop`
}

const confirmDelete = (list: any) => {
  listToDelete.value = list
  isDeleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!listToDelete.value) return

  deleteLoading.value = true

  const { error: deleteError } = await deleteList(listToDelete.value.id)

  deleteLoading.value = false

  if (deleteError) {
    toast.add({
      title: 'Error deleting list',
      description: deleteError.message,
      color: 'error'
    })
  } else {
    toast.add({
      title: 'List deleted',
      icon: 'i-lucide-trash-2'
    })
    isDeleteModalOpen.value = false
    listToDelete.value = null
    // Reload lists
    await loadLists()
  }
}

onMounted(async () => {
  await fetchUser()

  if (!userProfile.value) {
    navigateTo('/')
  } else {
    loadLists()
  }
})
</script>
