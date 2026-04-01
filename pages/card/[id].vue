<template>
  <div class="page-wrapper py-4 flex justify-center w-full">
    <!-- Background Image -->
    <div v-if="cardArtUrl" class="fixed inset-0 z-0">
      <div class="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-60 blur-sm"
        :style="{ backgroundImage: `url(${cardArtUrl})` }"></div>
    </div>

    <div v-if="pending || (!card && !error)"
      class="flex flex-col items-center justify-center w-full min-h-[70vh] fixed inset-0 z-10">
      <div class="flex justify-center items-center mb-4">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-primary" />
      </div>
      <p class="text-white text-center">Loading card details...</p>
    </div>

    <div v-else-if="error && !pending" class="text-center py-20">
      <UIcon v-if="isNotFound" name="i-heroicons-magnifying-glass" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <UIcon v-else name="i-heroicons-exclamation-circle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 v-if="isNotFound" class="text-2xl font-bold text-white mb-2">Card Not Found</h2>
      <h2 v-else-if="isBadRequest" class="text-2xl font-bold text-white mb-2">Invalid Request</h2>
      <p v-if="isNotFound" class="mt-4 text-gray-300 max-w-150">
        We apologize, it seems the card with id: <strong>{{ cardIdParam }}</strong> doesn't exist. If you believe this
        is a mistake, please contact us at <strong>thecardmystic@gmail.com</strong>.
      </p>
      <p v-else class="mt-4 text-gray-300 max-w-150">{{ errorMessage }}</p>
      <UButton to="/search/all/ai" color="primary" class="mt-6">Back to Search</UButton>
    </div>

    <div v-else-if="card" class="grid grid-cols-1 lg:grid-cols-10 gap-2 max-w-7xl relative z-10 items-center">
      <!-- Left: Card Image -->
      <div class="lg:col-span-3 flex flex-col items-center">
        <div class="card-image-container">
          <div class="card-glow" :class="`glow-${card.rarity?.toLowerCase() || 'common'}`"></div>
          <!-- Single image that changes based on flip state -->
          <img :src="cardImageUrl" class="card-image w-60 h-84 lg:w-75 lg:h-105 rounded-2xl object-contain"
            @error="handleImageError" alt="Card image" />

          <!-- Sheen container with same dimensions as card - only for mythic -->
          <div v-if="card.rarity?.toLowerCase() === 'mythic'" class="card-sheen-container">
            <div class="card-sheen"></div>
          </div>

          <!-- use ClipboardButton component -->
          <ClipboardButton v-if="card" :card="card" />
        </div>

        <!-- Flip Button for Dual-Faced Cards -->
        <UButton v-if="isDualFaced" color="info" variant="solid" class="mt-2 flip-btn" icon="i-heroicons-arrow-path"
          size="lg" @click="flipCard">
          Flip
        </UButton>

        <!-- Printing Selection Dropdown -->
        <div v-if="printings && printings.length > 1" class="mt-2 w-full max-w-75">
          <ClientOnly>
            <USelect v-model="selectedPrinting" :items="printingOptions" placeholder="Select Printing"
              class="printing-select w-75 cursor-pointer">
              <template #item="{ item }">
                <div class="flex items-center gap-3 py-2">
                  <img :src="item.image_url" alt="Set" width="36" height="50" class="rounded shadow" />
                  <div class="flex flex-col">
                    <span class="font-semibold">{{ item.label }}</span>
                    <span v-if="item.surgefoil" class="text-xs text-blue-400">Surge Foil</span>
                    <span v-if="item.frame_effects.length" class="text-xs text-gray-400">{{ item.frame_effects.join(',')
                    }}</span>
                    <span class="text-xs text-gray-400">{{ item.subtitle }}</span>
                  </div>
                </div>
              </template>
            </USelect>
            <template #fallback>
              <USkeleton class="h-10 w-75 rounded" />
            </template>
          </ClientOnly>
        </div>

        <!-- Action Buttons + TCGPlayer - Desktop only -->
        <div class="mt-2 hidden lg:flex flex-row gap-2 w-full max-w-75 items-center">
          <UTooltip v-if="isCommander" text="Get Deck Recommendations for this Commander">
            <UButton color="primary" variant="solid" icon="i-lucide-box" size="lg" @click="getRecommendations"
              class="cursor-pointer" aria-label="Get Deck Recommendations for this Commander" />
          </UTooltip>
          <UTooltip v-if="isCommander" text="Popular Cards for this Commander">
            <UButton color="error" variant="solid" icon="i-lucide-flame" size="lg" @click="viewPopularCards"
              class="cursor-pointer" aria-label="Popular Cards for this Commander" />
          </UTooltip>
          <UTooltip text="Find similar cards">
            <UButton color="neutral" variant="solid" icon="i-mdi-cards-outline" size="lg" @click="findSimilarCards"
              class="cursor-pointer" aria-label="Find similar cards" />
          </UTooltip>
          <UButton v-if="currentPrinting && currentPrinting.tcgplayer_id"
            :to="getAffiliateLink(currentPrinting.tcgplayer_id)" external color="success" variant="solid"
            class="tcgplayer-btn flex-1" icon="i-heroicons-shopping-cart" size="lg" target="_blank"
            rel="noopener noreferrer" aria-label="Buy on TCGPlayer">
            Buy {{ tcgPriceLabel }}
          </UButton>
          <UButton v-else-if="card.name" :to="generateTCGPlayerSearchUrl(card.name)" external color="primary"
            variant="solid" class="tcgplayer-btn flex-1" icon="i-heroicons-magnifying-glass" size="lg"
            aria-label="Search on TCGPlayer">
            Search on TCGPlayer
          </UButton>
        </div>

        <!-- Price Information - Desktop only -->
        <UCard v-if="currentPrinting && (currentPrinting.prices && hasPrices)"
          class="price-card mt-2 hidden lg:block w-full max-w-75">
          <div class="price-header">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-green-500 mr-2" />
            <h3 class="price-title">Current Prices</h3>
          </div>

          <div class="price-list">
            <div v-if="currentPrinting.prices.usd || currentPrinting.prices.usd_foil" class="price-item">
              <span class="currency-label">USD:</span>
              <span class="price-value">
                <span v-if="currentPrinting.prices.usd" class="text-green-500">$</span>{{
                  currentPrinting.prices.usd }}
                <span v-if="currentPrinting.prices.usd_foil" class="foil-value ml-2">
                  <span class="dark:text-yellow-300 text-yellow-500">
                    <span v-if="currentPrinting.prices.usd" class="text-green-500">$</span>{{
                      currentPrinting.prices.usd_foil }}
                    <span class="text-sm">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="currentPrinting.prices.eur || currentPrinting.prices.eur_foil" class="price-item">
              <span class="currency-label">EUR:</span>
              <span class="price-value">
                <span v-if="currentPrinting.prices.eur" class="text-green-500">€</span>{{
                  currentPrinting.prices.eur }}
                <span v-if="currentPrinting.prices.eur_foil" class="foil-value ml-2">
                  <span class="dark:text-yellow-300 text-yellow-500">
                    <span v-if="currentPrinting.prices.usd" class="text-green-500">€</span>{{
                      currentPrinting.prices.eur_foil }}
                    <span class="text-sm">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="currentPrinting.prices.tix" class="price-item">
              <span class="currency-label">MTGO Tix:</span>
              <span class="price-value">{{ currentPrinting.prices.tix }}</span>
            </div>
          </div>
        </UCard>

      </div>

      <!-- Center: Card Details -->
      <div class="lg:col-span-7 flex flex-col">
        <UCard class="card-details-card">
          <h2 class="card-title">
            <span class="card-title-text">{{ currentName }}</span>
            <span v-if="currentManaCost">
              <ManaCost :manaCost="currentManaCost" class="ml-2" />
            </span>
          </h2>
          <div class="set-rarity-info">
            <p v-if="card.set_name" class="set-name">{{ card.set_name }}</p>
            <RarityBadge v-if="card.rarity" :rarity="card.rarity" size="medium" />
            <UTooltip v-if="card.game_changer" text="Is a Commander Game Changer">
              <UBadge size="xl" color="primary" variant="subtle">Game Changer</UBadge>
            </UTooltip>
          </div>
          <p class="card-type">
            {{ currentTypeLine }}
          </p>

          <!-- Mobile toggle button -->
          <UButton class="lg:hidden mt-2 w-full" variant="ghost" color="neutral" size="sm"
            :icon="showMobileDetails ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
            @click="showMobileDetails = !showMobileDetails">
            {{ showMobileDetails ? 'Hide Card Details' : 'Show Card Details' }}
          </UButton>

          <div v-if="currentOracleText" class="oracle-section" :class="{ 'hidden lg:block': !showMobileDetails }">
            <div class="oracle-text">
              <template v-for="(part, index) in formattedOracleText" :key="index">
                <template v-if="typeof part === 'string'">{{ part }}</template>
                <component v-else :is="part" />
              </template>
            </div>

            <div class="stats-container" v-if="currentPower && currentToughness">
              <div class="power-toughness">
                Power / Toughness:
                <span class="stats">{{ currentPower }}/{{ currentToughness }}</span>
              </div>
            </div>

            <div v-if="currentPrinting && card.artist" class="artist-info">
              <span class="artist-label">Illustrated by </span>
              <strong class="artist-name">{{ currentPrinting.artist }}</strong>
            </div>
          </div>
        </UCard>

        <!-- Action Buttons + TCGPlayer - Mobile only -->
        <div class="flex flex-row gap-2 mt-0 mb-0 lg:hidden items-center">
          <UTooltip v-if="isCommander" text="Get Deck Recommendations for this Commander">
            <UButton color="primary" variant="solid" icon="i-lucide-box" size="lg" @click="getRecommendations"
              class="cursor-pointer" aria-label="Get Deck Recommendations for this Commander" />
          </UTooltip>
          <UTooltip v-if="isCommander" text="Popular Cards for this Commander">
            <UButton color="error" variant="solid" icon="i-lucide-flame" size="lg" @click="viewPopularCards"
              class="cursor-pointer" aria-label="Popular Cards for this Commander" />
          </UTooltip>
          <UTooltip text="Find similar cards">
            <UButton color="neutral" variant="solid" icon="i-mdi-cards-outline" size="lg" @click="findSimilarCards"
              class="cursor-pointer" aria-label="Find similar cards" />
          </UTooltip>
          <UButton v-if="currentPrinting && currentPrinting.tcgplayer_id"
            :to="getAffiliateLink(currentPrinting.tcgplayer_id)" external color="success" variant="solid"
            class="tcgplayer-btn flex-1" icon="i-heroicons-shopping-cart" size="lg" target="_blank"
            rel="noopener noreferrer" aria-label="Buy on TCGPlayer">
            Buy {{ tcgPriceLabel }}
          </UButton>
          <UButton v-else-if="card.name" :to="generateTCGPlayerSearchUrl(card.name)" external color="primary"
            variant="solid" class="tcgplayer-btn flex-1" icon="i-heroicons-magnifying-glass" size="lg"
            aria-label="Search on TCGPlayer">
            Search on TCGPlayer
          </UButton>
        </div>

        <!-- Price Information - Mobile only -->
        <UCard v-if="currentPrinting && (currentPrinting.prices && hasPrices)" class="price-card lg:hidden"
          :class="{ 'hidden': !showMobileDetails }">
          <div class="price-header">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-green-500 mr-2" />
            <h4 class="price-title">Current Prices</h4>
          </div>

          <div class="price-list">
            <div v-if="currentPrinting.prices.usd || currentPrinting.prices.usd_foil" class="price-item">
              <span class="currency-label">USD:</span>
              <span class="price-value">
                <span v-if="currentPrinting.prices.usd" class="text-green-500">$</span>{{
                  currentPrinting.prices.usd
                }}
                <span v-if="currentPrinting.prices.usd_foil" class="foil-value ml-2">
                  <span class="dark:text-yellow-300 text-yellow-500">
                    <span v-if="currentPrinting.prices.usd" class="text-green-500">$</span>{{
                      currentPrinting.prices.usd_foil
                    }} <span class="text-sm">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="currentPrinting.prices.eur || currentPrinting.prices.eur_foil" class="price-item">
              <span class="currency-label">EUR:</span>
              <span class="price-value">
                <span v-if="currentPrinting.prices.eur" class="text-green-500">€</span>{{
                  currentPrinting.prices.eur
                }}
                <span v-if="currentPrinting.prices.eur_foil" class="foil-value ml-2">
                  <span class="dark:text-yellow-300 text-yellow-500">
                    <span v-if="currentPrinting.prices.usd" class="text-green-500">€</span>{{
                      currentPrinting.prices.eur_foil
                    }} <span class="text-sm">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="currentPrinting.prices.tix" class="price-item">
              <span class="currency-label">MTGO Tix:</span>
              <span class="price-value">{{ currentPrinting.prices.tix }}</span>
            </div>
          </div>
        </UCard>

        <UCard class="legalities-card" :class="{ 'hidden lg:block': !showMobileDetails }">
          <div class="legalities-header">
            <UIcon name="i-heroicons-scale" class="w-6 h-6 text-primary mr-2" />
            <h3 class="legalities-title">Legalities</h3>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-1 p-1">
            <div v-for="(format, name) in legalities" :key="name">
              <div class="legality-item">
                <UBadge class="legality-chip" :color="getLegalityColor(format)" variant="solid" size="xs">
                  {{ format }}
                </UBadge>
                <span class="format-name">{{ standardizeFormatName(name) }}</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
      <div class="lg:col-span-10 flex flex-col items-center">
        <!-- Commander: Tabbed Recommended + Similar Cards -->
        <UCard v-if="card && isCommander" class="similar-cards-section w-full px-1 lg:px-0 mb-12">
          <UTabs v-model="activeCommanderTab" :items="cardTabs">
            <template #recommended>
              <h3
                class="sm:hidden text-center text-sm font-semibold py-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                Deck Recommendations</h3>
              <div class="recommend-section flex gap-2 mt-2 mb-4">
                <UInput v-model="recommendQuery" placeholder="e.g. ramp, removal, card draw..." class="flex-1 text-base"
                  icon="i-lucide-box" @keyup.enter="applyRecommendQuery" />
                <UButton color="primary" icon="i-lucide-box" @click="applyRecommendQuery"
                  :loading="isRecommendedLoading" class="text-base">
                  Recommend
                </UButton>
              </div>
              <div class="flex justify-end mb-2">
                <button type="button" class="text-xs text-gray-400 underline cursor-pointer hover:text-white"
                  @click="getRecommendations">Go To Full Search Page</button>
              </div>
              <ClientOnly>
                <SearchResults :is-loading="isRecommendedCardsEffectivelyLoading"
                  :search-results="recommendedCards ?? undefined" :query-param="cardName ?? null" :skeleton-count="8"
                  :hide-thumbs-down-button="true" default-group-by="type" />
                <template #fallback>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <CardSkeleton v-for="i in 8" :key="`skeleton-rec-${i}`" :showCardInfo="true" />
                  </div>
                </template>
              </ClientOnly>
            </template>

            <template #popular>
              <h3 class="sm:hidden text-center text-sm font-semibold py-1.5 rounded-lg bg-red-500/20 text-red-300">
                Popular Cards</h3>
              <div class="flex justify-end mt-2 mb-2">
                <button type="button" class="text-xs text-gray-400 underline cursor-pointer hover:text-white"
                  @click="viewPopularCards">Go
                  To Full Search Page</button>
              </div>
              <ClientOnly>
                <SearchResults :is-loading="isPopularCardsEffectivelyLoading"
                  :search-results="popularCards ?? undefined" :query-param="cardName ?? null" :skeleton-count="8"
                  :hide-thumbs-down-button="true" default-group-by="type" />
                <template #fallback>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <CardSkeleton v-for="i in 8" :key="`skeleton-pop-${i}`" :showCardInfo="true" />
                  </div>
                </template>
              </ClientOnly>
            </template>

            <template #similar>
              <h3 class="sm:hidden text-center text-sm font-semibold py-1.5 rounded-lg bg-white/20 text-white">Similar
                Cards</h3>
              <div class="flex justify-end mt-2 mb-2">
                <button type="button" class="text-xs text-gray-400 underline cursor-pointer hover:text-white"
                  @click="findSimilarCards">Go
                  To Full Search Page</button>
              </div>
              <ClientOnly>
                <SearchResults :is-loading="isSimilarCardsEffectivelyLoading" :search-results="filteredSimilarCards"
                  :query-param="cardName ?? null" :skeleton-count="8" :hide-thumbs-down-button="true"
                  default-group-by="type" :is-similarity-search="true" hide-searched-card />
                <template #fallback>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <CardSkeleton v-for="i in 8" :key="`skeleton-sim-${i}`" :showCardInfo="true" />
                  </div>
                </template>
              </ClientOnly>
            </template>

            <template #popular-commanders>
              <h3 class="sm:hidden text-center text-sm font-semibold py-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                Popular Commanders</h3>
              <div class="flex gap-2 mt-2 mb-4">
                <UInput v-model="popularCommandersQuery" placeholder="e.g. aggro, lifegain, tokens..."
                  class="flex-1 text-base" icon="i-lucide-search" @keyup.enter="applyPopularCommandersQuery" />
                <UButton color="primary" icon="i-lucide-search" @click="applyPopularCommandersQuery"
                  :loading="isPopularCommandersLoading" class="text-base">
                  Search
                </UButton>
              </div>
              <ClientOnly>
                <SearchResults :is-loading="isPopularCommandersEffectivelyLoading"
                  :search-results="popularCommandersForCard ?? undefined" :query-param="cardName ?? null"
                  :skeleton-count="8" :hide-thumbs-down-button="true" default-group-by="colorIdentity" />
                <template #fallback>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <CardSkeleton v-for="i in 8" :key="`skeleton-popcmd-cmd-${i}`" :showCardInfo="true" />
                  </div>
                </template>
              </ClientOnly>
            </template>
          </UTabs>
        </UCard>

        <!-- Non-commander: Popular Commanders + Similar Cards -->
        <UCard v-else-if="card" class="similar-cards-section w-full px-1 lg:px-0 mb-12">
          <UTabs v-model="activeNonCommanderTab" :items="nonCommanderTabs">
            <template #popular-commanders>
              <h3 class="sm:hidden text-center text-sm font-semibold py-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                Popular Commanders</h3>
              <div class="flex gap-2 mt-2 mb-4">
                <UInput v-model="popularCommandersQuery" placeholder="e.g. aggro, lifegain, tokens..."
                  class="flex-1 text-base" icon="i-lucide-search" @keyup.enter="applyPopularCommandersQuery" />
                <UButton color="primary" icon="i-lucide-search" @click="applyPopularCommandersQuery"
                  :loading="isPopularCommandersLoading" class="text-base">
                  Search
                </UButton>
              </div>
              <ClientOnly>
                <SearchResults :is-loading="isPopularCommandersEffectivelyLoading"
                  :search-results="popularCommandersForCard ?? undefined" :query-param="cardName ?? null"
                  :skeleton-count="8" :hide-thumbs-down-button="true" default-group-by="colorIdentity" />
                <template #fallback>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <CardSkeleton v-for="i in 8" :key="`skeleton-popcmd-${i}`" :showCardInfo="true" />
                  </div>
                </template>
              </ClientOnly>
            </template>

            <template #similar>
              <h3 class="sm:hidden text-center text-sm font-semibold py-1.5 rounded-lg bg-white/20 text-white">Similar
                Cards</h3>
              <div class="flex justify-end mt-2 mb-2">
                <button type="button" class="text-xs text-gray-400 underline cursor-pointer hover:text-white"
                  @click="findSimilarCards">Go
                  To Full Search Page</button>
              </div>
              <ClientOnly>
                <SearchResults :is-loading="isSimilarCardsEffectivelyLoading" :search-results="filteredSimilarCards"
                  :query-param="cardName ?? null" :skeleton-count="8" :hide-thumbs-down-button="true"
                  default-group-by="type" :is-similarity-search="true" hide-searched-card />
                <template #fallback>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <CardSkeleton v-for="i in 8" :key="`skeleton-${i}`" :showCardInfo="true" />
                  </div>
                </template>
              </ClientOnly>
            </template>
          </UTabs>
        </UCard>
      </div>
    </div>
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { CardFormatType, FetchError, ScryfallCard } from '~/models/cardModel';
import { DefaultLimitSimilarity } from '~/models/searchModel';
import { getAffiliateLink, generateTCGPlayerSearchUrl } from '@/utils/tcgPlayer';
import { getCardImageUrl, getCardArtUrl, formatsToIgnore, getLegalityColor, standardizeFormatName } from '@/utils/scryfall';

