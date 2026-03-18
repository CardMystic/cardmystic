<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="recommend" :platform="searchPlatformProp" class="mt-6 w-full" />

      <SearchAbout :type="aboutType" />

      <!-- Not Found Warning -->
      <UAlert v-if="notFound && notFound.length" variant="outline" color="warning" icon="i-lucide-triangle-alert"
        class="mt-4 w-full" title="Some cards were not recognised" :description="notFound.join(', ')" />

      <!-- Commander Card(s) -->
      <div v-if="commanderCards && commanderCards.length" class="mt-4 flex flex-wrap gap-4 justify-center">
        <div v-for="cmd in commanderCards" :key="cmd.card_name" class="w-full max-w-75">
          <Card :card="cmd" :show-card-info="true" :hide-progress-bar="true" :hide-thumbs-down-button="true"
            :is-commander="true" />
        </div>
      </div>

      <!-- Results -->
      <SearchResults :is-loading="isLoading" :search-results="searchResults" :query-param="decklistParam"
        :skeleton-count="skeletonCount" :score-scale="descriptionParam ? 'raw' : 'normalized'"
        :hide-thumbs-down-button="true" :error-message="searchError?.message"
        :help-text="`Paste a decklist above to get ${platformName} card recommendations.`" default-group-by="type" />
    </div>
  </UContainer>
  <IssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <BackToTop />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePageInfo } from '~/composables/usePageInfo';
import { useAlsRecommend } from '~/composables/useAlsRecommend';
import type { AlsRecommendRequest } from '~/composables/useAlsRecommend';
import type { Card as CardType } from '~/models/cardModel';
import type { ScryfallCard } from '~/models/cardModel';
import { CardSearchFiltersSchema } from '~/models/searchModel';
import { isValidPlatform, getPlatformFilters, getSearchPlatformProp, getPlatformDisplayName, type Platform } from '~/utils/platformConfig';
import type { SearchAboutType } from '~/components/search/SearchAbout.vue';

const config = useRuntimeConfig();
const route = useRoute();
const platform = String(route.params.platform) as Platform;

if (!isValidPlatform(platform)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const platformName = getPlatformDisplayName(platform);
const searchPlatformProp = getSearchPlatformProp(platform);
const aboutType: SearchAboutType = platform === 'all' ? 'recommend' : `${platform}-recommend`;

const decklistParam = computed(() => String(route.query.decklist || ''));
const descriptionParam = computed(() => String(route.query.description || ''));
const commanderParam = computed(() => String(route.query.commander || ''));
const partnerCommanderParam = computed(() => String(route.query.partnerCommander || ''));
const commanderNames = computed(() => [commanderParam.value, partnerCommanderParam.value].filter(Boolean));
const firstCommanderName = computed(() => commanderParam.value || '');
const limitParam = computed(() => {
  const raw = Number(route.query.limit);
  return raw > 0 ? raw : 99;
});
const platformFilters = getPlatformFilters(platform);
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return platformFilters;
});

useSeoMeta({
  robots: () => decklistParam.value ? 'noindex, follow' : 'index, follow',
  title: () => firstCommanderName.value
    ? `${platformName} Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : `${platformName} Deck Builder & Card Recommender | CardMystic`,
  description: () => firstCommanderName.value
    ? `Get ${platformName} card recommendations for your ${firstCommanderName.value} deck!`
    : `Build your ${platformName} deck with AI-powered card recommendations.`,
  ogType: 'website',
  ogTitle: () => firstCommanderName.value
    ? `${platformName} Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : `${platformName} Deck Builder & Card Recommender | CardMystic`,
  ogDescription: () => firstCommanderName.value
    ? `Get ${platformName} card recommendations for your ${firstCommanderName.value} deck!`
    : `Build your ${platformName} deck with AI-powered card recommendations.`,
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => `${platformName} Deck Builder`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => firstCommanderName.value
    ? `${platformName} Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : `${platformName} Deck Builder & Card Recommender | CardMystic`,
  twitterDescription: () => firstCommanderName.value
    ? `Get ${platformName} card recommendations for your ${firstCommanderName.value} deck!`
    : `Build your ${platformName} deck with AI-powered card recommendations.`,
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
});

definePageMeta({ title: 'Deck Recommender' });

function parseDecklist(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\d+x?\s+/i, '').trim())
    .filter((name) => name.length > 0);
}

const alsRequest = computed<AlsRecommendRequest | undefined>(() => {
  const hasDecklist = !!decklistParam.value;
  const hasCommanders = commanderNames.value.length > 0;
  if (!hasDecklist && !hasCommanders) return undefined;
  const cards = hasDecklist ? parseDecklist(decklistParam.value) : [];
  if (hasDecklist && cards.length === 0) return undefined;
  return {
    cards: cards.length > 0 ? cards : undefined,
    limit: limitParam.value,
    query: descriptionParam.value || undefined,
    commanders: hasCommanders ? commanderNames.value : undefined,
    filters: parsedFilters.value,
  };
});

const skeletonCount = ref(20);

const { searchResults, isLoading, error: searchError, notFound } = useAlsRecommend(alsRequest);

const { data: commanderCards } = useQuery({
  queryKey: computed(() => ['commander-cards', commanderNames.value]),
  queryFn: async (): Promise<CardType[]> => {
    const results = await Promise.all(
      commanderNames.value.map(async (name) => {
        try {
          const cardData = await $fetch<ScryfallCard>(
            `${config.public.backendUrl}/cards/name/${encodeURIComponent(name)}`,
          );
          return { card_name: name, card_data: cardData } as CardType;
        } catch {
          return null;
        }
      })
    );
    return results.filter((r): r is CardType => r !== null);
  },
  enabled: computed(() => commanderNames.value.length > 0),
  staleTime: 1000 * 60 * 15,
});

const { setPageInfo, getPageInfo } = usePageInfo();
const { saveSearchQuery } = useSearchType();

watch(() => route.query, (query) => {
  if (query.decklist || query.commander) saveSearchQuery('recommend', query);
}, { immediate: true });

watch([decklistParam, commanderParam], ([newDecklist, newCommander]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `${platformName} Deck Builder: ${newCommander || 'Custom Deck'}`,
    query: newDecklist,
    labels: [platform, 'deck recommender'],
  });
}, { immediate: true });

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}
</script>
