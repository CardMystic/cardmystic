<template>
  <UContainer class="mb-6 px-0">
    <div class="w-full max-w-7xl pt-4 flex flex-col items-center">
      <Search default-search-type="recommend" platform="arena" class="mt-6 w-full" />

      <SearchAbout type="arena-recommend" />

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
        :skeleton-count="skeletonCount" score-scale="normalized" :hide-thumbs-down-button="true"
        :error-message="searchError?.message" help-text="Paste a decklist above to get MTG Arena card recommendations."
        default-group-by="type" />
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

const config = useRuntimeConfig();
const route = useRoute();

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
const parsedFilters = computed(() => {
  if (route.query?.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return { isArena: true, selectedColorFilterOption: 'Contains At Least' as const };
});

useSeoMeta({
  robots: () => decklistParam.value ? 'noindex, follow' : 'index, follow',
  title: () => firstCommanderName.value
    ? `MTG Arena Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : 'MTG Arena Deck Builder & Card Recommender | CardMystic',
  description: () => firstCommanderName.value
    ? `Get MTG Arena card recommendations for your ${firstCommanderName.value} deck!`
    : 'Build your MTG Arena deck with AI-powered card recommendations. Get suggestions for Standard, Explorer, Historic, Brawl, and more.',
  ogType: 'website',
  ogTitle: () => firstCommanderName.value
    ? `MTG Arena Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : 'MTG Arena Deck Builder & Card Recommender | CardMystic',
  ogDescription: () => firstCommanderName.value
    ? `Get MTG Arena card recommendations for your ${firstCommanderName.value} deck!`
    : 'Build your MTG Arena deck with AI-powered card recommendations.',
  ogImage: 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'MTG Arena Deck Builder',
  twitterCard: 'summary_large_image',
  twitterTitle: () => firstCommanderName.value
    ? `MTG Arena Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : 'MTG Arena Deck Builder & Card Recommender | CardMystic',
  twitterDescription: () => firstCommanderName.value
    ? `Get MTG Arena card recommendations for your ${firstCommanderName.value} deck!`
    : 'Build your MTG Arena deck with AI-powered card recommendations.',
  twitterImage: 'https://cardmystic.io/cardmystic_cards.png',
})

definePageMeta({ title: 'MTG Arena Deck Builder' });

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
watch([decklistParam, commanderParam], ([newDecklist, newCommander]) => {
  setPageInfo({
    page_url: route.fullPath,
    page_name: `MTG Arena Deck Builder: ${newCommander || 'Custom Deck'}`,
    query: newDecklist,
    labels: ['arena', 'deck recommender'],
  });
}, { immediate: true });

function handleFabClick() {
  window.open(searchFeedbackUrl(getPageInfo()), '_blank');
}

const { saveSearchQuery } = useSearchType();
watch(() => route.query, (query) => {
  if (query.decklist || query.commander) saveSearchQuery('recommend', query);
}, { immediate: true });
</script>