const route = useRoute();
const router = useRouter();
const isFlipped = ref(false);
const showMobileDetails = ref(false);
const selectedPrinting = ref<string>('');

const cardIdParam = computed(() => String(route.params.id) || '');
const { saveCardViewMutation } = useCardHistory();

const { card, printings, error, pending } = useCardDetails(cardIdParam);

// Check if error is a 404 Not Found
const isNotFound = computed(() => {
  if (!error.value) return false;
  const err = error.value as FetchError;
  return err?.statusCode === 404 || err?.status === 404 || err?.data?.statusCode === 404;
});

// Check if error is a 400 Bad Request and get its message
const isBadRequest = computed(() => {
  if (!error.value) return false;
  const err = error.value as FetchError;
  return err?.statusCode === 400 || err?.status === 400 || err?.data?.statusCode === 400;
});

const errorMessage = computed(() => {
  if (!error.value) return '';
  const err = error.value as FetchError;
  return err?.data?.message || err?.message || 'An error occurred';
});

const canonicalUrl = computed(() =>
  `https://cardmystic.com/card/${card.value?.id ?? cardIdParam.value}`
);
// Dynamic SEO meta based on card data
useSeoMeta({
  title: () => card.value ? `${card.value.name} (MTG) - CardMystic` : 'MTG Card Details | CardMystic',
  description: () => {
    if (!card.value) return 'Explore Magic: The Gathering cards on CardMystic';
    const oracle = card.value.oracle_text || card.value.card_faces?.[0]?.oracle_text || '';
    const type = card.value.type_line || '';
    const base = `${card.value.name} | ${type} | ${oracle.slice(0, 100)}${oracle.length > 100 ? '...' : ''}`;
    return `${base} Find similar cards and deck recommendations.`;
  },
  ogTitle: () => card.value ? `${card.value.name} (MTG) - CardMystic` : 'MTG Card Details | CardMystic',
  ogDescription: () =>
    card.value
      ? `View ${card.value.name}, a ${card.value.type_line || 'Magic: The Gathering card'}, with similar cards, deck recommendations, oracle text, and deckbuilding tools on CardMystic.`
      : 'View Magic: The Gathering card details with similar cards, deck recommendations, and deckbuilding tools on CardMystic.',
  ogType: 'website',
  ogImage: () => card.value?.image_uris?.normal || card.value?.card_faces?.[0]?.image_uris?.normal || 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () =>
    card.value
      ? `${card.value.name} MTG card artwork`
      : 'CardMystic Magic: The Gathering card search',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    card.value
      ? `${card.value.name} | MTG Card`
      : 'MTG Card Details | CardMystic',

  twitterDescription: () =>
    card.value
      ? `View ${card.value.name} with similar cards, deck recommendations, oracle text, and deckbuilding tools on CardMystic.`
      : 'Search and explore Magic: The Gathering cards with similar cards and deck recommendations on CardMystic.',

  twitterImage: () =>
    card.value?.image_uris?.normal ||
    card.value?.card_faces?.[0]?.image_uris?.normal ||
    'https://cardmystic.com/cardmystic_cards.png'
})

