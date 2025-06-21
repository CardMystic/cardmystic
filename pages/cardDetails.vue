<template>
  <navbar />

  <!-- Back to Results button -->
  <v-container v-if="searchStore.results.length > 0" class="pt-4 pb-0">
    <v-btn
      to="/search"
      color="primary"
      variant="outlined"
      prepend-icon="mdi-arrow-left"
      class="mb-4"
    >
      Back to Results
    </v-btn>
  </v-container>

  <v-container class="py-4 d-flex justify-center">
    <div v-if="loading" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-4 text-white">Loading card details...</p>
    </div>

    <div v-else-if="error" class="text-center">
      <v-icon color="error" size="48">mdi-alert-circle</v-icon>
      <p class="mt-4 text-white">{{ error }}</p>
      <v-btn to="/search" color="primary" class="mt-4">Back to Search</v-btn>
    </div>

    <v-row
      v-else-if="card"
      style="max-width: 1400px"
      class="d-flex justify-center"
    >
      <!-- Left: Card Image -->
      <v-col
        md="4"
        class="d-flex justify-start align-center flex-column mr-6"
        style="max-width: 300px"
      >
        <div class="card-image-container">
          <div class="card-glow"></div>
          <v-img
            :src="getCardImageUrl(card)"
            class="card-image"
            max-width="300"
            min-width="300"
            max-height="420"
            min-height="420"
            rounded
            @error="handleImageError"
          >
            <template v-slot:placeholder>
              <div class="image-placeholder-large">
                <v-icon size="64" color="grey">mdi-image-off</v-icon>
                <p class="placeholder-text-large">Image not available</p>
              </div>
            </template>
          </v-img>

          <!-- Game Changer Badge -->
          <GameChangerBadge :game-changer="card.game_changer" size="large" />
        </div>

        <!-- Similar Cards Button TODO: add similar search -->
        <v-btn
          color="white"
          variant="elevated"
          class="mt-4 similar-cards-btn"
          prepend-icon="mdi-cards"
          size="large"
          @click=""
        >
          Similar Cards
        </v-btn>

        <!-- Price Information -->
        <v-card
          v-if="card.prices && hasPrices"
          elevation="4"
          class="price-card mt-4"
        >
          <div class="price-header">
            <v-icon color="success" class="mr-2" size="26">mdi-gold</v-icon>
            <h4 class="price-title">Current Prices</h4>
          </div>

          <div class="price-list">
            <div v-if="card.prices.usd" class="price-item">
              <span class="currency-label">USD:</span>
              <span class="price-value"
                ><span style="color: rgb(34, 197, 94)">$</span
                >{{ card.prices.usd }}</span
              >
            </div>

            <div v-if="card.prices.usd_foil" class="price-item">
              <span class="currency-label">USD Foil:</span>
              <span class="price-value"
                ><span style="color: rgb(34, 197, 94)">$</span
                >{{ card.prices.usd_foil }}</span
              >
            </div>

            <div v-if="card.prices.eur" class="price-item">
              <span class="currency-label">EUR:</span>
              <span class="price-value"
                ><span style="color: rgb(34, 197, 94)">€</span
                >{{ card.prices.eur }}</span
              >
            </div>

            <div v-if="card.prices.eur_foil" class="price-item">
              <span class="currency-label">EUR Foil:</span>
              <span class="price-value"
                ><span style="color: rgb(34, 197, 94)">€</span
                >{{ card.prices.eur_foil }}</span
              >
            </div>

            <div v-if="card.prices.tix" class="price-item">
              <span class="currency-label">MTGO Tix:</span>
              <span class="price-value">{{ card.prices.tix }}</span>
            </div>
          </div>
        </v-card>

        <!-- TCGPlayer Button -->
        <v-btn
          v-if="card.purchase_uris?.tcgplayer"
          :href="card.purchase_uris.tcgplayer"
          target="_blank"
          color="primary"
          variant="elevated"
          class="mt-6 tcgplayer-btn"
          prepend-icon="mdi-shopping"
          size="large"
        >
          Buy on TCGPlayer
        </v-btn>

        <!-- Fallback button if no direct TCGPlayer link -->
        <v-btn
          v-else-if="card.name"
          :href="generateTCGPlayerSearchUrl(card.name)"
          target="_blank"
          color="primary"
          variant="outlined"
          class="mt-4 tcgplayer-btn"
          prepend-icon="mdi-magnify"
          size="large"
        >
          Search on TCGPlayer
        </v-btn>
      </v-col>

      <!-- Center: Card Details -->
      <v-col cols="12" md="5">
        <div class="card-header">
          <h2 class="card-title">
            {{ card.name }}
            <span v-if="card.mana_cost" class="mana-cost">
              <span
                v-html="formatSymbols(card.mana_cost)"
                style="white-space: nowrap"
              ></span>
            </span>
          </h2>
          <p class="card-type">
            {{ card.type_line }}
          </p>
        </div>

        <div v-if="card.oracle_text" class="card-text-container">
          <div
            class="oracle-text"
            v-html="formatSymbols(card.oracle_text, 16)"
          ></div>

          <em v-if="card.flavor_text" class="flavor-text">{{
            card.flavor_text
          }}</em>

          <div class="stats-container" v-if="card.power && card.toughness">
            <div class="power-toughness">
              Power / Toughness:
              <span class="stats">{{ card.power }}/{{ card.toughness }}</span>
            </div>
          </div>

          <div v-if="card.artist" class="artist-info">
            <span class="artist-label">Illustrated by</span>
            <strong class="artist-name">{{ card.artist }}</strong>
          </div>
        </div>

        <v-card elevation="8" class="legalities-card">
          <div class="legalities-header">
            <v-icon color="primary" class="mr-2">mdi-gavel</v-icon>
            <h3 class="legalities-title">Legalities</h3>
          </div>

          <v-row dense class="pa-2">
            <v-col
              v-for="(format, name) in legalities"
              :key="name"
              cols="6"
              class="mb-2"
            >
              <div class="legality-item">
                <v-chip
                  class="legality-chip"
                  :color="getLegalityColor(format)"
                  variant="elevated"
                  size="small"
                >
                  {{ format }}
                </v-chip>
                <span class="format-name">{{ formatName(name) }}</span>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { IScryfallCard } from '~/types/IScryfall';
