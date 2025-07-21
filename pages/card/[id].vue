<template>
  <v-container class="py-4 d-flex justify-center">
    <div v-if="isLoading" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-4 text-white">Loading card details...</p>
    </div>

    <div v-else-if="error" class="text-center">
      <v-icon color="error" size="48">mdi-alert-circle</v-icon>
      <p class="mt-4 text-white">{{ error }}</p>
      <v-btn to="/search" color="primary" class="mt-4">Back to Search</v-btn>
    </div>

    <v-row v-else-if="card" style="max-width: 1400px" class="d-flex justify-center">
      <!-- Left: Card Image -->
      <v-col md="4" class="d-flex justify-start align-center flex-column mr-6" style="max-width: 300px">
        <!-- Back to Results button aligned with card image -->
        <div class="back-button-container-aligned mb-4">
          <v-btn color="primary" variant="outlined" rounded="lg" prepend-icon="mdi-arrow-left" @click="$router.back()">
            Back to Results
          </v-btn>
        </div>
        <div class="card-image-container">
          <div class="card-glow" :class="`glow-${card.rarity?.toLowerCase() || 'common'}`"></div>
          <!-- Single image that changes based on flip state -->
          <v-img :src="getCardImageUrl(card)" class="card-image" width="300" height="420" rounded
            @error="handleImageError">
            <template v-slot:placeholder>
              <div class="image-placeholder-large">
                <v-icon size="64" color="grey" icon="mdi-image-off"></v-icon>
                <p class="placeholder-text-large">Image not available</p>
              </div>
            </template>
          </v-img>

          <!-- Sheen container with same dimensions as card - only for mythic -->
          <div v-if="card.rarity?.toLowerCase() === 'mythic'" class="card-sheen-container">
            <div class="card-sheen"></div>
          </div>

          <!-- Game Changer Badge -->
          <!-- <GameChangerBadge :game-changer="card.game_changer" size="large" /> -->
        </div>

        <!-- Flip Button for Dual-Faced Cards -->
        <v-btn v-if="isDualFaced" color="info" variant="elevated" class="mt-4 flip-btn"
          prepend-icon="mdi-rotate-3d-variant" size="large" @click="flipCard">
          {{ isFlipped ? 'Show Front' : 'Show Back' }}
        </v-btn>

        <!-- Similar Cards Button - Desktop only -->
        <v-btn color="white" variant="elevated" :class="isDualFaced ? 'mt-4 similar-cards-btn' : 'mt-6 similar-cards-btn'
          " prepend-icon="mdi-cards" size="large" @click="findSimilarCards"
          class="d-none d-md-flex similar-cards-btn-desktop">
          Similar Cards
        </v-btn>

        <!-- Price Information - Desktop only -->
        <v-card v-if="card.prices && hasPrices" elevation="4" class="price-card mt-4 d-none d-md-block">
          <div class="price-header">
            <v-icon color="success" class="mr-2" size="26">mdi-gold</v-icon>
            <h4 class="price-title">Current Prices</h4>
          </div>

          <div class="price-list">
            <div v-if="card.prices.usd || card.prices.usd_foil" class="price-item">
              <span class="currency-label">USD:</span>
              <span class="price-value">
                <span style="color: rgb(34, 197, 94)">$</span>{{ card.prices.usd }}
                <span v-if="card.prices.usd_foil" class="foil-value" style="margin-left: 8px;">
                  <span class="foil-text"
                    style="color: #ffe066; text-shadow: 0 0 1px #fff700, 0 0 2px #ffe066; font-weight: 700;">
                    ${{ card.prices.usd_foil }} <span style="font-size: 0.9em;">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="card.prices.eur || card.prices.eur_foil" class="price-item">
              <span class="currency-label">EUR:</span>
              <span class="price-value">
                <span style="color: rgb(34, 197, 94)">€</span>{{ card.prices.eur }}
                <span v-if="card.prices.eur_foil" class="foil-value" style="margin-left: 8px;">
                  <span class="foil-text"
                    style="color: #ffe066; text-shadow: 0 0 1px #fff700, 0 0 2px #ffe066; font-weight: 700;">
                    €{{ card.prices.eur_foil }} <span style="font-size: 0.9em;">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="card.prices.tix" class="price-item">
              <span class="currency-label">MTGO Tix:</span>
              <span class="price-value">{{ card.prices.tix }}</span>
            </div>
          </div>
        </v-card>

        <!-- TCGPlayer Button - Desktop only -->
        <v-btn v-if="card.purchase_uris?.tcgplayer" :href="card.purchase_uris.tcgplayer" target="_blank" color="primary"
          variant="elevated" class="mt-6 tcgplayer-btn d-none d-md-flex" prepend-icon="mdi-shopping" size="large">
          Buy on TCGPlayer
        </v-btn>

        <!-- Fallback button if no direct TCGPlayer link - Desktop only -->
        <v-btn v-else-if="card.name" :href="generateTCGPlayerSearchUrl(card.name)" target="_blank" color="primary"
          variant="outlined" class="mt-4 tcgplayer-btn d-none d-md-flex" prepend-icon="mdi-magnify" size="large">
          Search on TCGPlayer
        </v-btn>
      </v-col>

      <!-- Center: Card Details -->
      <v-col cols="12" md="6" class="d-flex flex-column justify-start">
        <div class="card-header card-header-aligned">
          <h2 class="card-title">
            <span class="card-title-text">{{ currentName }}</span>
            <span v-if="currentManaCost">
              <template v-for="(part, index) in formattedManaCost" :key="index">
                <template v-if="typeof part === 'string'">{{ part }}</template>
                <component v-else :is="part" />
              </template>
            </span>
          </h2>
          <div class="set-rarity-info">
            <p v-if="card.set_name" class="set-name">{{ card.set_name }}</p>
            <RarityBadge v-if="card.rarity" :rarity="card.rarity" size="medium" />
          </div>
          <p class="card-type">
            {{ currentTypeLine }}
          </p>
        </div>

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

          <div v-if="card.artist" class="artist-info">
            <span class="artist-label">Illustrated by </span>
            <strong class="artist-name">{{ card.artist }}</strong>
          </div>
        </div>

        <!-- Similar Cards Button - Mobile only -->
        <v-btn color="white" variant="elevated" class="mt-0 mb-4 similar-cards-btn d-md-none" prepend-icon="mdi-cards"
          size="large" @click="findSimilarCards" block>
          Similar Cards
        </v-btn>

        <!-- Price Information - Mobile only -->
        <v-card v-if="card.prices && hasPrices" elevation="4" class="price-card mb-4 d-md-none">
          <div class="price-header">
            <v-icon color="success" class="mr-2" size="26">mdi-gold</v-icon>
            <h4 class="price-title">Current Prices</h4>
          </div>

          <div class="price-list">
            <div v-if="card.prices.usd || card.prices.usd_foil" class="price-item">
              <span class="currency-label">USD:</span>
              <span class="price-value">
                <span style="color: rgb(34, 197, 94)">$</span>{{ card.prices.usd }}
                <span v-if="card.prices.usd_foil" class="foil-value" style="margin-left: 8px;">
                  <span class="foil-text"
                    style="color: #ffe066; text-shadow: 0 0 1px #fff700, 0 0 2px #ffe066; font-weight: 700;">
                    ${{ card.prices.usd_foil }} <span style="font-size: 0.9em;">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="card.prices.eur || card.prices.eur_foil" class="price-item">
              <span class="currency-label">EUR:</span>
              <span class="price-value">
                <span style="color: rgb(34, 197, 94)">€</span>{{ card.prices.eur }}
                <span v-if="card.prices.eur_foil" class="foil-value" style="margin-left: 8px;">
                  <span class="foil-text"
                    style="color: #ffe066; text-shadow: 0 0 1px #fff700, 0 0 2px #ffe066; font-weight: 700;">
                    €{{ card.prices.eur_foil }} <span style="font-size: 0.9em;">(Foil)</span>
                  </span>
                </span>
              </span>
            </div>

            <div v-if="card.prices.tix" class="price-item">
              <span class="currency-label">MTGO Tix:</span>
              <span class="price-value">{{ card.prices.tix }}</span>
            </div>
          </div>
        </v-card>

        <!-- TCGPlayer Button - Mobile only -->
        <v-btn v-if="card.purchase_uris?.tcgplayer" :href="card.purchase_uris.tcgplayer" target="_blank" color="primary"
          variant="elevated" class="mb-4 tcgplayer-btn d-md-none" prepend-icon="mdi-shopping" size="large" block>
          Buy on TCGPlayer
        </v-btn>

        <!-- Fallback button if no direct TCGPlayer link - Mobile only -->
        <v-btn v-else-if="card.name" :href="generateTCGPlayerSearchUrl(card.name)" target="_blank" color="primary"
          variant="outlined" class="mb-6 tcgplayer-btn d-md-none" prepend-icon="mdi-magnify" size="large" block>
          Search on TCGPlayer
        </v-btn>

        <v-card elevation="8" class="legalities-card">
          <div class="legalities-header">
            <v-icon color="primary" class="mr-2">mdi-gavel</v-icon>
            <h3 class="legalities-title">Legalities</h3>
          </div>

          <v-row dense class="pa-2">
            <v-col v-for="(format, name) in legalities" :key="name" cols="6" class="mb-2">
              <div class="legality-item">
                <v-chip class="legality-chip" :color="getLegalityColor(format)" variant="elevated" size="small">
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
import { useQuery } from '@tanstack/vue-query';
import { computed, h } from 'vue';
import { useRoute } from 'vue-router';
import type { CardFormatType, ScryfallCard } from '~/models/cardModel';
import { DefaultLimit } from '~/models/searchModel';
import ManaIcon from '~/components/manaIcon.vue';

