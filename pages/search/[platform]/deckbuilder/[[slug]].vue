<template>
  <UContainer class="mb-6 px-0 max-w-full">
    <div class="w-full pt-4 flex flex-col items-center">
      <Search default-search-type="recommend" :platform="searchPlatformProp" class="mt-6 max-w-5xl" />

      <SearchAbout :type="aboutType" />

      <!-- Not Found Warning -->
      <UAlert v-if="notFound && notFound.length" variant="outline" color="warning" icon="i-lucide-triangle-alert"
        class="mt-4 w-full" title="Some cards were not recognised" :description="notFound.join(', ')" />

      <!-- Commander Card(s) -->
      <div v-if="commanderNames.length" class="w-full mt-4 flex flex-wrap gap-4 justify-center">
        <template v-if="commanderCardsLoading">
          <div v-for="name in commanderNames" :key="name" class="w-full max-w-50 sm:max-w-70">
            <CardSkeleton :show-card-info="true" />
          </div>
        </template>
        <template v-else-if="commanderCards && commanderCards.length">
          <div v-for="cmd in commanderCards" :key="cmd.card_name" class="w-full max-w-50 sm:max-w-70">
            <Card :card="cmd" :show-card-info="true" :hide-progress-bar="true" :hide-thumbs-down-button="true"
              :gold-highlight="true" :is-commander="true" />
          </div>
        </template>
      </div>

      <div class="mb-10 w-full">
        <!-- Results -->
        <SearchResults :show-add-to-deckbuilder-button="true" :is-loading="isLoading" :search-results="searchResults"
          :query-param="decklistParam" :hide-thumbs-down-button="true" :error-message="searchError?.message"
          :help-text="`Paste a decklist above to get ${platformName} card recommendations.`" default-group-by="type" />
      </div>

    </div>
  </UContainer>
  <LazyIssuesFab v-if="searchResults && searchResults.length" :onClick="handleFabClick" />
  <LazyBackToTop />

  <AddToDeckModal v-model:open="showSaveAllModal" :card-names="decklistCardNames" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { usePageInfo } from '~/composables/usePageInfo';
import { useAlsRecommend } from '~/composables/useAlsRecommend';
import type { AlsRecommendRequest } from '~/composables/useAlsRecommend';
import { useCardsByName } from '~/composables/useCards';
import { CardSearchFiltersSchema } from '~/models/searchModel';
import { isValidPlatform, getPlatformFilters, getSearchPlatformProp, getPlatformDisplayName, type Platform } from '~/utils/platformConfig';
import type { SearchAboutType } from '~/components/search/SearchAbout.vue';
import { parseDecklist } from '~/utils/decklist';
import { useDeckbuilder } from '~/composables/useDeckbuilder';

const { decklist: deckbuilderDecklist, showSaveAllModal } = useDeckbuilder();

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
    try {
      return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
    } catch { /* fall through to defaults on malformed input */ }
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
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => `${platformName} Deck Builder`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => firstCommanderName.value
    ? `${platformName} Deck Recommendations for ${firstCommanderName.value} | CardMystic`
    : `${platformName} Deck Builder & Card Recommender | CardMystic`,
  twitterDescription: () => firstCommanderName.value
    ? `Get ${platformName} card recommendations for your ${firstCommanderName.value} deck!`
    : `Build your ${platformName} deck with AI-powered card recommendations.`,
  twitterImage: 'https://cardmystic.com/cardmystic_cards.png',
});

definePageMeta({ title: 'Deck Recommender' });

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

// Seed the deckbuilder with the initial decklist from the URL
if (decklistParam.value) deckbuilderDecklist.value = decklistParam.value;

// Card names from the decklist textarea for "Save All to List"
const decklistCardNames = computed(() => {
  if (!deckbuilderDecklist.value.trim()) return [];
  return parseDecklist(deckbuilderDecklist.value);
});

const { searchResults, isLoading, error: searchError, notFound } = useAlsRecommend(alsRequest);

const { cards: commanderCards, isLoading: commanderCardsLoading } = useCardsByName(commanderNames);

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
