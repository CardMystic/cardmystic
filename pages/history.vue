<template>
  <!-- Background Image -->
  <div v-if="profileIconUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${profileIconUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">History</h1>
      <UButton icon="i-lucide-trash-2" color="error" variant="outline" label="Clear All" @click="confirmClearAll"
        :disabled="currentTabEmpty" />
    </div>

    <!-- Tabs -->
    <UTabs v-model="selectedTab" :items="tabs" class="mb-6">
      <template #search>
        <SearchHistoryList :history="searchHistoryData" :loading="searchLoading" :error="searchError"
          @delete-item="deleteSearchItem" @run-search="runSearch" />
      </template>

      <template #cards>
        <CardHistoryList :card-history="cardHistoryData" :loading="cardLoading" :error="cardError" class="mt-2" />
      </template>
    </UTabs>
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
          <UButton color="error" variant="solid" label="Delete" :loading="deleteLoading" @click="handleDeleteSearch" />
        </div>
      </div>
    </template>
  </UModal>

  <!-- Clear All Confirmation Modal -->
  <UModal v-model:open="isClearAllModalOpen" :title="`Clear All ${selectedTab === '0' ? 'Search' : 'Card'} History`">
    <template #content>
      <div class="p-4 space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Are you sure you want to clear all {{ selectedTab === '0' ? 'search' : 'card' }} history? This action
          cannot be undone.
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
import SearchHistoryList from '~/components/SearchHistoryList.vue'
import CardHistoryList from '~/components/CardHistoryList.vue'
import { useSearchHistory } from '~/composables/useSearchHistory'
import { useCardHistory } from '~/composables/useCardHistory'
import { useUserProfile } from '~/composables/useUserProfile'
import { useToast } from '#imports'

const { searchHistory, isLoadingHistory, historyError, deleteSearchHistoryMutation, clearAllHistoryMutation } = useSearchHistory()
const { cardHistory, isLoadingHistory: isLoadingCardHistory, historyError: cardHistoryError, clearAllHistoryMutation: clearAllCardHistoryMutation } = useCardHistory()
const { userProfile, profileIconUrl } = useUserProfile()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const selectedTab = ref('0')

// Set active tab based on query parameter on mount
onMounted(() => {
  if (!userProfile.value) {
    navigateTo('/')
    return
  }

  const tabParam = route.query.tab as string
  if (tabParam === 'cards') {
    selectedTab.value = '1'
  } else if (tabParam === 'search') {
    selectedTab.value = '0'
  }
})

const tabs = [
  { key: 'search', label: 'Search History', icon: 'i-lucide-search', slot: 'search' },
  { key: 'cards', label: 'Recent Cards', icon: 'i-lucide-eye', slot: 'cards' }
]

const searchHistoryData = computed(() => searchHistory.value || [])
const searchLoading = computed(() => isLoadingHistory.value)
const searchError = computed(() => historyError.value?.message || '')

const cardHistoryData = computed(() => cardHistory.value || [])
const cardLoading = computed(() => isLoadingCardHistory.value)
const cardError = computed(() => cardHistoryError.value?.message || '')

const currentTabEmpty = computed(() => {
  if (selectedTab.value === '0') {
    return !searchHistoryData.value || searchHistoryData.value.length === 0
  } else {
    return !cardHistoryData.value || cardHistoryData.value.length === 0
  }
})

// Delete modal state
const isDeleteModalOpen = ref(false)
const isClearAllModalOpen = ref(false)
const itemToDelete = ref<any>(null)
const deleteLoading = computed(() => deleteSearchHistoryMutation.isPending.value)
const clearAllLoading = computed(() => {
  if (selectedTab.value === '0') {
    return clearAllHistoryMutation.isPending.value
  } else {
    return clearAllCardHistoryMutation.isPending.value
  }
})

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

const deleteSearchItem = (item: any) => {
  itemToDelete.value = item
  isDeleteModalOpen.value = true
}

const handleDeleteSearch = async () => {
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
    if (selectedTab.value === '0') {
      await clearAllHistoryMutation.mutateAsync()
      toast.add({
        title: 'Search history cleared',
        icon: 'i-lucide-check-circle'
      })
    } else {
      await clearAllCardHistoryMutation.mutateAsync()
      toast.add({
        title: 'Card history cleared',
        icon: 'i-lucide-check-circle'
      })
    }
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
</script>
