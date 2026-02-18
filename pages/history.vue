<template>
  <!-- Background Image -->
  <div v-if="profileIconUrl" class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
      :style="{ backgroundImage: `url(${profileIconUrl})` }"></div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold">History</h1>
    </div>

    <!-- Tabs -->
    <UTabs v-model="selectedTab" :items="tabs" class="mb-6">
      <template #search>
        <SearchHistoryList />
      </template>

      <template #cards>
        <CardHistoryList />
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import SearchHistoryList from '~/components/history/SearchHistoryList.vue'
import CardHistoryList from '~/components/history/CardHistoryList.vue'
import { useUserProfile } from '~/composables/useUserProfile'

const { profileIconUrl } = useUserProfile()
const route = useRoute()

const selectedTab = ref('0')

// Set active tab based on query parameter on mount
onMounted(() => {
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
</script>
