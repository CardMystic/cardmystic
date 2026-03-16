<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="ai" platform="arena" show-about class="mt-6 w-full" />

      <h1 class="text-2xl sm:text-3xl font-bold text-center mt-6 mb-2">{{ seoEntry.title }}</h1>
      <p class="text-gray-400 text-center mb-6 max-w-2xl">{{ seoEntry.description }}</p>

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="seoEntry.query"
        :skeleton-count="40" :error-message="searchError?.message" help-text="Loading Arena results..." />
    </div>
  </UContainer>
  <BackToTop />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { arenaMap } from '~/utils/seoQueries';
import { WordSearchSchema } from '~/models/searchModel';
import { useColbertSearch } from '~/composables/useSearch';

const route = useRoute();
const slug = String(route.params.slug);
const seoEntry = arenaMap.get(slug)!;

if (!seoEntry) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

useSeoMeta({
  robots: 'index, follow',
  title: `${seoEntry.title} | CardMystic`,
  description: seoEntry.description,
  ogType: 'website',
  ogTitle: `${seoEntry.title} | CardMystic`,
  ogDescription: seoEntry.description,
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: seoEntry.title,
  twitterCard: 'summary_large_image',
  twitterTitle: `${seoEntry.title} | CardMystic`,
  twitterDescription: seoEntry.description,
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
});

definePageMeta({
  title: 'Arena Card Search',
});

const wordSearch = computed(() =>
  WordSearchSchema.parse({
    query: seoEntry.query,
    limit: 40,
    filters: { ...seoEntry.filters, isArena: true },
    exclude_card_data: false,
  }),
);

const { searchResults, isLoading, error: searchError } = useColbertSearch(wordSearch);
</script>