// Add JSON-LD structured data for better SEO and rich snippets
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value,
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => {
        if (!card.value) return '';
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: card.value.name,
          description: card.value.oracle_text || card.value.card_faces?.[0]?.oracle_text || '',
          image: card.value?.image_uris?.normal || card.value?.card_faces?.[0]?.image_uris?.normal || 'https://cardmystic.com/cardmystic_cards.png',
          url: canonicalUrl.value,
          brand: {
            '@type': 'Brand',
            name: 'Magic: The Gathering'
          },
          manufacturer: {
            '@type': 'Organization',
            name: 'Wizards of the Coast'
          },
          category: card.value.type_line || 'Trading Card',
        });
      },
    }
  ]
});

// Save card view to history when card is loaded
watch(card, (newCard) => {
  if (newCard?.id) {
    saveCardViewMutation.mutate(newCard.id);
  }
}, { immediate: true });

// Watch for card changes to set initial selected printing
watch([card, printings], ([newCard, newPrintings]) => {
  if (newCard && newPrintings && newPrintings.length > 0) {
    // Always update selected printing to current card or first available
    const currentPrintingMatch = newPrintings.find(p => p.id === newCard.id);
    selectedPrinting.value = currentPrintingMatch ? currentPrintingMatch.id : newPrintings[0].id;
  }
}, { immediate: true });

