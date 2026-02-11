<template>
  <div class="mt-3 w-full">
    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </template>

    <!-- Cards Grid -->
    <template v-else-if="cards && cards.length > 0">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div v-for="card in cards" :key="card.card_data.id">
          <CardComponent :card="card" :showCardInfo="true" :hide-progress-bar="true" :hide-thumbs-down-button="true"
            :show-remove-button="true" @remove="(cardId) => emit('removeCard', cardId)" />
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <template v-else>
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-layers" class="w-16 h-16 mb-4 text-gray-400" />
        <h3 class="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-300">This list is empty!</h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-md">
          Use the search dropdown above, or the <span class="font-medium">Save To List</span> button from the clipboard
          to add cards to this list.
        </p>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { Card } from '~/models/cardModel';
import CardComponent from '~/components/Card.vue';
import CardSkeleton from '~/components/CardSkeleton.vue';

defineProps<{
  isLoading: boolean;
  cards: Card[] | undefined;
  skeletonCount?: number;
}>();

const emit = defineEmits<{
  (e: 'removeCard', cardId: string): void;
}>();
</script>
