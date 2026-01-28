<template>
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
    <div v-for="item in displayedHistory" :key="item.id"
      class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-primary transition-colors">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <UBadge :color="getSearchTypeColor(item.search_type)" variant="soft">
              {{ getSearchTypeLabel(item.search_type) }}
            </UBadge>
            <span class="text-sm text-gray-500">{{ formatRelativeTimeShort(item.created_at) }}</span>
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

    <!-- Show More Button -->
    <div v-if="history.length > showMoreThreshold && !showAll" class="flex justify-center pt-4">
      <UButton @click="showAll = true" color="primary" variant="outline" size="lg">
        Show More ({{ history.length - showMoreThreshold }} more)
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatRelativeTimeShort } from '~/utils/dateFormatter'

const showMoreThreshold = 7

const props = defineProps<{
  history: any[]
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  'delete-item': [item: any]
  'run-search': [item: any]
}>()

const showAll = ref(false)

const displayedHistory = computed(() => {
  if (showAll.value || !props.history) return props.history
  return props.history.slice(0, showMoreThreshold)
})

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
  emit('run-search', item)
}

const deleteItem = (item: any) => {
  emit('delete-item', item)
}
</script>
