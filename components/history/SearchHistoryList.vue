<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoadingHistory" class="flex justify-center py-12">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin text-primary"
      />
    </div>

    <!-- Error State -->
    <div v-else-if="historyError" class="text-center py-12">
      <UIcon
        name="i-lucide-alert-circle"
        class="w-16 h-16 mx-auto mb-4 text-red-500"
      />
      <p class="text-red-500 mb-2 text-lg font-semibold">
        Error loading history
      </p>
      <p class="text-gray-500">{{ historyError?.message }}</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!searchHistory || searchHistory.length === 0"
      class="text-center py-12"
    >
      <UIcon
        name="i-lucide-history"
        class="w-16 h-16 mx-auto mb-4 text-gray-400"
      />
      <p class="text-gray-500 text-lg mb-4">No search history yet</p>
      <p class="text-gray-400 text-sm">Your searches will appear here</p>
    </div>

    <!-- History List -->
    <div v-else class="space-y-3">
      <!-- Clear All Button -->
      <div class="flex justify-end mb-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="outline"
          label="Clear All"
          @click="confirmClearAll"
        />
      </div>

      <div
        v-for="item in displayedHistory"
        :key="item.id"
        class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-primary transition-colors"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <UBadge
                :color="getSearchTypeColor(item.search_type ?? '')"
                variant="soft"
              >
                <UIcon
                  :name="getSearchTypeIcon(item.search_type ?? '')"
                  class="w-3.5 h-3.5 mr-1"
                />
                {{ getSearchTypeLabel(item.search_type ?? '') }}
              </UBadge>
              <UBadge
                v-if="getRecommendCommander(item)"
                color="warning"
                variant="soft"
              >
                <UIcon name="i-lucide-crown" class="w-3.5 h-3.5 mr-1" />
                {{ getRecommendCommander(item) }}
              </UBadge>
              <span class="text-sm text-gray-500">{{
                formatRelativeTimeShort(item.created_at)
              }}</span>
            </div>
            <p class="text-lg font-medium mb-2">
              {{
                item.query ||
                (item.search_type === 'recommend'
                  ? 'General Recommendations'
                  : '')
              }}
            </p>
            <div
              v-if="item.filters"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              <span class="font-medium">Filters:</span>
              {{ formatFilters(item.filters) }}
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              icon="i-lucide-search"
              color="primary"
              variant="solid"
              @click="runSearch(item)"
            >
              <span class="hidden sm:inline">Search</span>
            </UButton>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="deleteItem(item)"
            />
          </div>
        </div>
      </div>

      <!-- Show More Button -->
      <div
        v-if="searchHistory.length > showMoreThreshold && !showAll"
        class="flex justify-center pt-4"
      >
        <UButton
          @click="showAll = true"
          color="primary"
          variant="outline"
          size="lg"
        >
          Show More ({{ searchHistory.length - showMoreThreshold }} more)
        </UButton>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Delete Search">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this search? This action cannot be
            undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="isDeleteModalOpen = false"
              :disabled="deleteLoading"
            />
            <UButton
              color="error"
              variant="solid"
              label="Delete"
              :loading="deleteLoading"
              @click="handleDeleteSearch"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Clear All Confirmation Modal -->
    <UModal v-model:open="isClearAllModalOpen" title="Clear All Search History">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all search history? This action
            cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="isClearAllModalOpen = false"
              :disabled="clearAllLoading"
            />
            <UButton
              color="error"
              variant="solid"
              label="Clear All"
              :loading="clearAllLoading"
              @click="handleClearAll"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatRelativeTimeShort } from '~/utils/dateFormatter';
import { useSearchHistory } from '~/composables/useSearchHistory';
import { rerunSearchHistory } from '~/utils/history';
import { useToast } from '#imports';

const showMoreThreshold = 7;

const {
  searchHistory,
  isLoadingHistory,
  historyError,
  deleteSearchHistoryMutation,
  clearAllHistoryMutation,
} = useSearchHistory();
const router = useRouter();
const toast = useToast();

const showAll = ref(false);
const isDeleteModalOpen = ref(false);
const isClearAllModalOpen = ref(false);
const itemToDelete = ref<any>(null);

const displayedHistory = computed(() => {
  if (showAll.value || !searchHistory.value) return searchHistory.value;
  return searchHistory.value.slice(0, showMoreThreshold);
});

const deleteLoading = computed(
  () => deleteSearchHistoryMutation.isPending.value,
);
const clearAllLoading = computed(() => clearAllHistoryMutation.isPending.value);

const confirmClearAll = () => {
  isClearAllModalOpen.value = true;
};

const handleClearAll = async () => {
  try {
    await clearAllHistoryMutation.mutateAsync();
    toast.add({
      title: 'Search history cleared',
      icon: 'i-lucide-check-circle',
    });
    isClearAllModalOpen.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error clearing history',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  }
};

const getSearchTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    ai: 'AI Search',
    similarity: 'Similarity',
    keyword: 'Keyword',
    commander: 'Commander',
    recommend: 'Deck Recommender',
  };
  return labels[type] || type;
};

const getSearchTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    ai: 'i-lucide-search',
    similarity: 'i-mdi-cards-outline',
    keyword: 'i-lucide-whole-word',
    commander: 'i-mdi-crown',
    recommend: 'i-lucide-box',
  };
  return icons[type] || 'i-lucide-search';
};

const getSearchTypeColor = (
  type: string,
): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
  const colors: Record<
    string,
    'primary' | 'success' | 'warning' | 'error' | 'info'
  > = {
    ai: 'primary',
    similarity: 'success',
    keyword: 'warning',
    commander: 'error',
    recommend: 'info',
  };
  return colors[type] || 'primary';
};

const formatFilters = (filters: any) => {
  if (!filters || typeof filters !== 'object') return 'None';
  const entries = Object.entries(filters).filter(
    ([_, v]) => v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) return 'None';
  return entries
    .map(([k, v]) => {
      if (k === 'decklist' && typeof v === 'string') {
        const count = v.split('\n').filter((l: string) => l.trim()).length;
        return `${count} cards`;
      }
      return `${k}: ${v}`;
    })
    .join(', ');
};

// Pulled out of the template because Prettier's Vue parser mis-reads
// the `>` in `Record<string, any>` casts as a tag close.
const getRecommendCommander = (item: any): string | null => {
  if (item.search_type !== 'recommend') return null;
  const filters = item.filters;
  if (!filters || typeof filters !== 'object' || Array.isArray(filters))
    return null;
  const commander = (filters as Record<string, any>).commander;
  return typeof commander === 'string' ? commander : null;
};

const runSearch = (item: any) => {
  rerunSearchHistory(item, router);
};

const deleteItem = (item: any) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const handleDeleteSearch = async () => {
  if (!itemToDelete.value) return;

  try {
    await deleteSearchHistoryMutation.mutateAsync(itemToDelete.value.id);
    toast.add({
      title: 'Search deleted',
      icon: 'i-lucide-check-circle',
    });
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
  } catch (error: any) {
    toast.add({
      title: 'Error deleting search',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  }
};
</script>