// Computed property for printing dropdown options
const printingOptions = computed(() => {
  if (!printings.value) return [];

  return printings.value.map(printing => ({
    value: printing.id,
    label: `${printing.set_name || 'Unknown Set'} (${printing.set?.toUpperCase() || 'UNK'})`,
    subtitle: printing.released_at ? new Date(printing.released_at).getFullYear().toString() : 'Unknown',
    image_url: printing.image_uris?.small || printing.card_faces?.[0]?.image_uris?.small || '',
    frame_effects: printing.frame_effects?.filter((d) => { return d != 'legendary' }) || [],
    surgefoil: printing.promo_types?.includes("surgefoil") ? true : false,
  }));
});

// Get current selected printing data
const currentPrinting = computed(() => {
  if (!printings.value || !selectedPrinting.value) return card.value;
  return printings.value.find(p => p.id === selectedPrinting.value) || card.value;
});

// image URL that updates when currentPrinting or isFlipped change
const cardImageUrl = computed(() => {
  const printingData = currentPrinting.value;
  if (!printingData) return '';
  return getCardImageUrl(printingData as ScryfallCard, isFlipped.value);
});

// Art URL for background
const cardArtUrl = computed(() => {
  const printingData = currentPrinting.value;
  if (!printingData) return '';
  return getCardArtUrl(printingData as ScryfallCard, isFlipped.value);
});

