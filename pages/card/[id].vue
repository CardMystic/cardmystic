<template>
  <div class="page-wrapper py-4 flex justify-center w-full">
    <!-- Background Image -->
    <div v-if="cardArtUrl" class="fixed inset-0 z-0">
      <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
        :style="{ backgroundImage: `url(${cardArtUrl})` }"></div>
    </div>

    <div v-if="pending || (!card && !error)"
      class="flex flex-col items-center justify-center w-full min-h-[70vh] fixed inset-0 z-10">
      <div class="flex justify-center items-center mb-4">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-primary" />
      </div>
      <p class="text-white text-center">Loading card details...</p>
    </div>

    <div v-else-if="error && !pending" class="text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 text-red-500 mx-auto mb-4 cursor-pointer" />
      <p class="mt-4 text-white">{{ error }}</p>
      <UButton to="/search" color="primary" class="mt-4">Back to Search</UButton>
    </div>

    <div v-else-if="card" class="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-7xl relative z-10 items-center">
      <!-- Left: Card Image -->
      <div class="lg:col-span-3 flex flex-col items-center">
        <div class="card-image-container">
          <div class="card-glow" :class="`glow-${card.rarity?.toLowerCase() || 'common'}`"></div>
          <!-- Single image that changes based on flip state -->
          <img :src="cardImageUrl" class="card-image w-[300px] h-[420px] rounded-2xl object-contain"
            @error="handleImageError" alt="Card image" />

          <!-- Sheen container with same dimensions as card - only for mythic -->
          <div v-if="card.rarity?.toLowerCase() === 'mythic'" class="card-sheen-container">
            <div class="card-sheen"></div>
          </div>

          <!-- use ClipboardButton component -->
          <ClipboardButton v-if="card" :card="card" />
        </div>

        <!-- Flip Button for Dual-Faced Cards -->
        <UButton v-if="isDualFaced" color="info" variant="solid" class="mt-4 flip-btn" icon="i-heroicons-arrow-path"
          size="lg" @click="flipCard">
          {{ isFlipped ? 'Show Front' : 'Show Back' }}
        </UButton>

        <!-- Printing Selection Dropdown -->
        <div v-if="printings && printings.length > 1" class="mt-4 w-full max-w-[300px]">
          <USelect v-model="selectedPrinting" :items="printingOptions" placeholder="Select Printing"
            class="printing-select w-[300px] cursor-pointer">
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
        </div>

        <!-- Similar Cards Button - Desktop only -->
        <UButton color="neutral" variant="solid"
          :class="isDualFaced ? 'mt-4 similar-cards-btn' : 'mt-6 similar-cards-btn'" icon="i-mdi-cards-outline"
          size="lg" @click="findSimilarCards"
          class="hidden lg:flex similar-cards-btn-desktop w-full max-w-[300px] cursor-pointer">
          Similar Cards
        </UButton>

        <!-- Price Information - Desktop only -->
        <UCard v-if="currentPrinting && (currentPrinting.prices && hasPrices)"
          class="price-card mt-4 hidden lg:block w-full max-w-[300px]">
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
                  <span class="text-yellow-300">
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
                  <span class="text-yellow-300">
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

        <!-- TCGPlayer Button - Desktop only -->
        <UButton v-if="currentPrinting && currentPrinting.tcgplayer_id"
          :to="getAffiliateLink(currentPrinting.tcgplayer_id)" external color="success" variant="solid"
          class="mt-0 tcgplayer-btn hidden lg:flex w-full max-w-[300px]" icon="i-heroicons-shopping-cart" size="lg"
          target="_blank" rel="noopener noreferrer">
          Buy on TCGPlayer
        </UButton>

        <!-- Fallback button if no TCGPlayer ID - Desktop only -->
        <UButton v-else-if="card.name" :to="generateTCGPlayerSearchUrl(card.name)" external color="primary"
          variant="outline" class="mt-4 tcgplayer-btn hidden lg:flex w-full max-w-[300px]"
          icon="i-heroicons-magnifying-glass" size="lg">
          Search on TCGPlayer
        </UButton>
      </div>

      <!-- Center: Card Details -->
      <div class="lg:col-span-7 flex flex-col">
        <UCard class="card-header-card">
          <h2 class="card-title">
            <span class="card-title-text">{{ currentName }}</span>
            <span v-if="currentManaCost">
              <ManaCost :manaCost="currentManaCost" class="ml-2" />
            </span>
          </h2>
          <div class="set-rarity-info">
            <p v-if="card.set_name" class="set-name">{{ card.set_name }}</p>
            <RarityBadge v-if="card.rarity" :rarity="card.rarity" size="medium" />
          </div>
          <p class="card-type">
            {{ currentTypeLine }}
          </p>
        </UCard>

        <div v-if="currentOracleText" class="card-text-container">
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

        <!-- Similar Cards Button - Mobile only -->
        <UButton color="neutral" variant="solid" class="mt-0 mb-4 similar-cards-btn lg:hidden"
          icon="i-mdi-cards-outline" size="lg" @click="findSimilarCards" block>
          Similar Cards
        </UButton>

        <!-- Price Information - Mobile only -->
        <UCard v-if="currentPrinting && (currentPrinting.prices && hasPrices)" class="price-card mb-4 lg:hidden">
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
                  <span class="text-yellow-300">
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
                  <span class="text-yellow-300">
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

        <!-- TCGPlayer Button - Mobile only -->
        <UButton v-if="currentPrinting && currentPrinting.tcgplayer_id"
          :to="getAffiliateLink(currentPrinting.tcgplayer_id)" external color="success" variant="solid"
          class="mb-4 tcgplayer-btn lg:hidden" icon="i-heroicons-shopping-cart" size="lg" block>
          Buy on TCGPlayer
        </UButton>

        <!-- Fallback button if no TCGPlayer ID - Mobile only -->
        <UButton v-else-if="card.name" :to="generateTCGPlayerSearchUrl(card.name)" external color="primary"
          variant="outline" class="mb-6 tcgplayer-btn lg:hidden" icon="i-heroicons-magnifying-glass" size="lg" block>
          Search on TCGPlayer
        </UButton>

        <UCard class="legalities-card">
          <div class="legalities-header">
            <UIcon name="i-heroicons-scale" class="w-6 h-6 text-primary mr-2" />
            <h3 class="legalities-title">Legalities</h3>
          </div>

          <div class="grid grid-cols-2 gap-2 p-2">
            <div v-for="(format, name) in legalities" :key="name" class="mb-2">
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
        <!-- Similar Cards Section -->
        <UCard v-if="card" class="similar-cards-section w-full">
          <ListCardDetailsSimilarCardsResults :is-loading="isSimilarCardsLoading" :search-results="similarCards"
            :skeleton-count="8" />
        </UCard>
      </div>
    </div>
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
import BackToTop from '~/components/BackToTop.vue';
import ClipboardButton from '~/components/ClipboardButton.vue';
import ListCardDetailsSimilarCardsResults from '~/components/ListCardDetailsSimilarCardsResults.vue';
import { computed, h, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import type { CardFormatType, ScryfallCard, Card } from '~/models/cardModel';
import { DefaultLimitSimilarity, SimilaritySearchSchema } from '~/models/searchModel';
import { getAffiliateLink, generateTCGPlayerSearchUrl } from '@/utils/tcgPlayer';
import { getCardImageUrl, getCardArtUrl, formatsToIgnore, getLegalityColor, standardizeFormatName } from '@/utils/scryfall';
import { useCardHistory } from '~/composables/useCardHistory';

const route = useRoute();
const isFlipped = ref(false);
const selectedPrinting = ref<string>('');

const cardIdParam = computed(() => String(route.params.id) || '');
const { saveCardViewMutation } = useCardHistory();

const { data: cardData, error, pending } = useAsyncData(
  () => `card-with-printings-${cardIdParam.value}`,
  async () => {
    if (!cardIdParam.value || cardIdParam.value === 'undefined') {
      throw new Error('No card ID provided');
    }

    const card = await $fetch<ScryfallCard>(`/api/cards/${cardIdParam.value}`);

    let printings: ScryfallCard[] = [];
    if (card.prints_search_uri) {
      try {
        const result = await $fetch<{ data: ScryfallCard[] }>(card.prints_search_uri);
        printings = result.data || [];
      } catch (err) {
        console.error('Printings fetch failed', err);
      }
    }

    return { card, printings };
  },
  {
    server: true,
    lazy: false,
    watch: [cardIdParam]
  }
);

// Extract card and printings from combined data
const card = computed(() => cardData.value?.card);
const printings = computed(() => cardData.value?.printings || []);

const canonicalUrl = computed(() =>
  `https://cardmystic.io/card/${cardData.value?.card.oracle_id ?? cardIdParam.value}`
);
// Dynamic SEO meta based on card data
useSeoMeta({
  title: () => card.value ? `${card.value.name} (MTG) - CardMystic` : 'MTG Card Details | CardMystic',
  description: () => {
    if (!card.value) return 'Explore Magic: The Gathering cards on CardMystic';
    const oracle = card.value.oracle_text || card.value.card_faces?.[0]?.oracle_text || '';
    const type = card.value.type_line || '';
    return `${card.value.name} | ${type} | ${oracle.slice(0, 120)}${oracle.length > 120 ? '...' : ''}`;
  },
  ogTitle: () => card.value ? `${card.value.name} (MTG) - CardMystic` : 'MTG Card Details | CardMystic',
  ogDescription: () =>
    card.value
      ? `View ${card.value.name}, a ${card.value.type_line || 'Magic: The Gathering card'}, with oracle text, rulings, and deckbuilding tools on CardMystic.`
      : 'View Magic: The Gathering card details with oracle text and deckbuilding tools on CardMystic.',
  ogType: 'website',
  ogImage: () => card.value?.image_uris?.normal || card.value?.card_faces?.[0]?.image_uris?.normal || 'https://cardmystic.io/cardmystic_cards.png',
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
      ? `View ${card.value.name} and explore oracle text, rulings, and deckbuilding tools on CardMystic.`
      : 'Search and explore Magic: The Gathering cards on CardMystic.',

  twitterImage: () =>
    card.value?.image_uris?.normal ||
    card.value?.card_faces?.[0]?.image_uris?.normal ||
    'https://cardmystic.io/cardmystic_cards.png'
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
          image: card.value?.image_uris?.normal || card.value?.card_faces?.[0]?.image_uris?.normal || 'https://cardmystic.io/cardmystic_cards.png',
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

function findSimilarCards() {
  if (!card.value) return;

  // Navigate to search page with similarity search endpoint
  const queryParams = {
    card_name: card.value.name,
    limit: DefaultLimitSimilarity,
    filters: undefined, // No additional filters for similarity search
  };

  navigateTo({ path: '/search/similarity', query: queryParams });
}

// Similarity search query
const similaritySearch = computed(() => {
  if (!card.value?.name) return undefined;

  return SimilaritySearchSchema.parse({
    card_name: card.value.name,
    limit: 41, // Request 41 so we have 40 after removing the first card
    filters: undefined,
    exclude_card_data: false,
  });
});

const { data: similarCards, isLoading: isSimilarCardsLoading } = useQuery({
  queryKey: ['card-details-similar-cards', cardIdParam.value],
  queryFn: async () => {
    if (!similaritySearch.value) return [];

    const response = await fetch('/api/search/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(similaritySearch.value),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch similar cards');
    }

    const results = await response.json() as Array<Card>;
    return results;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: computed(() => !!card.value?.name),
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

// Card Header Card Styling
.card-header-card
  border-radius: 24px
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 16px

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    pointer-events: none

    @media (prefers-color-scheme: light)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.06), rgba(255, 255, 255, 0.25))

    @media (prefers-color-scheme: dark)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))

.card-title
  font-size: 2.2rem
  font-weight: 700
  margin-bottom: 4px

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

// Card Text Container
.card-text-container
  border-radius: 24px
  padding: 16px
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 16px

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    pointer-events: none

    @media (prefers-color-scheme: light)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.06), rgba(255, 255, 255, 0.25))

    @media (prefers-color-scheme: dark)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))

