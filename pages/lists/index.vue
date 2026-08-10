<template>
  <div class="mx-auto px-4 py-8 relative z-10 w-full">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-bold">My Decklists</h1>
      <UButton
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

    <ClientOnly>
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 animate-spin text-primary"
        />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-16 h-16 mx-auto mb-4 text-red-500"
        />
        <p class="text-red-500 mb-2 text-lg font-semibold">
          Error loading lists
        </p>
        <p class="text-gray-500">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!lists || lists.length === 0" class="text-center py-12">
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

      <!-- Lists Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardListLink
          v-for="list in lists"
          :key="list.id"
          :list="list"
          :show-delete-button="true"
        />
      </div>

      <!-- Liked / Saved decklist folders -->
      <div v-if="!loading && !error" class="mt-10 space-y-4">
        <template v-if="isLoadingLiked || isLoadingSaved">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="h-8 w-full" />
        </template>

        <UCollapsible v-if="likedDecklists.length > 0">
          <UButton
            :label="`Liked Decklists (${likedDecklists.length}${hasMoreLiked ? '+' : ''})`"
            icon="i-lucide-heart"
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="outline"
            class="cursor-pointer"
            block
          />
          <template #content>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4"
            >
              <CardListLink
                v-for="list in likedDecklists"
                :key="list.id"
                :list="list"
                :show-delete-button="false"
                :show-author="true"
              />
            </div>
            <div
              v-if="hasMoreLiked"
              ref="likedSentinelRef"
              class="flex justify-center py-6"
            >
              <UIcon
                v-if="isFetchingMoreLiked"
                name="i-lucide-loader-2"
                class="text-3xl animate-spin opacity-60"
              />
            </div>
          </template>
        </UCollapsible>

        <UCollapsible v-if="savedDecklists.length > 0">
          <UButton
            :label="`Saved Decklists (${savedDecklists.length}${hasMoreSaved ? '+' : ''})`"
            icon="i-lucide-bookmark"
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="outline"
            class="cursor-pointer"
            block
          />
          <template #content>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4"
            >
              <CardListLink
                v-for="list in savedDecklists"
                :key="list.id"
                :list="list"
                :show-delete-button="false"
                :show-author="true"
              />
            </div>
            <div
              v-if="hasMoreSaved"
              ref="savedSentinelRef"
              class="flex justify-center py-6"
            >
              <UIcon
                v-if="isFetchingMoreSaved"
                name="i-lucide-loader-2"
                class="text-3xl animate-spin opacity-60"
              />
            </div>
          </template>
        </UCollapsible>
      </div>

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

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useCardLists } from '~/composables/useCardLists';
import {
  useLikedDecklists,
  useSavedDecklists,
} from '~/composables/useDecklistSocial';
import CardListLink from '~/components/lists/CardListLink.vue';

const { userLists, isLoadingLists, listsError } = useCardLists();
const {
  decklists: likedDecklists,
  isLoading: isLoadingLiked,
  isFetchingNextPage: isFetchingMoreLiked,
  fetchNextPage: fetchMoreLiked,
  hasNextPage: hasMoreLikedRaw,
} = useLikedDecklists();
const {
  decklists: savedDecklists,
  isLoading: isLoadingSaved,
  isFetchingNextPage: isFetchingMoreSaved,
  fetchNextPage: fetchMoreSaved,
  hasNextPage: hasMoreSavedRaw,
} = useSavedDecklists();

const hasMoreLiked = computed(() => !!hasMoreLikedRaw.value);
const hasMoreSaved = computed(() => !!hasMoreSavedRaw.value);

const lists = computed(() => userLists.value?.decklists || []);
const loading = computed(() => isLoadingLists.value);
const error = computed(() => listsError.value?.message || '');

// Create modal state
const isCreateModalOpen = ref(false);

// Infinite scroll sentinels — mounted only when the collapsible is open,
// so we re-attach the observer whenever the ref becomes available.
const likedSentinelRef = ref<HTMLElement | null>(null);
const savedSentinelRef = ref<HTMLElement | null>(null);
let likedObserver: IntersectionObserver | null = null;
let savedObserver: IntersectionObserver | null = null;

function observeSentinel(
  target: HTMLElement | null,
  existing: IntersectionObserver | null,
  onIntersect: () => void,
): IntersectionObserver | null {
  existing?.disconnect();
  if (!target) return null;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) onIntersect();
    },
    { rootMargin: '200px' },
  );
  observer.observe(target);
  return observer;
}

function setupLikedObserver() {
  likedObserver = observeSentinel(likedSentinelRef.value, likedObserver, () => {
    if (hasMoreLiked.value && !isFetchingMoreLiked.value) fetchMoreLiked();
  });
}

function setupSavedObserver() {
  savedObserver = observeSentinel(savedSentinelRef.value, savedObserver, () => {
    if (hasMoreSaved.value && !isFetchingMoreSaved.value) fetchMoreSaved();
  });
}

watch(likedSentinelRef, setupLikedObserver);
watch(savedSentinelRef, setupSavedObserver);
onMounted(() => {
  setupLikedObserver();
  setupSavedObserver();
});
onBeforeUnmount(() => {
  likedObserver?.disconnect();
  savedObserver?.disconnect();
});
</script>