const { setPageInfo } = usePageInfo();
watchEffect(() => {
  if (card.value) {
    setPageInfo({
      page_url: route.fullPath,
      page_name: card.value?.name || 'Card',
      card_name: card.value?.name || '',
      labels: ['card details'],
    });
  }
});

const legalities = computed(() => {
  if (!card.value?.legalities) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(card.value.legalities)) {
    const format = key.charAt(0).toUpperCase() + key.slice(1);
    if (!formatsToIgnore.includes(format as CardFormatType)) {
      result[format] = (value as string).toUpperCase().replaceAll('_', ' '); // normalize casing
    }
  }
  return result;
});

const hasPrices = computed(() => {
  if (!currentPrinting.value?.prices) return false;
  const prices = currentPrinting.value.prices;
  return (
    prices.usd || prices.usd_foil || prices.eur || prices.eur_foil || prices.tix
  );
});

const tcgPriceLabel = computed(() => {
  const price = currentPrinting.value?.prices?.usd || currentPrinting.value?.prices?.usd_foil;
  return price ? `($${price})` : '';
});

// Computed properties for current face data using current printing
const currentFace = computed(() => {
  const cardData = currentPrinting.value;
  if (!cardData) return null;

  // If it's a dual-faced card, return the appropriate face
  if (isDualFaced.value && cardData.card_faces) {
    return isFlipped.value
      ? cardData.card_faces[1]
      : cardData.card_faces[0];
  }

  // For single-faced cards, return the card itself
  return cardData;
});

