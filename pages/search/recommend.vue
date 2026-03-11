<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <!-- Shared Search Form -->
      <Search class="mt-6 w-full" />

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="decklistParam"
        :skeleton-count="skeletonCount" score-scale="normalized" :hide-thumbs-down-button="true"
        help-text="Paste a decklist above to get card recommendations." />
    </div>
  </UContainer>

  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePageInfo } from '~/composables/usePageInfo';
import { useAlsRecommend } from '~/composables/useAlsRecommend';
import type { AlsRecommendRequest } from '~/composables/useAlsRecommend';

const route = useRoute();

const decklistParam = computed(() => String(route.query.decklist || ''));
const descriptionParam = computed(() => String(route.query.description || ''));
const commanderParam = computed(() => String(route.query.commander || ''));
const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 100);

useSeoMeta({
  robots: () =>
    decklistParam.value
      ? 'noindex, follow'
      : 'index, follow',
  title: () => commanderParam.value
    ? `Deck Recommendations for ${commanderParam.value} | CardMystic`
    : 'Deck Recommender | CardMystic',
  description: () => commanderParam.value
    ? `Get card recommendations for your ${commanderParam.value} Magic: The Gathering deck!`
    : 'Get card recommendations for your Magic: The Gathering deck. Paste a decklist and discover cards that fit.',
  ogType: 'website',

  ogTitle: () => commanderParam.value
    ? `Deck Recommendations for ${commanderParam.value} | CardMystic`
    : 'Deck Recommender | CardMystic',

  ogDescription: () =>
    commanderParam.value
      ? `Get card recommendations for your ${commanderParam.value} Magic: The Gathering deck!`
      : 'Get card recommendations for your Magic: The Gathering deck. Paste a decklist and discover cards that fit.',

  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'Deck Recommender',
  twitterCard: 'summary_large_image',
  twitterTitle: () => commanderParam.value
    ? `Deck Recommendations for ${commanderParam.value} | CardMystic`
    : 'Deck Recommender | CardMystic',

  twitterDescription: () =>
    commanderParam.value
      ? `Get card recommendations for your ${commanderParam.value} Magic: The Gathering deck!.`
      : 'Get card recommendations for your Magic: The Gathering deck. Paste a decklist and discover cards that fit.',

  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({
  title: 'Deck Recommender',
});

function parseDecklist(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\d+x?\s+/i, '').trim())
    .filter((name) => name.length > 0);
}

const alsRequest = computed<AlsRecommendRequest | undefined>(() => {
  const hasDecklist = !!decklistParam.value;
  const hasCommander = !!commanderParam.value;
  if (!hasDecklist && !hasCommander) return undefined;
  const cards = hasDecklist ? parseDecklist(decklistParam.value) : [];
  if (hasDecklist && cards.length === 0) return undefined;
  return {
    cards: cards.length > 0 ? cards : undefined,
    limit: limitParam.value,
    query: descriptionParam.value || undefined,
    commander: commanderParam.value || undefined,
  };
});

const skeletonCount = ref(20);

const { searchResults, isLoading } = useAlsRecommend(alsRequest);

const { setPageInfo, getPageInfo } = usePageInfo();

watch(decklistParam, (newDecklist) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: 'Deck Recommender',
    query: newDecklist,
    labels: ['deck recommender'],
  });
}, { immediate: true });

function handleFabClick() {
  const url = searchFeedbackUrl(getPageInfo());
  window.open(url, '_blank');
}
</script>
