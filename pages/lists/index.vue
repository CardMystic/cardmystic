<template>
  <!-- Background Image -->
  <div v-if="profileIconUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
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
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
      <p class="text-red-500 mb-2 text-lg font-semibold">Error loading lists</p>
      <p class="text-gray-500">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!lists || lists.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-500 text-lg mb-4">You haven't created any lists yet</p>
      <p class="text-gray-400 text-sm">Add cards to your clipboard and save them to a list to get started!</p>
    </div>

    <!-- Lists Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardListLink v-for="list in lists" :key="list.id" :list="list" :show-delete-button="true"
        @delete="confirmDelete(list)" />
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
definePageMeta({
  middleware: 'auth'
})

import { useCardLists } from '~/composables/useCardLists'
import { useUserProfile } from '~/composables/useUserProfile'
import { useToast } from '#imports'
import CardListLink from '~/components/CardListLink.vue'

const { userLists, isLoadingLists, listsError, deleteListMutation } = useCardLists()
const { userProfile, profileIconUrl, fetchUser } = useUserProfile()
const toast = useToast()

const lists = computed(() => userLists.value || [])
const loading = computed(() => isLoadingLists.value)
const error = computed(() => listsError.value?.message || '')

// Delete modal state
const isDeleteModalOpen = ref(false)
const listToDelete = ref<any>(null)
const deleteLoading = computed(() => deleteListMutation.isPending.value)

const confirmDelete = (list: any) => {
  listToDelete.value = list
  isDeleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!listToDelete.value) return

  try {
    await deleteListMutation.mutateAsync(listToDelete.value.id)
    toast.add({
      title: 'List deleted',
      icon: 'i-lucide-trash-2'
    })
    isDeleteModalOpen.value = false
    listToDelete.value = null
  } catch (error: any) {
    toast.add({
      title: 'Error deleting list',
      description: error.message,
      color: 'error'
    })
  }
}

onMounted(async () => {
  await fetchUser()

  if (!userProfile.value) {
    navigateTo('/')
  }
})
</script>
