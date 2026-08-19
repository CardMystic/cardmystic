<template>
  <div class="mx-auto px-4 py-8 relative z-10 w-full">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">{{ pageHeading }}</h1>
      <UButton
        v-if="view === 'mine'"
        icon="i-lucide-plus"
        label="New List"
        @click="
          () => {
            isCreateModalOpen = true;
          }
        "
        class="cursor-pointer"
      />
    </div>

    <!-- View toggle: My / Liked / Saved -->
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        :color="view === 'mine' ? 'primary' : 'neutral'"
        :variant="view === 'mine' ? 'solid' : 'outline'"
        icon="i-lucide-layers"
        label="View My Decks"
        class="cursor-pointer"
        @click="
          () => {
            view = 'mine';
          }
        "
      />
      <UButton
        :color="view === 'liked' ? 'primary' : 'neutral'"
        :variant="view === 'liked' ? 'solid' : 'outline'"
        icon="i-lucide-heart"
        label="View Liked Decks"
        class="cursor-pointer"
        @click="
          () => {
            view = 'liked';
          }
        "
      />
      <UButton
        :color="view === 'saved' ? 'primary' : 'neutral'"
        :variant="view === 'saved' ? 'solid' : 'outline'"
        icon="i-lucide-bookmark"
        label="View Saved Decks"
        class="cursor-pointer"
        @click="
          () => {
            view = 'saved';
          }
        "
      />
    </div>

    <ClientOnly>
      <!-- My Decks view -->
      <template v-if="view === 'mine'">
        <div v-if="isLoadingMine" class="flex justify-center py-12">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 animate-spin text-primary"
          />
        </div>
        <div v-else-if="mineError" class="text-center py-12">
          <UIcon
            name="i-lucide-alert-circle"
            class="w-16 h-16 mx-auto mb-4 text-red-500"
          />
          <p class="text-red-500 mb-2 text-lg font-semibold">
            Error loading lists
          </p>
          <p class="text-gray-500">{{ mineError.message }}</p>
        </div>
        <div v-else-if="myDecklists.length === 0" class="text-center py-12">
          <UIcon
            name="i-lucide-inbox"
            class="w-16 h-16 mx-auto mb-4 text-gray-400"
          />
          <p class="text-gray-500 text-lg mb-4">
            You haven't created any decklists yet
          </p>
          <p class="text-gray-400 text-sm">
            Add cards to your clipboard and save them to a list to get started!
          </p>
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <CardListLink
            v-for="list in myDecklists"
            :key="list.id"
            :list="list"
            :show-delete-button="true"
          />
        </div>
        <div v-if="mineTotalPages > 1" class="mt-6 flex justify-center">
          <UPagination
            v-model:page="minePage"
            :total="mineTotalCount"
            :items-per-page="pageSize"
          />
        </div>
      </template>

      <!-- Liked Decks view -->
      <template v-else-if="view === 'liked'">
        <div v-if="isLoadingLiked" class="flex justify-center py-12">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 animate-spin text-primary"
          />
        </div>
        <div v-else-if="likedDecklists.length === 0" class="text-center py-12">
          <UIcon
            name="i-lucide-heart-off"
            class="w-16 h-16 mx-auto mb-4 text-gray-400"
          />
          <p class="text-gray-500 text-lg mb-4">
            You haven't liked any decklists yet
          </p>
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <CardListLink
            v-for="list in likedDecklists"
            :key="list.id"
            :list="list"
            :show-delete-button="false"
            :show-author="true"
          />
        </div>
        <div v-if="likedTotalPages > 1" class="mt-6 flex justify-center">
          <UPagination
            v-model:page="likedPage"
            :total="likedTotalCount"
            :items-per-page="pageSize"
          />
        </div>
      </template>

      <!-- Saved Decks view -->
      <template v-else>
        <div v-if="isLoadingSaved" class="flex justify-center py-12">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 animate-spin text-primary"
          />
        </div>
        <div v-else-if="savedDecklists.length === 0" class="text-center py-12">
          <UIcon
            name="i-lucide-bookmark"
            class="w-16 h-16 mx-auto mb-4 text-gray-400"
          />
          <p class="text-gray-500 text-lg mb-4">
            You haven't saved any decklists yet
          </p>
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <CardListLink
            v-for="list in savedDecklists"
            :key="list.id"
            :list="list"
            :show-delete-button="false"
            :show-author="true"
          />
        </div>
        <div v-if="savedTotalPages > 1" class="mt-6 flex justify-center">
          <UPagination
            v-model:page="savedPage"
            :total="savedTotalCount"
            :items-per-page="pageSize"
          />
        </div>
      </template>

      <template #fallback>
        <div class="flex justify-center py-12">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 animate-spin text-primary"
          />
        </div>
      </template>
    </ClientOnly>
  </div>

  <!-- Create Deck Modal -->
  <CreateDeckModal v-model:open="isCreateModalOpen" />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

import { ref, computed, watch } from 'vue';
import { useMyDecklists } from '~/composables/useCardLists';
import {
  useLikedDecklists,
  useSavedDecklists,
} from '~/composables/useDecklistSocial';
import CardListLink from '~/components/lists/CardListLink.vue';

const pageSize = 50;
const view = ref<'mine' | 'liked' | 'saved'>('mine');
const pageHeading = computed(() =>
  view.value === 'mine'
    ? 'My Decklists'
    : view.value === 'liked'
      ? 'Liked Decklists'
      : 'Saved Decklists',
);

const minePage = ref(1);
const likedPage = ref(1);
const savedPage = ref(1);

const {
  decklists: myDecklists,
  totalCount: mineTotalCount,
  totalPages: mineTotalPages,
  isLoading: isLoadingMine,
  error: mineError,
} = useMyDecklists(minePage, pageSize);

const {
  decklists: likedDecklists,
  totalCount: likedTotalCount,
  totalPages: likedTotalPages,
  isLoading: isLoadingLiked,
} = useLikedDecklists(likedPage, pageSize);

const {
  decklists: savedDecklists,
  totalCount: savedTotalCount,
  totalPages: savedTotalPages,
  isLoading: isLoadingSaved,
} = useSavedDecklists(savedPage, pageSize);

// Clamp each page ref when its total shrinks (e.g. deleting the only deck on
// the last page) so the user isn't stranded on an empty out-of-range page
// with no pagination control to navigate back.
watch(mineTotalPages, (total) => {
  if (minePage.value > total) minePage.value = Math.max(1, total);
});
watch(likedTotalPages, (total) => {
  if (likedPage.value > total) likedPage.value = Math.max(1, total);
});
watch(savedTotalPages, (total) => {
  if (savedPage.value > total) savedPage.value = Math.max(1, total);
});

const isCreateModalOpen = ref(false);
</script>
