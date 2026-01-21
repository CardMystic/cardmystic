<template>
  <!-- Background Image -->
  <div v-if="profileIconUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${profileIconUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">Search History</h1>
      <UButton icon="i-lucide-trash-2" color="error" variant="outline" label="Clear All" @click="confirmClearAll"
        :disabled="!history || history.length === 0" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500" />
      <p class="text-red-500 mb-2 text-lg font-semibold">Error loading history</p>
      <p class="text-gray-500">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!history || history.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-history" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-500 text-lg mb-4">No search history yet</p>
      <p class="text-gray-400 text-sm">Your searches will appear here</p>
    </div>

    <!-- History List -->
    <div v-else class="space-y-3">
      <div v-for="item in history" :key="item.id"
        class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-primary transition-colors">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <UBadge :color="getSearchTypeColor(item.search_type)" variant="soft">
                {{ getSearchTypeLabel(item.search_type) }}
              </UBadge>
              <span class="text-sm text-gray-500">{{ formatDate(item.created_at) }}</span>
            </div>
            <p class="text-lg font-medium mb-2">{{ item.query }}</p>
            <div v-if="item.filters" class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">Filters:</span> {{ formatFilters(item.filters) }}
            </div>
          </div>

          <div class="flex gap-2">
            <UButton icon="i-lucide-search" color="primary" variant="solid" label="Search" @click="runSearch(item)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="deleteItem(item)" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <UModal v-model:open="isDeleteModalOpen" title="Delete Search">
    <template #content>
      <div class="p-4 space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this search? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isDeleteModalOpen = false"
            :disabled="deleteLoading" />
          <UButton color="error" variant="solid" label="Delete" :loading="deleteLoading" @click="handleDelete" />
        </div>
      </div>
    </template>
  </UModal>

  <!-- Clear All Confirmation Modal -->
  <UModal v-model:open="isClearAllModalOpen" title="Clear All History">
    <template #content>
      <div class="p-4 space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Are you sure you want to clear all search history? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isClearAllModalOpen = false"
            :disabled="clearAllLoading" />
          <UButton color="error" variant="solid" label="Clear All" :loading="clearAllLoading" @click="handleClearAll" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useSearchHistory } from '~/composables/useSearchHistory'
import { useUserProfile } from '~/composables/useUserProfile'
import { useToast } from '#imports'

const { searchHistory, isLoadingHistory, historyError, deleteSearchHistoryMutation, clearAllHistoryMutation } = useSearchHistory()
const { userProfile, profileIconUrl } = useUserProfile()
const toast = useToast()
const router = useRouter()

const history = computed(() => searchHistory.value || [])
const loading = computed(() => isLoadingHistory.value)
const error = computed(() => historyError.value?.message || '')

// Delete modal state
const isDeleteModalOpen = ref(false)
const isClearAllModalOpen = ref(false)
const itemToDelete = ref<any>(null)
const deleteLoading = computed(() => deleteSearchHistoryMutation.isPending.value)
const clearAllLoading = computed(() => clearAllHistoryMutation.isPending.value)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const getSearchTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'ai': 'AI Search',
    'similarity': 'Similarity',
    'keyword': 'Keyword',
    'commander': 'Commander'
  }
  return labels[type] || type
}

const getSearchTypeColor = (type: string): 'primary' | 'success' | 'warning' | 'error' => {
  const colors: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
    'ai': 'primary',
    'similarity': 'success',
    'keyword': 'warning',
    'commander': 'error'
  }
  return colors[type] || 'primary'
}

const formatFilters = (filters: any) => {
  if (!filters || typeof filters !== 'object') return 'None'
  const entries = Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  if (entries.length === 0) return 'None'
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
}

const runSearch = (item: any) => {
  const paths: Record<string, string> = {
    'ai': '/search',
    'similarity': '/search/similarity',
    'keyword': '/search/keyword',
    'commander': '/search/commander'
  }

  const path = paths[item.search_type] || '/search'
  const query: any = { searchType: item.search_type }

  if (item.search_type === 'similarity') {
    query.card_name = item.query
  } else {
    query.query = item.query
  }

  if (item.filters) {
    query.filters = JSON.stringify(item.filters)
  }

  router.push({ path, query })
}

const deleteItem = (item: any) => {
  itemToDelete.value = item
  isDeleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return

  try {
    await deleteSearchHistoryMutation.mutateAsync(itemToDelete.value.id)
    toast.add({
      title: 'Search deleted',
      icon: 'i-lucide-check-circle'
    })
    isDeleteModalOpen.value = false
    itemToDelete.value = null
  } catch (error: any) {
    toast.add({
      title: 'Error deleting search',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}

const confirmClearAll = () => {
  isClearAllModalOpen.value = true
}

const handleClearAll = async () => {
  try {
    await clearAllHistoryMutation.mutateAsync()
    toast.add({
      title: 'History cleared',
      icon: 'i-lucide-check-circle'
    })
    isClearAllModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error clearing history',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}

onMounted(() => {
  if (!userProfile.value) {
    navigateTo('/')
  }
})
</script>
