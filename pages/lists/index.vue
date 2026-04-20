<template>
  <div class="mx-auto px-4 py-8 relative z-10">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-bold">My Decklists</h1>
      <UButton icon="i-lucide-plus" label="New List" @click="isCreateModalOpen = true" class="cursor-pointer" />
    </div>

    <ClientOnly>
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
        <p class="text-gray-500 text-lg mb-4">You haven't created any decklists yet</p>
        <p class="text-gray-400 text-sm">Add cards to your clipboard and save them to a list to get started!</p>
      </div>

      <!-- Lists Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardListLink v-for="list in lists" :key="list.id" :list="list" :show-delete-button="true" />
      </div>

      <template #fallback>
        <div class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
        </div>
      </template>
    </ClientOnly>
  </div>

  <!-- Create List Modal -->
  <CreateListModal v-model:open="isCreateModalOpen" />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { useCardLists } from '~/composables/useCardLists'
import { useToast } from '#imports'
import CardListLink from '~/components/lists/CardListLink.vue'
import CreateListModal from '~/components/lists/CreateListModal.vue'

const { userLists, isLoadingLists, listsError } = useCardLists()
const toast = useToast()

const lists = computed(() => userLists.value || [])
const loading = computed(() => isLoadingLists.value)
const error = computed(() => listsError.value?.message || '')

// Create modal state
const isCreateModalOpen = ref(false)
</script>
