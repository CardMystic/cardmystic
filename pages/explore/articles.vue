<template>
  <UContainer class="mb-10 mt-6 max-w-full">
    <div class="text-center mb-6">
      <h1 class="text-3xl md:text-4xl font-bold mb-2">Search Articles</h1>
      <p class="text-sm md:text-base opacity-80">
        Find articles by keyword in their title or description.
      </p>
    </div>

    <div class="flex gap-2 mb-6 max-w-2xl mx-auto">
      <UInput
        v-model="searchInput"
        placeholder="Search articles by title or description…"
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
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
    >
      <USkeleton v-for="i in 6" :key="i" class="article-skeleton" />
    </div>

    <div
      v-else-if="articles.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
    >
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <UPagination
        v-model:page="page"
        :total="totalCount"
        :items-per-page="pageSize"
      />
    </div>

    <div
      v-if="hasSearched && !isLoading && articles.length === 0"
      class="empty-state"
    >
      <UIcon name="i-lucide-search-x" class="text-5xl opacity-30 mb-3" />
      <p>No articles matched "{{ debouncedQuery }}"</p>
    </div>

    <!-- Recent articles shown by default when nothing is searched -->
    <div v-if="!hasSearched">
      <USeparator class="my-6" />
      <h2
        class="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2"
      >
        Recent Articles
      </h2>
      <div
        v-if="isLoadingRecent"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        <USkeleton v-for="i in 6" :key="i" class="article-skeleton" />
      </div>
      <div
        v-else-if="recentArticles.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        <ArticleCard
          v-for="article in recentArticles"
          :key="article.id"
          :article="article"
        />
      </div>
      <div v-else class="empty-state">
        <UIcon name="i-lucide-newspaper" class="text-5xl opacity-30 mb-3" />
        <p>No articles have been published yet. Check back soon!</p>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useArticleSearch, useRecentArticles } from '~/composables/useArticles';
import { refDebounced } from '~/utils/refDebounced';
import ArticleCard from '~/components/articles/ArticleCard.vue';

definePageMeta({ title: 'Search Articles' });

useSeoMeta({
  title: 'Search Articles | CardMystic',
  description:
    'Search Magic: The Gathering articles written by the CardMystic community.',
  robots: 'noindex, follow',
});

const route = useRoute();
const router = useRouter();

const initialQuery = String(route.query.query ?? '');
const searchInput = ref(initialQuery);
const debouncedQuery = refDebounced(searchInput, 300);
const pageSize = 50;
const page = ref(1);

// Reset to page 1 whenever the query changes so users see the top matches.
watch(debouncedQuery, () => {
  page.value = 1;
});

const { articles, totalCount, totalPages, isLoading, error } = useArticleSearch(
  debouncedQuery,
  page,
  pageSize,
);

const hasSearched = computed(() => debouncedQuery.value.trim().length > 0);

// Recent articles shown as the default view when nothing is searched
const { articles: recentArticles, isLoading: isLoadingRecent } =
  useRecentArticles(12);

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
.article-skeleton
  height: 300px
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
