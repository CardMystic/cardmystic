<template>
  <div>
    <h2 class="section-title">Recent Decklists</h2>
    <p class="text-sm opacity-70 mb-4 text-center">
      Built with CardMystic's powerful deck building tools!
    </p>

    <div
      v-if="isLoadingLists"
      class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4"
    >
      <USkeleton v-for="i in 3" :key="i" class="list-skeleton" />
    </div>

    <div
      v-else-if="recentLists.length > 0"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <CardListLink
        v-for="list in recentLists"
        :key="list.id"
        :list="list"
        :show-delete-button="false"
      />
      <NuxtLink to="/lists">
        <UButton
          color="primary"
          variant="outline"
          class="h-full w-full justify-center"
          icon="i-lucide-arrow-right"
        >
          See More
        </UButton>
      </NuxtLink>
    </div>

    <div v-else class="empty-state">
      <UIcon name="i-lucide-inbox" class="text-5xl opacity-30 mb-3" />
      <p>You haven't created any decklists yet</p>
    </div>

    <div v-if="!isLoadingLists" class="flex justify-center mt-4">
      <UButton
        color="primary"
        variant="solid"
        size="lg"
        icon="i-heroicons-plus"
        class="cursor-pointer"
        @click="
          () => {
            isCreateModalOpen = true;
          }
        "
      >
        Build a New Deck
      </UButton>
    </div>

    <div v-if="!isLoadingLists" class="flex gap-3 mt-2 md:mt-4 justify-center">
      <UButton
        to="/user/history?tab=search"
        color="neutral"
        variant="outline"
        icon="i-lucide-search"
      >
        Recent Searches
      </UButton>
      <UButton
        to="/user/history?tab=cards"
        color="neutral"
        variant="outline"
        icon="i-lucide-eye"
      >
        Recent Cards
      </UButton>
    </div>

    <LazyCreateDeckModal
      v-if="isCreateModalOpen"
      v-model:open="isCreateModalOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMyDecklists } from '~/composables/useCardLists';
import CardListLink from '~/components/lists/CardListLink.vue';

// The homepage widget only needs the most-recently updated decks; page 1
// with a small page size is cheap and shares the cache with the paginated
// My Decklists view.
const page = ref(1);
const isCreateModalOpen = ref(false);
const { decklists, isLoading: isLoadingLists } = useMyDecklists(page, 8);

const recentLists = computed(() => {
  return [...decklists.value]
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? 0).getTime() -
        new Date(a.updated_at ?? 0).getTime(),
    )
    .slice(0, 3);
});
</script>

<style scoped lang="sass">

.section-title
  font-size: 2rem
  font-weight: 700
  text-align: center
  @media (max-width: 768px)
    font-size: 1.5rem

.list-skeleton
  height: 150px
  border-radius: 1rem

.empty-state
  text-align: center
  padding: 3rem 1.5rem
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-radius: 1rem
  border: 1px dashed rgba(147, 114, 255, 0.3)
  background: rgba(147, 114, 255, 0.02)

  @media (prefers-color-scheme: dark)
    background: rgba(44, 44, 44, 0.2)
</style>
