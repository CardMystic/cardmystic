<template>
  <div>
    <h2 class="section-title">Recent Lists</h2>

    <div v-if="isLoadingLists" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <USkeleton v-for="i in 3" :key="i" class="list-skeleton" />
    </div>

    <div v-else-if="recentLists.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <CardListLink v-for="list in recentLists" :key="list.id" :list="list" :show-delete-button="false" />
      <NuxtLink to="/lists">
        <UButton color="primary" variant="outline" class="h-full w-full justify-center" icon="i-lucide-arrow-right">
          See More
        </UButton>
      </NuxtLink>
    </div>
    <div v-else class="empty-state">
      <UIcon name="i-lucide-inbox" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">You haven't created any lists yet</p>
      <UButton to="/lists" color="primary" variant="soft">
        Create Your First List
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists';
import CardListLink from '~/components/CardListLink.vue';

const { userLists, isLoadingLists } = useCardLists();

const recentLists = computed(() => {
  if (!userLists.value) return [];
  return [...userLists.value]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);
});
</script>

<style scoped lang="sass">

.section-title
  font-size: 2rem
  font-weight: 700
  margin-bottom: 1.5rem
  text-align: center

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