.oracle-text
  font-size: 1.1rem
  line-height: 1.2
  margin-bottom: 16px

  br
    display: block
    content: ""
    margin-top: 0.5em

.flavor-text
  color: rgba(147, 114, 255, 0.9)
  font-style: italic
  font-size: 1rem
  line-height: 1.5
  display: block
  margin-top: 16px
  padding-top: 16px
  border-top: 1px solid rgba(147, 114, 255, 0.2)

// Stats and Artist Info
.stats-container
  margin-top: 20px

.power-toughness
  font-size: 1.1rem
  font-weight: 600

.stats
  font-weight: 700
  font-size: 1.2rem

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
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 16px

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)
  
  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    pointer-events: none

    @media (prefers-color-scheme: light)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.06), rgba(255, 255, 255, 0.25))

    @media (prefers-color-scheme: dark)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))

.legalities-header
  display: flex
  align-items: center
  margin-bottom: 16px

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
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative
  margin-bottom: 16px

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    pointer-events: none

    @media (prefers-color-scheme: light)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.06), rgba(255, 255, 255, 0.25))

    @media (prefers-color-scheme: dark)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))

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
  padding: 4px 0

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

// Similar Cards Button Styling
.similar-cards-btn
  width: 100%
  max-width: 280px
  font-weight: 600
  text-transform: none
  letter-spacing: 0.5px
  box-shadow: 0 4px 12px rgba(147, 114, 255, 0.3)

  &:hover
    box-shadow: 0 6px 16px rgba(147, 114, 255, 0.5)
    transform: translateY(-2px)

.similar-cards-btn-desktop
  width: 100%
  max-width: 280px

// Price Card Mobile Styling
@media (max-width: 1023px)
  .price-card
    max-width: none !important
    width: 100%

.back-button-container-aligned
  display: flex
  justify-content: center
  width: 100%
  max-width: 300px
  align-self: center

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
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    pointer-events: none

    @media (prefers-color-scheme: light)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.06), rgba(255, 255, 255, 0.25))

    @media (prefers-color-scheme: dark)
      background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))

.similar-cards-header
  display: flex
  align-items: center
  margin-bottom: 16px

.similar-cards-title
  font-size: 1.3rem
  font-weight: 600

</style>