import { useSearchStore } from '~/stores/searchStore';

const route = useRoute();
const searchStore = useSearchStore();
const cardData = ref<IScryfallCard | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const cardId = route.query.id as string;
  if (!cardId) {
    error.value = 'No card ID provided';
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `/api/proxy/scryfall/card_search?id=${cardId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch card data');
    }
    cardData.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
});

const card = computed(() => cardData.value as IScryfallCard | null);

const formatsToIgnore = [
  'Oldschool',
  'Standardbrawl',
  'Explorer',
  'Historicbrawl',
  'Gladiator',
  'Premordern',
  'Predh',
  'Paupercommander',
];

useHead({
  title: computed(() => card.value?.name || 'CardMystic'),
});

const legalities = computed(() => {
  if (!card.value?.legalities) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(card.value.legalities)) {
    const format = key.charAt(0).toUpperCase() + key.slice(1);
    if (!formatsToIgnore.includes(format)) {
      result[format] = (value as string).toUpperCase().replaceAll('_', ' '); // normalize casing
    }
  }
  return result;
});

const getLegalityColor = (status: string) => {
  const s = status.toUpperCase();
  switch (s) {
    case 'LEGAL':
      return 'success';
    case 'BANNED':
      return 'error';
    case 'NOT LEGAL':
      return 'surface-variant';
    case 'RESTRICTED':
      return 'warning';
    default:
      return 'primary';
  }
};

const formatName = (raw: string) => {
  return raw.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * Convert symbols (mana, tap, etc) in a string to Scryfall SVG images
 */
const formatSymbols = (text: string | undefined, size: number = 30): string => {
  if (!text) return '';

  // Use replaceAll or a more explicit approach to ensure all symbols are processed
  let result = '';
  const symbols = text.match(/\{([^}]+)\}/g);

  if (symbols) {
    // Replace the original string by processing each symbol
    let workingString = text;
    symbols.forEach((symbol) => {
      let symbolForUrl = symbol.slice(1, -1); // Remove { and }

      // Handle hybrid mana (e.g., W/U becomes wu)
      if (symbolForUrl.includes('/')) {
        symbolForUrl = symbolForUrl.replace('/', '');
      }

      // Handle special symbols
      const specialSymbols = {
        t: 'tap',
        q: 'untap',
        e: 'energy',
        s: 'snow',
        chaos: 'chaos',
        pw: 'planeswalker',
        loyalty: 'loyalty',
        '∞': 'infinity',
      };

      if (specialSymbols[symbolForUrl as keyof typeof specialSymbols]) {
        symbolForUrl =
          specialSymbols[symbolForUrl as keyof typeof specialSymbols];
      }

      let imgTag = `<img src="https://svgs.scryfall.io/card-symbols/${symbolForUrl}.svg" height="${size}" class="mana-symbol"/>`;

      // Replace the first occurrence of this symbol
      workingString = workingString.replace(symbol, imgTag);
    });

    result = workingString;
  } else {
    result = text;
  }

  return result;
};

/**
 * Generate a TCGPlayer search URL for a card name
 */
const generateTCGPlayerSearchUrl = (cardName: string): string => {
  const encodedName = encodeURIComponent(cardName);
  return `https://www.tcgplayer.com/search/magic/product?q=${encodedName}`;
};

