<template>
  <UContainer class="mb-10 mt-6 max-w-5xl">
    <div class="text-center mb-6">
      <h1 class="text-3xl md:text-4xl font-bold mb-2">Search Decklists</h1>
      <p class="text-sm md:text-base opacity-80">
        Find public decklists by keyword in their name or description.
      </p>
    </div>

    <div class="flex gap-2 mb-6 max-w-2xl mx-auto">
      <UInput
        v-model="searchInput"
        placeholder="Search decklists by name or description…"
        icon="i-lucide-search"
        class="flex-1"
        :ui="{ base: 'text-base h-10' }"
        @keydown.enter="syncQueryToUrl"
      />
      <UButton
        icon="i-lucide-search"
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
      <USkeleton v-for="i in 6" :key="i" class="list-skeleton" />
    </div>

    <div
      v-else-if="decklists.length > 0"
      class="grid grid-cols-1 md:grid-cols-3 gap-3"
    >
      <PublicDecklistLink
        v-for="list in decklists"
        :key="list.id"
        :decklist="list"
      />
    </div>

    <div v-else-if="hasSearched" class="empty-state">
      <UIcon name="i-lucide-search-x" class="text-5xl opacity-30 mb-3" />
      <p>No decklists matched "{{ debouncedQuery }}"</p>
    </div>

    <div v-else class="empty-state">
      <UIcon name="i-lucide-search" class="text-5xl opacity-30 mb-3" />
      <p>Enter a keyword above to search public decklists.</p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDecklistSearch } from '~/composables/useDiscovery';
import { refDebounced } from '~/utils/refDebounced';
import PublicDecklistLink from '~/components/lists/PublicDecklistLink.vue';

definePageMeta({ title: 'Search Decklists' });

useSeoMeta({
  title: 'Search Decklists | CardMystic',
  description:
    'Search public Magic: The Gathering decklists shared by the CardMystic community.',
  robots: 'noindex, follow',
});

const route = useRoute();
const router = useRouter();

const initialQuery = String(route.query.query ?? '');
const searchInput = ref(initialQuery);
const debouncedQuery = refDebounced(searchInput, 300);

const { decklists, isLoading, isFetching, error } =
  useDecklistSearch(debouncedQuery);

const hasSearched = computed(() => debouncedQuery.value.trim().length > 0);

function syncQueryToUrl() {
  const trimmed = searchInput.value.trim();
  router.replace({
    query: { ...route.query, query: trimmed || undefined },
  });
}

// Keep the URL in sync as the debounced query settles so users can share
// or bookmark a search.
watch(debouncedQuery, (value) => {
  const trimmed = value.trim();
  if ((route.query.query ?? '') === trimmed) return;
  router.replace({
    query: { ...route.query, query: trimmed || undefined },
  });
});
</script>

<style scoped lang="sass">
.list-skeleton
  height: 130px
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