const currentManaCost = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.mana_cost || '';
});

const currentOracleText = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.oracle_text || '';
});

const currentTypeLine = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.type_line || '';
});

const currentName = computed(() => {
  if (!currentFace.value) return '';

  // For dual-faced cards, show the face name
  if (isDualFaced.value && 'name' in currentFace.value) {
    return currentFace.value.name;
  }

  // For single-faced cards, show the card name
  return currentPrinting.value?.name || '';
});

const currentPower = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.power || '';
});

const currentToughness = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.toughness || '';
});

const formattedOracleText = computed(() => {
  return formatSymbols(currentOracleText.value);
});

const isDualFaced = computed(() => {
  const cardData = currentPrinting.value || card.value;
  const isDualFacedCard = cardData?.card_faces && cardData.card_faces.length >= 2;
  return isDualFacedCard;
});

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();

// Tab activation tracking - only fetch data for tabs the user has viewed
const activeCommanderTab = ref('recommended');
const activeNonCommanderTab = ref('similar');
const activatedTabs = reactive(new Set<string>(['recommended', 'similar']));

watch(activeCommanderTab, (tab) => { activatedTabs.add(tab); });
watch(activeNonCommanderTab, (tab) => { activatedTabs.add(tab); });

function findSimilarCards() {
  if (!card.value) return;

  const queryParams = {
    card_name: card.value.name,
    limit: String(DefaultLimitSimilarity),
  };

  saveSearchQuery('similarity', queryParams);
  router.push({ path: '/search/all/similarity', query: queryParams });
}

function getRecommendations() {
  if (!card.value?.name) return;
  const queryParams = { commander: card.value.name };
  saveSearchQuery('recommend', queryParams);
  saveSearchMutation.mutate({
    query: card.value.name,
    searchType: 'recommend',
    filters: { commander: card.value.name },
  });
  router.push({ path: '/search/all/deckbuilder', query: queryParams });
}

function viewPopularCards() {
  if (!card.value?.name) return;
  router.push({ path: '/popular-by-commander/all', query: { commander: card.value.name } });
}

// Use the similar cards composable - only fetch when 'similar' tab has been activated
const cardName = computed(() => card.value?.name);
const lazyCardNameForSimilar = computed(() => activatedTabs.has('similar') ? cardName.value : undefined);
const { similarCards, isSimilarCardsLoading } = useSimilarCards(cardIdParam, lazyCardNameForSimilar);

const isSimilarCardsEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('similar')) return false;
  return isSimilarCardsLoading.value || (!similarCards.value && !!cardName.value);
});

