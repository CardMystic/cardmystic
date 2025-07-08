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
            <!-- Back to Results button aligned with card image -->
            <v-col cols="12" class="pb-0">
                <div class="back-button-container">
                    <v-btn color="secondary" variant="text" prepend-icon="mdi-arrow-left" class="mr-2"
                        @click="$router.back()">
                        Back to Results
                    </v-btn>
                </div>
            </v-col>

            <!-- Left: Card Image -->
            <v-col md="4" class="d-flex justify-start align-center flex-column mr-6" style="max-width: 300px">
                <div class="card-image-container">
                    <div class="card-glow" :class="`glow-${card.rarity?.toLowerCase() || 'common'}`"></div>
                    <!-- Single image that changes based on flip state -->
                    <v-img :src="getCardImageUrl(card)" class="card-image" max-width="300" min-width="300"
                        max-height="420" min-height="420" rounded @error="handleImageError">
                        <template v-slot:placeholder>
                            <div class="image-placeholder-large">
                                <v-icon size="64" color="grey">mdi-image-off</v-icon>
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

                <!-- Similar Cards Button -->
                <!-- <v-btn color="white" variant="elevated" :class="isDualFaced ? 'mt-4 similar-cards-btn' : 'mt-6 similar-cards-btn'
                    " prepend-icon="mdi-cards" size="large" @click="findSimilarCards">
                    Similar Cards
                </v-btn> -->

                <!-- Price Information -->
                <v-card v-if="card.prices && hasPrices" elevation="4" class="price-card mt-4">
                    <div class="price-header">
                        <v-icon color="success" class="mr-2" size="26">mdi-gold</v-icon>
                        <h4 class="price-title">Current Prices</h4>
                    </div>

                    <div class="price-list">
                        <div v-if="card.prices.usd" class="price-item">
                            <span class="currency-label">USD:</span>
                            <span class="price-value"><span style="color: rgb(34, 197, 94)">$</span>{{ card.prices.usd
                                }}</span>
                        </div>

                        <div v-if="card.prices.usd_foil" class="price-item">
                            <span class="currency-label">USD Foil:</span>
                            <span class="price-value"><span style="color: rgb(34, 197, 94)">$</span>{{
                                card.prices.usd_foil }}</span>
                        </div>

                        <div v-if="card.prices.eur" class="price-item">
                            <span class="currency-label">EUR:</span>
                            <span class="price-value"><span style="color: rgb(34, 197, 94)">€</span>{{ card.prices.eur
                                }}</span>
                        </div>

                        <div v-if="card.prices.eur_foil" class="price-item">
                            <span class="currency-label">EUR Foil:</span>
                            <span class="price-value"><span style="color: rgb(34, 197, 94)">€</span>{{
                                card.prices.eur_foil }}</span>
                        </div>

                        <div v-if="card.prices.tix" class="price-item">
                            <span class="currency-label">MTGO Tix:</span>
                            <span class="price-value">{{ card.prices.tix }}</span>
                        </div>
                    </div>
                </v-card>

                <!-- TCGPlayer Button -->
                <v-btn v-if="card.purchase_uris?.tcgplayer" :href="card.purchase_uris.tcgplayer" target="_blank"
                    color="primary" variant="elevated" class="mt-6 tcgplayer-btn" prepend-icon="mdi-shopping"
                    size="large">
                    Buy on TCGPlayer
                </v-btn>

                <!-- Fallback button if no direct TCGPlayer link -->
                <v-btn v-else-if="card.name" :href="generateTCGPlayerSearchUrl(card.name)" target="_blank"
                    color="primary" variant="outlined" class="mt-4 tcgplayer-btn" prepend-icon="mdi-magnify"
                    size="large">
                    Search on TCGPlayer
                </v-btn>
            </v-col>

            <!-- Center: Card Details -->
            <v-col cols="12" md="5">
                <div class="card-header">
                    <h2 class="card-title">
                        {{ currentName }}
                        <span v-if="currentManaCost" class="mana-cost">
                            <span v-html="formatSymbols(currentManaCost)" style="white-space: nowrap"></span>
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
                    <div class="oracle-text" v-html="formatSymbols(currentOracleText, 16)"></div>

                    <div class="stats-container" v-if="currentPower && currentToughness">
                        <div class="power-toughness">
                            Power / Toughness:
                            <span class="stats">{{ currentPower }}/{{ currentToughness }}</span>
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
                        <v-col v-for="(format, name) in legalities" :key="name" cols="6" class="mb-2">
                            <div class="legality-item">
                                <v-chip class="legality-chip" :color="getLegalityColor(format)" variant="elevated"
                                    size="small">
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
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { CardFormatType, ScryfallCard } from '~/models/cardModel';

const route = useRoute();

const isFlipped = ref(false);

const cardIdParam = computed(() => String(route.params.id) || '');

const { data: card, isLoading, error } = useQuery({
    queryKey: [
        'card',
        cardIdParam.value,
    ],
    queryFn: async () => {
        const response = await fetch(`/api/proxy/cards/${cardIdParam.value}`);
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

</script>

<style lang="sass" scoped>
</style>