const hasPrices = computed(() => {
  if (!card.value?.prices) return false;
  const prices = card.value.prices;
  return (
    prices.usd || prices.usd_foil || prices.eur || prices.eur_foil || prices.tix
  );
});

function getCardImageUrl(cardData: IScryfallCard): string {
  // Try different image URI options in order of preference
  if (cardData.image_uris?.normal) {
    return cardData.image_uris.normal;
  }
  if (cardData.image_uris?.large) {
    return cardData.image_uris.large;
  }
  if (cardData.image_uris?.small) {
    return cardData.image_uris.small;
  }
  if (cardData.image_uris?.png) {
    return cardData.image_uris.png;
  }

  // For double-faced cards, try the first face
  if (cardData.card_faces && cardData.card_faces[0]?.image_uris) {
    const firstFace = cardData.card_faces[0].image_uris;
    if (firstFace.normal) return firstFace.normal;
    if (firstFace.large) return firstFace.large;
    if (firstFace.small) return firstFace.small;
    if (firstFace.png) return firstFace.png;
  }

  // Fallback to empty string
  return '';
}

function handleImageError(value: string | undefined) {
  console.warn('Card image failed to load:', value);
}
</script>

<style scoped lang="sass">
// Card Image Styling
.card-image-container
  position: relative
  display: inline-block

.card-glow
  position: absolute
  top: -5px
  left: -5px
  right: -5px
  bottom: -5px
  background: linear-gradient(45deg, rgba(147, 114, 255, 0.3), rgba(255, 114, 147, 0.3), rgba(114, 255, 147, 0.3))
  border-radius: 25px
  filter: blur(15px)
  z-index: 0
  animation: glowPulse 3s ease-in-out infinite alternate

.card-image
  border-radius: 20px !important
  box-shadow: 0 8px 8px rgba(147, 114, 255, 0.4), 0 4px 4px rgba(0, 0, 0, 0.6)
  position: relative
  z-index: 1
  transition: all 0.3s ease

  &:hover
    transform: translateY(-5px) scale(1.02)
    box-shadow: 0 12px 40px rgba(147, 114, 255, 0.6), 0 6px 20px rgba(0, 0, 0, 0.8)