// Filter out the first card (the card being viewed) from similar cards
const filteredSimilarCards = computed(() => {
  if (!similarCards.value || similarCards.value.length <= 1) return undefined;
  const [, ...rest] = similarCards.value;
  return rest;
});

// Commander detection
const { data: commandersSet } = useCommandersSet();
const isCommander = computed(() => {
  if (!card.value?.name || !commandersSet.value) return false;
  return commandersSet.value.has(card.value.name);
});

const cardTabs = [
  { value: 'recommended', label: 'RCM', icon: 'i-lucide-box', slot: 'recommended' },
  { value: 'popular', label: 'POP', icon: 'i-lucide-flame', slot: 'popular' },
  { value: 'similar', label: 'SIM', icon: 'i-mdi-cards-outline', slot: 'similar' },
  { value: 'popular-commanders', label: 'CMD', icon: 'i-lucide-crown', slot: 'popular-commanders' },
];

const nonCommanderTabs = [
  { value: 'similar', label: 'Similar Cards', icon: 'i-mdi-cards-outline', slot: 'similar' },
  { value: 'popular-commanders', label: 'Commanders', icon: 'i-lucide-crown', slot: 'popular-commanders' },
];

// ALS Recommend for commanders
const recommendQuery = ref('');
const appliedRecommendQuery = ref('');

function applyRecommendQuery() {
  appliedRecommendQuery.value = recommendQuery.value.trim();
}

const alsRecommendRequest = computed(() => {
  if (!activatedTabs.has('recommended')) return undefined;
  if (!isCommander.value || !card.value?.name) return undefined;
  return {
    commanders: [card.value.name],
    limit: 99,
    query: appliedRecommendQuery.value || undefined,
  };
});

const { searchResults: recommendedCards, isLoading: isRecommendedLoading } = useAlsRecommend(alsRecommendRequest);

const isRecommendedCardsEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('recommended')) return false;
  return isRecommendedLoading.value || (!recommendedCards.value && isCommander.value);
});

// Popular cards for this commander
const popularByCommanderRequest = computed(() => {
  if (!activatedTabs.has('popular')) return undefined;
  if (!isCommander.value || !card.value?.name) return undefined;
  return {
    commanders: [card.value.name],
    limit: 40,
  };
});

const { searchResults: popularCards, isLoading: isPopularCardsLoading } = usePopularByCommander(popularByCommanderRequest);

const isPopularCardsEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('popular')) return false;
  return isPopularCardsLoading.value || (!popularCards.value && isCommander.value);
});

// Popular commanders for this card (non-commander cards)
const popularCommandersQuery = ref('');
const appliedPopularCommandersQuery = ref('');

function applyPopularCommandersQuery() {
  appliedPopularCommandersQuery.value = popularCommandersQuery.value.trim();
}

const popularCommandersForCardRequest = computed(() => {
  if (!activatedTabs.has('popular-commanders')) return undefined;
  if (!card.value?.name) return undefined;
  return {
    card_name: card.value.name,
    limit: 40,
    query: appliedPopularCommandersQuery.value || undefined,
  };
});

const { searchResults: popularCommandersForCard, isLoading: isPopularCommandersLoading } = usePopularCommandersForCard(popularCommandersForCardRequest);

const isPopularCommandersEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('popular-commanders')) return false;
  return isPopularCommandersLoading.value || (!popularCommandersForCard.value && !!card.value?.name);
});

</script>

<style scoped lang="sass">
.card-image-container
  position: relative
  display: inline-block
  overflow: visible
  padding: 10px
  margin: -10px

.card-glow
  position: absolute
  top: 5px
  left: 5px
  right: 5px
  bottom: 5px
  border-radius: 25px
  filter: blur(15px)
  z-index: 0

.card-sheen-container
  position: absolute
  top: 10px
  left: 10px
  right: 10px
  bottom: 10px
  border-radius: 20px
  overflow: hidden
  z-index: 2
  pointer-events: none

.card-sheen
  position: absolute
  top: -20%
  left: -100%
  width: 25%
  height: 140%
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.4), transparent)
  animation: sheen 6s infinite
  pointer-events: none
  transform: rotate(45deg)

// Rarity-based glow colors
.glow-common
  background: linear-gradient(45deg, rgba(44, 44, 44, 0.3), rgba(66, 66, 66, 0.3), rgba(88, 88, 88, 0.3))
  animation: glowPulse 4s ease-in-out infinite alternate

.glow-uncommon
  background: linear-gradient(45deg, rgba(192, 192, 192, 0.3), rgba(169, 169, 169, 0.3), rgba(211, 211, 211, 0.3))
  animation: glowPulse 4s ease-in-out infinite alternate

.glow-rare
  background: linear-gradient(45deg, rgba(255, 215, 0, 0.4), rgba(255, 176, 0, 0.4), rgba(255, 193, 7, 0.4))
  animation: glowPulseRare 3s ease-in-out infinite alternate

.glow-mythic
  background: linear-gradient(45deg, rgba(255, 140, 0, 0.5), rgba(255, 107, 53, 0.5), rgba(255, 69, 0, 0.5))
  animation: glowPulseMythic 2.5s ease-in-out infinite alternate

