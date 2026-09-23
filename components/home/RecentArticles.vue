<template>
  <div v-if="isLoading || error || articles.length > 0">
    <h2 class="section-title mb-0">Recent Articles</h2>
    <p class="text-sm opacity-70 mb-4 text-center">
      Want to become a writer? Contact us on
      <a
        href="https://discord.gg/Qhcg87q88r"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline"
        >Discord</a
      >
      or by
      <a
        href="mailto:thecardmystic@gmail.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline"
        >Email</a
      >
      to get started!
    </p>

    <SearchError
      v-if="error"
      :error="error"
      title="Could not load recent articles"
      description="Please try again."
      retry-label="Retry"
      :is-retrying="isFetching"
      @retry="refetch()"
      class="mb-4"
    />

    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <USkeleton v-for="i in 4" :key="i" class="article-skeleton" />
    </div>

    <div
      v-else-if="articles.length > 0"
      class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4"
    >
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
      />
      <NuxtLink to="/explore/articles">
        <UButton
          color="primary"
          variant="outline"
          class="h-full w-full justify-center"
          icon="i-lucide-search"
        >
          Search Articles
        </UButton>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecentArticles } from '~/composables/useArticles';
import ArticleCard from '~/components/articles/ArticleCard.vue';

const { articles, isLoading, isFetching, error, refetch } =
  useRecentArticles(3);
</script>

<style scoped lang="sass">
.section-title
  font-size: 2rem
  font-weight: 700
  text-align: center
  @media (max-width: 768px)
    font-size: 1.5rem
    margin-bottom: 0.75rem

.article-skeleton
  height: 300px
  border-radius: 0.5rem
</style>
