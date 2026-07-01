<template>
  <div>
    <h2 class="section-title">Featured Decklists</h2>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <USkeleton v-for="i in 3" :key="i" class="list-skeleton" />
      <USkeleton class="list-skeleton" />
    </div>

    <div
      v-else-if="visibleDecklists.length > 0"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <PublicDecklistLink
        v-for="list in visibleDecklists"
        :key="list.id"
        :decklist="list"
      />
      <NuxtLink to="/explore/decklists">
        <UButton
          color="primary"
          variant="outline"
          class="h-full w-full justify-center"
          icon="i-lucide-search"
        >
          Search Decklists
        </UButton>
      </NuxtLink>
    </div>

    <div v-else class="empty-state">
      <UIcon name="i-lucide-stars" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">No featured decklists yet!</p>
      <UButton to="/explore/decklists" color="primary" variant="soft">
        Search Decklists
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFeaturedDecklists } from '~/composables/useDiscovery';
import PublicDecklistLink from '~/components/lists/PublicDecklistLink.vue';

const { decklists, isLoading } = useFeaturedDecklists(10);

const visibleDecklists = computed(() => decklists.value.slice(0, 3));
</script>

<style scoped lang="sass">

.section-title
  font-size: 2rem
  font-weight: 700
  margin-bottom: 1.5rem
  text-align: center
  @media (max-width: 768px)
    font-size: 1.5rem
    margin-bottom: 0.75rem

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
