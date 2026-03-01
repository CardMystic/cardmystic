<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-bold">My Card Lists</h1>
      <UButton icon="i-lucide-plus" label="New List" @click="isCreateModalOpen = true" class="cursor-pointer" />
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
      <CardListLink v-for="list in lists" :key="list.id" :list="list" :show-delete-button="true" />
    </div>
  </div>

  <!-- Create List Modal -->
  <UModal v-model:open="isCreateModalOpen" title="Create New List">
    <template #content>
      <div class="p-4 space-y-4">
        <UFormField label="List Name">
          <UInput v-model="newListName" placeholder="Enter list name" class="w-full" />
        </UFormField>
        <UFormField label="Description (optional)">
          <UTextarea v-model="newListDescription" placeholder="Enter description" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isCreateModalOpen = false"
            :disabled="createLoading" />
          <UButton color="primary" variant="solid" label="Create" :loading="createLoading"
            :disabled="!newListName.trim()" @click="handleCreate" />
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
import { useToast } from '#imports'
import CardListLink from '~/components/lists/CardListLink.vue'

const { userLists, isLoadingLists, listsError, createListMutation } = useCardLists()
const toast = useToast()

const lists = computed(() => userLists.value || [])
const loading = computed(() => isLoadingLists.value)
const error = computed(() => listsError.value?.message || '')

// Create modal state
const isCreateModalOpen = ref(false)
const newListName = ref('')
const newListDescription = ref('')
const createLoading = computed(() => createListMutation.isPending.value)

const handleCreate = async () => {
  if (!newListName.value.trim()) return

  try {
    await createListMutation.mutateAsync({
      name: newListName.value.trim(),
      description: newListDescription.value.trim() || undefined
    })
    toast.add({
      title: 'List created',
      icon: 'i-lucide-check'
    })
    isCreateModalOpen.value = false
    newListName.value = ''
    newListDescription.value = ''
  } catch (error: any) {
    toast.add({
      title: 'Error creating list',
      description: error.message,
      color: 'error'
    })
  }
}
</script>
