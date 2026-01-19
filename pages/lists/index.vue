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
        class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
        @click="navigateTo(`/lists/${list.id}`)">
        <h3 class="text-xl font-semibold mb-2">{{ list.name }}</h3>
        <p v-if="list.description" class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {{ list.description }}
        </p>
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>{{ formatDate(list.updated_at) }}</span>
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useUserProfile } from '~/composables/useUserProfile'

const { fetchUserLists } = useCardLists()
const { userProfile, profileIconUrl } = useUserProfile()

const lists = ref<any[]>([])
const loading = ref(true)
const error = ref('')

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

onMounted(() => {
  if (!userProfile.value) {
    navigateTo('/')
  } else {
    loadLists()
  }
})
</script>