.card-image
  border-radius: 20px !important
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2)
  position: relative
  z-index: 1
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) // <-- added transition
  transform-origin: center center // <-- ensure smooth centered scaling

// Scale image slightly on hover of the container
.card-image-container:hover .card-image
  transform: scale(1.03)

// Card Details Card Styling (header + description combined)
.card-details-card
  border-radius: 24px
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 8px
  background: var(--ui-bg)
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1)

.card-title
  font-size: 2.2rem
  font-weight: 700
  margin-bottom: 4px
  @media (max-width: 1023px)
    font-size: 1.6rem

.card-title-text
  margin-right: 8px
  text-shadow: 0 4px 8px rgba(147, 114, 255, 0.3)

.set-rarity-info
  display: flex
  gap: 16px
  align-items: center
  margin-bottom: 8px

.set-name
  font-size: 0.9rem
  font-weight: 400
  margin: 0
  font-style: italic

.card-type
  font-size: 1.1rem
  font-weight: 500
  margin: 0

// Oracle Section (within combined card details card)
.oracle-section
  margin-top: 16px
  padding-top: 16px
  border-top: 1px solid rgba(147, 114, 255, 0.2)

.oracle-text
  font-size: 0.95rem
  line-height: 1.2
  margin-bottom: 16px

  br
    display: block
    content: ""
    margin-top: 0.5em

// Stats and Artist Info
.stats-container
  margin-top: 20px

.power-toughness
  font-size: 0.95rem
  font-weight: 600

.stats
  font-weight: 700
  font-size: 1rem

.artist-info
  margin-top: 16px
  padding-top: 16px
  border-top: 1px solid rgba(147, 114, 255, 0.2)

.artist-label
  font-size: 0.9rem

.artist-name
  font-size: 1rem

// Legalities Card
.legalities-card
  border-radius: 24px
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 0
  background: var(--ui-bg)
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1)

.legalities-header
  display: flex
  align-items: center
  margin-bottom: 8px

.legalities-title
  font-size: 1.3rem
  font-weight: 600
  margin: 0

// Legality Items
.legality-item
  display: flex
  flex-direction: row
  align-items: center
  text-align: center

.legality-chip
  font-size: 9px !important
  font-weight: 600
  min-width: 77.5px
  text-transform: uppercase
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
  justify-content: center
  @media (max-width: 768px)
    font-size: 8px !important
    min-width: 71.2px

.format-name
  font-size: 11px
  font-weight: bold
  text-align: center
  margin-left: 4px
  @media (max-width: 768px)
    font-size: 10px

// Price Card Styling
.price-card
  border-radius: 24px
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 8px
  background: var(--ui-bg)
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1)

.price-header
  display: flex
  align-items: center
  margin-bottom: 12px

.price-title
  font-size: 1.3rem
  font-weight: 600

.price-list
  display: flex
  flex-direction: column
  gap: 8px

.price-item
  display: flex
  justify-content: space-between
  align-items: center
  padding: 0px

.currency-label
  font-size: 0.9rem
  font-weight: 500

.price-value
  font-size: 1rem
  font-weight: 700

// Flip Button Styling
.flip-btn
  width: 100%
  max-width: 280px
  font-weight: 600
  text-transform: none
  letter-spacing: 0.5px
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3)

  &:hover
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.5)
    transform: translateY(-2px)

// Price Card Mobile Styling
@media (max-width: 1023px)
  .price-card
    max-width: none !important
    width: 100%

.printing-select
  width: 100%
  min-width: 280px

// TCGPlayer Button Styling
.tcgplayer-btn
  width: 100%
  max-width: 280px
  font-weight: 600
  text-transform: none
  letter-spacing: 0.5px
  box-shadow: 0 4px 12px rgba(147, 114, 255, 0.3)

  &:hover
    box-shadow: 0 6px 16px rgba(147, 114, 255, 0.5)
    transform: translateY(-2px)

@media (max-width: 1023px)
  .tcgplayer-btn
    max-width: none !important

@keyframes glowPulse
  0%
    opacity: 0.7
    transform: scale(1)
  100%
    opacity: 0.9
    transform: scale(1.02)

@keyframes glowPulseRare
  0%
    opacity: 0.7
    transform: scale(1)
  100%
    opacity: 0.9
    transform: scale(1.02)

@keyframes glowPulseMythic
  0%
    opacity: 0.8
    transform: scale(1)
  100%
    opacity: 1.0
    transform: scale(1.04)

@keyframes sheen
  0%
    left: -100%
    opacity: 0
  5%
    opacity: 1
  20%
    left: 200%
    opacity: 1
  25%
    opacity: 0
  100%
    left: 200%
    opacity: 0

// Page wrapper with background
.page-wrapper
  position: relative
  min-height: 100vh
  
// Similar Cards Section Styling
.similar-cards-section
  border-radius: 24px
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  background: var(--ui-bg)
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1)

  @media (max-width: 1023px)
    :deep(> div)
      padding-left: 1px
      padding-right: 1px

// Recommend section font sizing
.recommend-section
  font-size: 1rem

  :deep(input)
    font-size: 1rem

  :deep(button)
    font-size: 1rem

</style>