const route = useRoute();

const isFlipped = ref(false);

const cardIdParam = computed(() => String(route.params.id) || '');

const { data: card, isLoading, error } = useQuery({
  queryKey: [
    'card',
    cardIdParam.value,
  ],
  queryFn: async () => {
    const response = await fetch(`/api/cards/${cardIdParam.value}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json() as Promise<ScryfallCard>;
  },
  staleTime: 1000 * 60 * 15, // 15 minutes
  enabled: !!cardIdParam.value,
});

useHead(() => ({
  title: card.value
    ? `CardMystic | ${card.value.name}`
    : 'CardMystic | Card',
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
  ],
}));

const { setPageInfo } = usePageInfo();
watchEffect(() => {
  if (card.value) {
    setPageInfo({
      page_url: route.fullPath,
      page_name: card.value?.name || 'Card',
      card_name: card.value?.name || '',
    });
  }
});

const formatsToIgnore: CardFormatType[] = [
  'Old School',
  'Standard Brawl',
  'Explorer',
  'Historic Brawl',
  'Gladiator',
  'Premodern',
  'Predh',
  'Pauper Commander',
];

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
 * Convert symbols (mana, tap, etc) in a string to ManaIcon components
 */
const formatSymbols = (text: string | undefined) => {
  if (!text) return [];

  const symbols = text.match(/\{([^}]+)\}/g);

  if (!symbols) return [text];

  // Split text into parts and symbols while preserving newlines
  const parts: (string | ReturnType<typeof h>)[] = [];
  let lastIndex = 0;

  symbols.forEach((symbol) => {
    const symbolIndex = text.indexOf(symbol, lastIndex);

    // Add text before the symbol (preserving newlines)
    if (symbolIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, symbolIndex);
      // Split by newlines and add each part with line breaks
      const lines = textBefore.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) {
          parts.push(h('br')); // Add line break for newlines
        }
        if (line) {
          parts.push(line);
        }
      });
    }

    let symbolForUrl = symbol.slice(1, -1); // Remove { and }

    // Handle hybrid mana (e.g., W/U becomes wu)
    if (symbolForUrl.includes('/')) {
      symbolForUrl = symbolForUrl.replace('/', '').toLowerCase();
    }

    // Handle special symbols
    const specialSymbols: Record<string, string> = {
      t: 'tap',
      T: 'tap',
      q: 'untap',
      Q: 'untap',
      e: 'energy',
      E: 'energy',
      s: 'snow',
      S: 'snow',
      chaos: 'chaos',
      pw: 'planeswalker',
      loyalty: 'loyalty',
      '∞': 'infinity',
    };

    if (specialSymbols[symbolForUrl]) {
      symbolForUrl = specialSymbols[symbolForUrl];
    }

    // Create ManaIcon component
    parts.push(h(ManaIcon, { type: symbolForUrl }));

    lastIndex = symbolIndex + symbol.length;
  });

  // Add remaining text (preserving newlines)
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    const lines = remainingText.split('\n');
    lines.forEach((line, index) => {
      if (index > 0) {
        parts.push(h('br')); // Add line break for newlines
      }
      if (line) {
        parts.push(line);
      }
    });
  }

  return parts;
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

// Computed properties for current face data
const currentFace = computed(() => {
  if (!card.value) return null;

  // If it's a dual-faced card, return the appropriate face
  if (isDualFaced.value && card.value.card_faces) {
    return isFlipped.value
      ? card.value.card_faces[1]
      : card.value.card_faces[0];
  }

  // For single-faced cards, return the card itself
  return card.value;
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
  return card.value?.name || '';
});

const currentPower = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.power || '';
});

const currentToughness = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.toughness || '';
});

// Computed properties for formatted symbols
const formattedManaCost = computed(() => {
  return formatSymbols(currentManaCost.value);
});

const formattedOracleText = computed(() => {
  return formatSymbols(currentOracleText.value);
});

function getCardImageUrl(cardData: ScryfallCard): string {
  // For dual-faced cards, show the appropriate face
  if (isDualFaced.value && cardData.card_faces) {
    const face = isFlipped.value
      ? cardData.card_faces[1]
      : cardData.card_faces[0];
    if (face.image_uris) {
      if (face.image_uris.normal) return face.image_uris.normal;
      if (face.image_uris.large) return face.image_uris.large;
      if (face.image_uris.small) return face.image_uris.small;
      if (face.image_uris.png) return face.image_uris.png;
    }
  }

  // For single-faced cards, try different image URI options
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

  // Fallback to first face if available
  if (cardData.card_faces && cardData.card_faces[0]?.image_uris) {
    const firstFace = cardData.card_faces[0].image_uris;
    if (firstFace.normal) return firstFace.normal;
    if (firstFace.large) return firstFace.large;
    if (firstFace.small) return firstFace.small;
    if (firstFace.png) return firstFace.png;
  }

  return '';
}

function handleImageError(value: string | undefined) {
  console.warn('Card image failed to load:', value);
}

const isDualFaced = computed(() => {
  const isDualFacedCard =
    card.value?.card_faces && card.value.card_faces.length >= 2;
  return isDualFacedCard;
});

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function findSimilarCards() {
  if (!card.value) return;

  // Navigate to search page with similarity search endpoint
  const queryParams = {
    card_name: card.value.name,
    limit: DefaultLimit,
    filters: undefined, // No additional filters for similarity search
  };

  navigateTo({ path: '/search/similarity', query: queryParams });
}

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
  transition: all 0.3s ease

// Card Header Styling
.card-header
  margin-bottom: 16px

.card-header-aligned
  margin-bottom: 16px
  margin-top: 0
  
  @media (min-width: 960px)
    margin-top: 60px // Align with card image top (button height + margin)

.card-title
  font-size: 2.2rem
  font-weight: 700
  background: linear-gradient(135deg, rgb(147, 114, 255), rgb(255, 114, 147))
  background-clip: text
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
  color: rgba(255, 255, 255, 0.7)
  font-size: 0.9rem
  font-weight: 400
  margin: 0
  font-style: italic

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
  margin-bottom: 16px
  border: 1px solid rgba(147, 114, 255, 0.2)
  backdrop-filter: blur(10px)

.oracle-text
  color: white
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
@media (max-width: 959px)
  .price-card
    max-width: none !important
    width: 100%

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

// Mobile responsive styles
@media (max-width: 959px)
  .tcgplayer-btn
    max-width: none !important

// Animations
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

.back-button-container
  display: flex
  justify-content: flex-start
  max-width: 1400px
  margin: 0 auto
  padding-left: calc((100% - 300px) / 2 - 24px) // Align with left edge of card image column

  @media (max-width: 768px)
    padding-left: 0 // Reset on mobile

.back-button-container-aligned
  display: flex
  justify-content: center
  width: 100%
  max-width: 300px
  align-self: center
</style>