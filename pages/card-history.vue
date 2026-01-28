<template>
  <UContainer class="py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Card History</h1>
        <UButton
          v-if="cardHistory && cardHistory.length > 0"
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
      <UCard v-else-if="!cardHistory || cardHistory.length === 0">
        <div class="text-center py-12">
          <UIcon name="i-heroicons-rectangle-stack" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold mb-2">No Card History</h3>
          <p class="text-gray-600 mb-4">Cards you view will appear here</p>
          <UButton color="primary" @click="navigateTo('/search')">
            Browse Cards
          </UButton>
        </div>
      </UCard>

      <!-- Card History List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="item in cardHistory"
          :key="item.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewCard(item.card_id)"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <UIcon name="i-heroicons-rectangle-stack" class="w-5 h-5 text-gray-400" />
                <h3 class="text-lg font-semibold">{{ item.card_name }}</h3>
              </div>
              <p class="text-sm text-gray-600">
                Viewed {{ formatDate(item.viewed_at) }}
              </p>
            </div>
            <div class="flex space-x-2">
              <UButton
                color="primary"
                variant="soft"
                icon="i-heroicons-eye"
                @click.stop="viewCard(item.card_id)"
              >
                View
              </UButton>
              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                @click.stop="handleDelete(item.id)"
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
import { useCardHistory } from '~/composables/useCardHistory';

definePageMeta({
  title: 'Card History',
});

useSeoMeta({
  title: 'Card History | CardMystic',
  description: 'View your recently viewed cards',
  robots: 'noindex, nofollow',
});

const {
  cardHistory,
  isLoading,
  deleteCard,
  clearHistory,
  isDeleting,
  isClearing,
} = useCardHistory();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return `on ${date.toLocaleDateString()}`;
};

const viewCard = (cardId: string) => {
  navigateTo(`/card/${cardId}`);
};

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to remove this card from history?')) {
    deleteCard(id);
  }
};

const handleClearHistory = () => {
  if (confirm('Are you sure you want to clear all card history?')) {
    clearHistory();
  }
};
</script>
