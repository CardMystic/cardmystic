<template>
  <div>
    <h2 class="section-title mb-4">Awesome Decklists & Users</h2>

    <!-- Decklists row -->
    <div
      v-if="isLoadingDecklists"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 mb-4"
    >
      <USkeleton v-for="i in 4" :key="i" class="list-skeleton" />
    </div>

    <div
      v-else-if="visibleDecklists.length > 0"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 mb-4"
    >
      <CardListLink
        v-for="list in visibleDecklists"
        :key="list.id"
        :list="list"
        :showDeleteButton="false"
        :showAuthor="true"
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

    <div v-else class="empty-state mb-4">
      <UIcon name="i-lucide-stars" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">No featured decklists yet!</p>
      <UButton to="/explore/decklists" color="primary" variant="soft">
        Search Decklists
      </UButton>
    </div>

    <!-- Users row -->
    <div
      v-if="isLoadingUsers"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <USkeleton v-for="i in 4" :key="i" class="user-skeleton" />
    </div>

    <div
      v-else-if="visibleUsers.length > 0"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <PublicUserLink
        v-for="profile in visibleUsers"
        :key="profile.id"
        :profile="profile"
      />
      <NuxtLink to="/explore/users">
        <UButton
          color="primary"
          variant="outline"
          class="h-full w-full justify-center"
          icon="i-lucide-user-search"
        >
          Search Users
        </UButton>
      </NuxtLink>
    </div>

    <div v-else class="empty-state">
      <UIcon name="i-lucide-users" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">No featured users yet!</p>
      <UButton to="/explore/users" color="primary" variant="soft">
        Search Users
      </UButton>
    </div>

    <!-- Primers row -->
    <template v-if="isLoadingPrimers || visiblePrimers.length > 0">
      <h2 class="section-title mt-8 mb-4">Suggested Primer Reads</h2>

      <div
        v-if="isLoadingPrimers"
        class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4"
      >
        <USkeleton v-for="i in 2" :key="i" class="primer-skeleton" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        <FeaturedPrimerLink
          v-for="primer in visiblePrimers"
          :key="primer.decklist.id"
          :primer="primer"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  useFeaturedDecklists,
  useFeaturedUsers,
  useFeaturedPrimers,
} from '~/composables/useDiscovery';
import CardListLink from '~/components/lists/CardListLink.vue';
import PublicUserLink from '~/components/user/PublicUserLink.vue';
import FeaturedPrimerLink from '~/components/home/FeaturedPrimerLink.vue';

const { decklists, isLoading: isLoadingDecklists } = useFeaturedDecklists(10);
const { users, isLoading: isLoadingUsers } = useFeaturedUsers(10);
const { primers, isLoading: isLoadingPrimers } = useFeaturedPrimers(6);

const visibleDecklists = computed(() => decklists.value.slice(0, 3));
const visibleUsers = computed(() => users.value.slice(0, 3));
const visiblePrimers = computed(() => primers.value.slice(0, 2));
</script>

<style scoped lang="sass">

.section-title
  font-size: 2rem
  font-weight: 700
  text-align: center
  @media (max-width: 768px)
    font-size: 1.5rem
    margin-bottom: 0.75rem

.list-skeleton
  height: 150px
  border-radius: 1rem

.user-skeleton
  height: 62px
  border-radius: 0.5rem

.primer-skeleton
  height: 160px
  border-radius: 0.5rem

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
