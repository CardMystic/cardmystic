<template>
  <UContainer class="py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Search History</h1>
        <UButton
          v-if="searchHistory && searchHistory.length > 0"
          color="red"
          variant="outline"
          @click="handleClearHistory"
          :loading="isClearing"
        >
          Clear All
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-20" v-for="i in 5" :key="i" />
      </div>

      <!-- Empty State -->
      <UCard v-else-if="!searchHistory || searchHistory.length === 0">
        <div class="text-center py-12">
          <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold mb-2">No Search History</h3>
          <p class="text-gray-600 mb-4">Your search history will appear here</p>
          <UButton color="primary" @click="navigateTo('/search')">
            Start Searching
          </UButton>
        </div>
      </UCard>

      <!-- Search History List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="item in searchHistory"
          :key="item.id"
          class="hover:shadow-lg transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1 cursor-pointer" @click="rerunSearch(item)">
              <div class="flex items-center space-x-2 mb-2">
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-gray-400" />
                <h3 class="text-lg font-semibold">{{ item.query }}</h3>
              </div>
              <p class="text-sm text-gray-600">
                {{ formatDate(item.created_at) }}
              </p>
              <div v-if="item.filters" class="mt-2">
                <UBadge color="gray" variant="soft">
                  Filters applied
                </UBadge>
              </div>
            </div>
            <div class="flex space-x-2">
              <UButton
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-path"
                @click="rerunSearch(item)"
              >
                Rerun
              </UButton>
              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="handleDelete(item.id)"
                :loading="isDeleting"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { useSearchHistory } from '~/composables/useSearchHistory';
import type { SearchHistoryItem } from '~/models/userModel';

definePageMeta({
  title: 'Search History',
});

useSeoMeta({
  title: 'Search History | CardMystic',
  description: 'View and rerun your previous searches',
  robots: 'noindex, nofollow',
});

const {
  searchHistory,
  isLoading,
  deleteSearch,
  clearHistory,
  isDeleting,
  isClearing,
} = useSearchHistory();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

const rerunSearch = (item: SearchHistoryItem) => {
  const params = new URLSearchParams({ query: item.query });
  if (item.filters) {
    params.append('filters', JSON.stringify(item.filters));
  }
  navigateTo(`/search?${params.toString()}`);
};

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this search?')) {
    deleteSearch(id);
  }
};

const handleClearHistory = () => {
  if (confirm('Are you sure you want to clear all search history?')) {
    clearHistory();
  }
};
</script>
