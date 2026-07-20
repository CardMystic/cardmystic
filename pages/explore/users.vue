<template>
  <UContainer class="mb-10 mt-6 max-w-full">
    <div class="text-center mb-6">
      <h1 class="text-3xl md:text-4xl font-bold mb-2">Search Users</h1>
      <p class="text-sm md:text-base opacity-80">
        Find other CardMystic users by their username.
      </p>
    </div>

    <div class="flex gap-2 mb-6 max-w-2xl mx-auto">
      <UInput
        v-model="searchInput"
        placeholder="Search users by username…"
        icon="i-lucide-user-search"
        class="flex-1"
        :ui="{ base: 'text-base h-10' }"
        @keydown.enter="syncQueryToUrl"
      />
      <UButton
        icon="i-lucide-user-search"
        class="h-10 cursor-pointer"
        :disabled="!searchInput.trim()"
        @click="syncQueryToUrl"
      >
        <span class="hidden sm:inline">Search</span>
      </UButton>
    </div>

    <div v-if="error" class="text-center text-error mb-4">
      Something went wrong while searching. Please try again.
    </div>

    <div
      v-if="isLoading || isFetching"
      class="grid grid-cols-1 md:grid-cols-3 gap-3"
    >
      <USkeleton v-for="i in 6" :key="i" class="user-skeleton" />
    </div>

    <div
      v-else-if="users.length > 0"
      class="grid grid-cols-1 md:grid-cols-3 gap-3"
    >
      <PublicUserLink
        v-for="profile in users"
        :key="profile.id"
        :profile="profile"
      />
    </div>

    <div v-else-if="hasSearched" class="empty-state">
      <UIcon name="i-lucide-search-x" class="text-5xl opacity-30 mb-3" />
      <p>No users matched "{{ debouncedQuery }}"</p>
    </div>

    <div v-else class="empty-state">
      <UIcon name="i-lucide-user-search" class="text-5xl opacity-30 mb-3" />
      <p>Enter a username above to find other CardMystic users.</p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserSearch } from '~/composables/useDiscovery';
import { refDebounced } from '~/utils/refDebounced';
import PublicUserLink from '~/components/user/PublicUserLink.vue';

definePageMeta({ title: 'Search Users' });

useSeoMeta({
  title: 'Search Users | CardMystic',
  description: 'Find other CardMystic users by their username.',
  robots: 'noindex, follow',
});

const route = useRoute();
const router = useRouter();

const initialQuery = String(route.query.query ?? '');
const searchInput = ref(initialQuery);
const debouncedQuery = refDebounced(searchInput, 300);

const { users, isLoading, isFetching, error } = useUserSearch(debouncedQuery);

const hasSearched = computed(() => debouncedQuery.value.trim().length > 0);

function syncQueryToUrl() {
  const trimmed = searchInput.value.trim();
  router.replace({
    query: { ...route.query, query: trimmed || undefined },
  });
}

watch(debouncedQuery, (value) => {
  const trimmed = value.trim();
  if ((route.query.query ?? '') === trimmed) return;
  router.replace({
    query: { ...route.query, query: trimmed || undefined },
  });
});
</script>

<style scoped lang="sass">
.user-skeleton
  height: 72px
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
</style>