// Card Header Styling
.card-header
  margin-bottom: 24px

.card-title
  font-size: 2.2rem
  font-weight: 700
  background: linear-gradient(135deg, rgb(147, 114, 255), rgb(255, 114, 147))
  background-clip: text
  margin-bottom: 4px
  text-shadow: 0 4px 8px rgba(147, 114, 255, 0.3)

.mana-cost
  color: rgb(255, 193, 7)
  font-weight: 600
  text-shadow: 0 2px 4px rgba(255, 193, 7, 0.4)

.card-type
  color: rgb(var(--v-theme-primary))
  font-size: 1.1rem
  font-weight: 500
  margin: 0

// Card Text Container
.card-text-container
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8))
  border-radius: 16px
  padding: 24px
  margin-bottom: 24px
  border: 1px solid rgba(147, 114, 255, 0.2)
  backdrop-filter: blur(10px)

.oracle-text
  color: white
  font-size: 1.1rem
  line-height: 1.6
  margin-bottom: 16px

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
  color: white
  font-size: 1.1rem
  font-weight: 600

.stats
  color: rgb(255, 193, 7)
  font-weight: 700
  font-size: 1.2rem

.artist-info
  margin-top: 16px
  padding-top: 16px
  border-top: 1px solid rgba(147, 114, 255, 0.2)

.artist-label
  color: rgba(255, 255, 255, 0.7)
  font-size: 0.9rem

.artist-name
  color: rgb(var(--v-theme-primary))
  margin-left: 8px
  font-size: 1rem

// Legalities Card
.legalities-card
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.95), rgba(66, 66, 66, 0.9)) !important
  border: 1px solid rgba(147, 114, 255, 0.3) !important
  border-radius: 16px !important
  padding: 20px !important
  @media (max-width: 768px)
    padding: 12px !important

.legalities-header
  display: flex
  align-items: center
  margin-bottom: 16px

.legalities-title
  color: white
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
  color: rgba(255, 255, 255, 0.9)
  font-size: 11px
  font-weight: bold
  text-align: center
  margin-left: 4px
  @media (max-width: 768px)
    font-size: 10px

// Price Card Styling
.price-card
  width: 100%
  max-width: 280px
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.95), rgba(66, 66, 66, 0.9)) !important
  border: 1px solid rgba(34, 197, 94, 0.3) !important
  border-radius: 12px !important
  padding: 16px !important

.price-header
  display: flex
  align-items: center
  margin-bottom: 12px

.price-title
  color: white
  font-size: 1.3rem
  font-weight: 600
  margin: 0
  position: relative
  top: 4px

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
  color: rgba(255, 255, 255, 0.8)
  font-size: 0.9rem
  font-weight: 500

.price-value
  color: white
  font-size: 1rem
  font-weight: 700

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

// Legacy styles cleanup
.chip
  font-size: 10px !important
  min-width: 76px
  text-align: center
  justify-content: center
  padding: 0px !important
  margin: 0px !important

h2,
p,
em
  color: white

.v-card
  background-color: #2c2c2c
  color: white

.confidence-text
  color: white
  font-size: 14px
  font-weight: bold
  text-align: center
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1)

.format-text
  color: white
  font-size: 12px
  text-align: center
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1)

// Add styles for mana symbols
:deep(.mana-symbol)
  display: inline-block
  vertical-align: -0.1em
  margin: 0 1px

:deep(.mana-symbol-text)
  display: inline-block
  vertical-align: -0.15em
  margin: 0 1px

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

// Animations
@keyframes glowPulse
  0%
    opacity: 0.6
    transform: scale(1)
  100%
    opacity: 0.9
    transform: scale(1.05)

.image-placeholder-large
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  height: 100%
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8))
  border-radius: 20px
  padding: 40px

.placeholder-text-large
  color: rgba(255, 255, 255, 0.7)
  font-size: 16px
  margin-top: 16px
  text-align: center
</style>
