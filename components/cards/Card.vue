<template>
  <UCard variant="subtle"
    :class="['card-root', isSearched ? 'searched-card-bg h-full' : '', goldHighlight ? 'dark:bg-[#3a3520] bg-[#fef3c7] commander-card-bg' : '']"
    :ui="{ body: 'p-1 sm:p-2' }">
    <LazyAddToDeckModal v-if="canShowDeckMenu" v-model:open="showAddToDeckModal" :card-id="card.card_data.id"
      :card-name="card.card_data.name" />
    <!-- Confirmation Modal -->
    <UModal v-model:open="showConfirmModal" title="Confirm Poor Result?"
      description="Please confirm if you believe this card does not match your search. We use your judgement to improve our models. Thank you for your feedback!"
      :ui="{ footer: 'justify-end' }">
      <template #footer="{ close }">
        <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
        <UButton label="Yes, This is a Poor Result" color="error" @click="confirmDislike" />
      </template>
    </UModal>
    <div class="card-image-wrapper">
      <GameChangerBadge v-if="showCardInfo && card.card_data.game_changer" />

      <!-- Partner commanders: two overlapping cards -->
      <template v-if="hasPartner">
        <div class="partner-stack" @mouseleave="partnerHoveredIndex = null">
          <div class="partner-card partner-back" :class="{ 'partner-front': partnerFrontIndex === 1 }"
            @mouseenter="partnerHoveredIndex = 1" @click="navigateToCard(card.partner_card_data!.id)">
            <img class="card-large cursor-pointer" :src="getCardImageUrl(card.partner_card_data!)"
              :alt="card.partner_card_data!.name" @error="handleImageError"
              v-if="getCardImageUrl(card.partner_card_data!)" loading="lazy" decoding="async" />
          </div>
          <div class="partner-card" :class="{ 'partner-front': partnerFrontIndex === 0 }"
            @mouseenter="partnerHoveredIndex = 0" @click="navigateToCard(card.card_data.id)">
            <img class="card-large cursor-pointer" :src="getCardImageUrl(card.card_data, isFlipped)"
              :alt="card.card_data.name" @error="handleImageError" v-if="getCardImageUrl(card.card_data, isFlipped)"
              loading="lazy" decoding="async" />
          </div>
        </div>
      </template>

      <!-- Single card (default) -->
      <template v-else>
        <img :class="sizeClass" :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
          @error="handleImageError" v-if="getCardImageUrl(card.card_data, isFlipped)" loading="lazy" decoding="async"
          :ui="{}" @click="navigateToCard(card.card_data.id)" class="cursor-pointer" />
        <div v-else class="image-placeholder">
          <p class="placeholder-text">{{ card.card_data.name }}</p>
        </div>
      </template>

      <LazyCardOverlayButtons :card="card" :isDualFaced="isDualFaced"
        :show-clipboard-button="showCardInfo && !hasPartner" :show-flip-button="showCardInfo && !hasPartner"
        :show-menu-button="canShowDeckMenu" :menu-items="cardOverlayMenuItems" @flip="flipCard" />

      <!-- Score Bars -->
      <div v-if="!hideProgressBar" class="mt-1 w-full" :class="{ invisible: isSearched }">
        <!-- AI score bar (when AI scores present) -->
        <template v-if="hasDualScores">
          <UTooltip text="AI Score: how relevant this card is to your query">
            <div class="flex flex-row items-center justify-center text-center w-full mt-0.5">
              <UProgress v-model="normalizedScore" class="my-0 mr-2" size="md" :color="scoreColor" />
              <p class="text-xs whitespace-nowrap">AI: {{ Math.round(normalizedScore) }}%</p>
            </div>
          </UTooltip>
          <UTooltip text="Synergy score: how relevant this card is to your decklist">
            <div class="flex flex-row items-center justify-center text-center w-full">
              <UProgress v-model="alsDisplayScore" class="my-0 mr-2" size="md" :color="alsScoreColor" />
              <p class="text-xs whitespace-nowrap">Deck: {{ Math.round(alsDisplayScore) }}%</p>
            </div>
          </UTooltip>
        </template>
        <!-- Single AI/ALS bar -->
        <template v-else-if="hasAnyScore">
          <UTooltip
            :text="isAlsOnly ? 'Synergy score: how relevant this card is to your decklist' : 'AI Score: how relevant this card is to your query'">
            <div class="flex flex-row items-center justify-center text-center w-full">
              <UProgress v-model="normalizedScore" class="my-0 mr-2" size="md" :color="scoreColor" />
              <p class="text-xs whitespace-nowrap">{{ isAlsOnly ? 'Deck' : 'AI' }}: {{ Math.round(normalizedScore) }}%
              </p>
            </div>
          </UTooltip>
        </template>
        <!-- Popularity bar -->
        <template v-if="hasPopularity">
          <UTooltip :text="`In ${popularityPercent.toFixed(2)}% of decks that match your filters`">
            <div class="flex flex-row items-center justify-center text-center w-full"
              :class="{ 'mt-0.5': hasAnyScore }">
              <UProgress v-model="popularityPercent" class="my-0 mr-2" size="md" :color="popularityColor" />
              <p class="text-xs whitespace-nowrap">{{ popularityDisplay }}% POP</p>
            </div>
          </UTooltip>
        </template>
        <!-- No score at all -->
        <template v-if="!hasAnyScore && !hasPopularity">
          <div class="flex flex-row items-center justify-center text-center w-full">
            <UProgress :model-value="0" class="my-0 mr-2" size="md" color="error" />
            <p class="text-xs"></p>
          </div>
        </template>
      </div>
    </div>

    <!-- Card Name and mana cost -->
    <div class="flex flex-col items-center justify-center text-center">
      <!-- Action Buttons -->
      <div class="flex flex-row items-center justify-between text-center w-full mt-1">

        <!-- Left side buttons-->
        <div class="flex flex-row items-center">
          <!-- Buy on TCGPlayer button -->
          <UTooltip :text="hasPartner ? combinedPriceTooltip : singleBuyTooltip" :popper="{ placement: 'top' }">
            <template #default>
              <!-- Partner: combined price button -->
              <UButton v-if="hasPartner && showCardInfo && partnerTcgplayerId"
                :to="getAffiliateLink(partnerTcgplayerId)" external color="success" variant="outline"
                class="mr-1 sm:mr-2" icon="i-heroicons-shopping-cart" :size="isMobile ? 'xs' : 'sm'" target="_blank"
                rel="noopener noreferrer" aria-label="Buy on TCGPlayer">
                {{ combinedPriceLabel }}
              </UButton>
              <!-- Single card: original price button -->
              <UButton v-else-if="!hasPartner && showCardInfo && card.card_data.tcgplayer_id"
                :to="getAffiliateLink(card.card_data.tcgplayer_id)" external color="success" variant="outline"
                class="mr-1 sm:mr-2" icon="i-heroicons-shopping-cart" :size="isMobile ? 'xs' : 'sm'" target="_blank"
                rel="noopener noreferrer" aria-label="Buy on TCGPlayer">
                {{ card.card_data.prices.usd ? `$${card.card_data.prices.usd}` : 'Buy' }}
              </UButton>
            </template>
          </UTooltip>
          <!-- More actions popover (mobile only) -->
          <UPopover v-if="showCardInfo" v-model:open="moreActionsOpen" class="sm:hidden">
            <UTooltip text="More actions" :popper="{ placement: 'top' }">
              <UButton color="neutral" variant="solid" class="mr-1 cursor-pointer" icon="i-lucide-ellipsis" size="xs"
                aria-label="More actions" />
            </UTooltip>
            <template #content>
              <div class="flex flex-col gap-1 p-2 w-48">
                <UButton v-if="!isSearched" color="neutral" variant="ghost" class="cursor-pointer justify-start"
                  size="sm" icon="i-mdi-cards-outline" @click="findSimilarCards(); moreActionsOpen = false">
                  Find Similar Cards
                </UButton>
                <template v-if="isCommander">
                  <UButton color="primary" variant="ghost" class="cursor-pointer justify-start" size="sm"
                    icon="i-lucide-box" @click="getRecommendations(); moreActionsOpen = false">
                    Deck Recommendations
                  </UButton>
                  <UButton color="error" variant="ghost" class="cursor-pointer justify-start" size="sm"
                    icon="i-lucide-flame" @click="viewPopularCards(); moreActionsOpen = false">
                    Popular Cards
                  </UButton>
                </template>
              </div>
            </template>
          </UPopover>
          <!-- Desktop buttons (hidden on mobile) -->
          <template v-if="showCardInfo">
            <UTooltip text="Get Deck Recommendations for this Commander" :popper="{ placement: 'top' }">
              <UButton v-if="isCommander" color="primary" variant="outline"
                class="hidden sm:inline-flex mr-2 cursor-pointer" icon="i-lucide-box" size="sm"
                @click="getRecommendations" aria-label="Get Deck Recommendations for this Commander" />
            </UTooltip>
            <UTooltip text="Popular Cards for this Commander" :popper="{ placement: 'top' }">
              <UButton v-if="isCommander" color="error" variant="outline"
                class="hidden sm:inline-flex mr-2 cursor-pointer" icon="i-lucide-flame" size="sm"
                @click="viewPopularCards" aria-label="Popular Cards for this Commander" />
            </UTooltip>
            <UTooltip v-if="!isSearched" text="Find similar cards" :popper="{ placement: 'top' }">
              <UButton color="neutral" variant="outline" class="hidden sm:inline-flex mr-2 cursor-pointer"
                icon="i-mdi-cards-outline" size="sm" @click="findSimilarCards" aria-label="Find Similar Cards" />
            </UTooltip>
          </template>
        </div>

        <!-- Right side buttons -->
        <div v-if="!isSearched && showCardInfo" class="flex flex-row items-center gap-2 justify-center">

          <!-- Thumbs down button -->
          <UTooltip v-if="!hideThumbsDownButton" text="I disagree with this result!" :popper="{ placement: 'top' }">
            <template #default>
              <UButton class="cursor-pointer" :color="isThumbsDownClicked ? 'error' : 'primary'" variant="ghost"
                icon="i-lucide-thumbs-down" :size="isMobile ? 'xs' : 'sm'" aria-label="Disagree with this result"
                @click="handleDislike" />
            </template>
          </UTooltip>

          <!-- Add to deckbuilding search button -->
          <UTooltip v-if="showAddToDeckbuilderButton" text="Add to deckbuilding search" :popper="{ placement: 'top' }">
            <template #default>
              <UButton class="cursor-pointer" :color="isInDecklist ? 'success' : 'primary'" variant="soft"
                :icon="isInDecklist ? 'i-lucide-check' : 'i-lucide-layers-plus'" :size="isMobile ? 'xs' : 'sm'"
                aria-label="Add to deckbuilding search" @click="deckbuilderStore?.addCard(card.card_data.name)" />
            </template>
          </UTooltip>
        </div>

        <!-- Remove from list button -->
        <UTooltip v-if="showRemoveButton" text="Remove from list" :popper="{ placement: 'top' }">
          <template #default>
            <UButton class="cursor-pointer" color="error" variant="soft" icon="i-lucide-trash-2"
              :size="isMobile ? 'xs' : 'sm'" aria-label="Remove from list" @click="emit('remove', card.card_data.id)" />
          </template>
        </UTooltip>

        <UButton v-if="isDev && showCardInfo" color="warning" variant="outline" class="ml-2" size="xs"
          @click="toggleShowAllData">
          {{ showAllData ? 'Hide Data' : 'Show Data' }}
        </UButton>
      </div>

    </div>
  </UCard>
  <div v-if="isDev && showAllData" class="card-data mt-2">
    <pre>
    {{ JSON.stringify(card.card_data, null, 2) }}
  </pre>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
import type { Card } from '~/models/cardModel';
import { useRouter } from 'vue-router';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';

const router = useRouter();
const route = useRoute();
const { saveCurrentSearchQuery, saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();
const { userProfile } = useUserProfile();

// Shared singleton — one listener for all Card instances
const isMobile = useIsMobile();

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  size: {
    type: String as PropType<'small' | 'large'>,
    default: 'large',
  },
  // If true, show additional card info (name, type, clipboard button)
  showCardInfo: {
    type: Boolean,
    default: false,
  },
  hideThumbsDownButton: {
    type: Boolean,
    default: false,
  },
  // If true, show a button to add to deckbuilding search
  showAddToDeckbuilderButton: {
    type: Boolean,
    default: false,
  },
  hideProgressBar: {
    type: Boolean,
    default: false,
  },
  // True if the card was the searched card in a similarity search
  isSearched: {
    type: Boolean,
    default: false,
  },
  showRemoveButton: {
    type: Boolean,
    default: false,
  },
  goldHighlight: {
    type: Boolean,
    default: false,
  },
  isCommander: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'remove', cardId: string): void;
}>();

const sizeClass = computed(() => `card-${props.size}`);

// Partner commander support
const hasPartner = computed(() => !!props.card.partner_card_data);
const partnerHoveredIndex = ref<number | null>(null);
const partnerFrontIndex = computed(() => partnerHoveredIndex.value ?? 0);

const combinedUsdPrice = computed(() => {
  if (!hasPartner.value) return null;
  let total = 0;
  let hasPrice = false;
  for (const card of [props.card.card_data, props.card.partner_card_data!]) {
    const usd = parseFloat(card.prices?.usd ?? '');
    if (!isNaN(usd)) {
      total += usd;
      hasPrice = true;
    }
  }
  return hasPrice ? total : null;
});

const combinedPriceLabel = computed(() => {
  if (combinedUsdPrice.value !== null) return `$${combinedUsdPrice.value.toFixed(2)}`;
  return 'Buy';
});

const combinedPriceTooltip = computed(() => {
  if (!hasPartner.value) return 'Buy on TCGPlayer';
  const cards = [props.card.card_data, props.card.partner_card_data!];
  const parts = cards
    .map((c) => {
      const price = c.prices?.usd ? `$${c.prices.usd}` : '?';
      return `${c.name?.split(' // ')[0]}: ${price}`;
    })
    .join(' + ');
  return `Buy on TCGPlayer (${parts})`;
});

const partnerTcgplayerId = computed(() => {
  if (props.card.card_data.tcgplayer_id) return props.card.card_data.tcgplayer_id;
  if (props.card.partner_card_data?.tcgplayer_id) return props.card.partner_card_data.tcgplayer_id;
  return null;
});

const singleBuyTooltip = computed(() => {
  const price = props.card.card_data.prices?.usd;
  return price ? `Buy on TCGPlayer ($${price})` : 'Buy on TCGPlayer';
});

// Only initialise deckbuilder store when the button is actually shown
const deckbuilderStore = props.showAddToDeckbuilderButton ? useDeckbuilder() : null;

const isInDecklist = computed(() => {
  if (!deckbuilderStore || !props.card.card_data?.name) return false;
  return deckbuilderStore.hasCard(props.card.card_data.name);
});

const isFlipped = ref(false);
const isThumbsDownClicked = ref(false);
const showConfirmModal = ref(false);
const moreActionsOpen = ref(false);
const showAddToDeckModal = ref(false);
const hasMounted = ref(false);

const cardOverlayMenuItems = computed(() => [[
  {
    label: 'Add to Deck',
    icon: 'i-lucide-library-big',
    onSelect() {
      showAddToDeckModal.value = true;
    },
  },
]]);

const canShowDeckMenu = computed(() =>
  hasMounted.value && props.showCardInfo
);

onMounted(() => {
  hasMounted.value = true;
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  // Only layouts with truly separate card faces should be flippable
  const flippableLayouts = ['transform', 'modal_dfc', 'reversible_card'];
  return flippableLayouts.includes(cardData.layout);
});

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

// Get the search query from route params
const searchQuery = computed(() => {
  // For AI/Commander search, the query is in route.query.query
  if (route.query.query) {
    return String(route.query.query);
  }
  // For similarity search, the query is the card_name
  if (route.query.card_name) {
    return String(route.query.card_name);
  }
  return '';
});

// Lazily initialise feedback composable — only when user actually dislikes
let _dislikeMutation: ReturnType<typeof useCardFeedback>['dislikeMutation'] | null = null;
function getDislikeMutation() {
  if (!_dislikeMutation) {
    _dislikeMutation = useCardFeedback().dislikeMutation;
  }
  return _dislikeMutation;
}

// Handle dislike button click - show confirmation modal
function handleDislike() {
  // Don't allow unclicking
  if (isThumbsDownClicked.value) {
    return;
  }
  if (!searchQuery.value || !props.card.card_data?.name) {
    console.warn('Cannot track dislike: missing query or card name');
    return;
  }
  // Show confirmation modal
  showConfirmModal.value = true;
}

// Confirm dislike action
function confirmDislike() {
  showConfirmModal.value = false;
  // Set the visual state (cannot be undone)
  isThumbsDownClicked.value = true;

  // Track the dislike
  getDislikeMutation().mutate({
    query: searchQuery.value,
    cardName: props.card.card_data.name,
  });
}
// Navigation helper
function navigateToCard(cardId: string | undefined) {
  saveCurrentSearchQuery(route.query);

  if (!cardId) {
    console.warn('Cannot navigate to card: ID is undefined');
    return;
  }
  router.push(`/card/${cardId}`);
}

// Whether this card has both ALS and AI scores (dual bar mode)
const hasDualScores = computed(() =>
  props.card.als_score !== undefined && props.card.ai_normalized_score !== undefined
);

// Whether this card has only an ALS score (no AI)
const isAlsOnly = computed(() =>
  props.card.als_score !== undefined && props.card.ai_normalized_score === undefined
);

// Whether any displayable score exists
const hasAnyScore = computed(() =>
  props.card.ai_normalized_score !== undefined ||
  props.card.als_score !== undefined
);

// Primary score: prefer ai_normalized_score, fall back to als_score
const primaryScore = computed(() => {
  if (props.card.ai_normalized_score !== undefined) return props.card.ai_normalized_score;
  if (props.card.als_score !== undefined) return props.card.als_score;
  return undefined;
});

function toDisplayPercent(score: number | undefined): number {
  if (score === undefined) return 0;
  // All scores are 0-1 normalized, convert to percentage
  return Math.min(Math.max(score * 100, 0), 100);
}

const normalizedScore = computed(() => toDisplayPercent(primaryScore.value));
const alsDisplayScore = computed(() => toDisplayPercent(props.card.als_score));

function scoreToColor(value: number) {
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'error';
}

const scoreColor = computed(() => scoreToColor(normalizedScore.value));
const alsScoreColor = computed(() => scoreToColor(alsDisplayScore.value));

const hasPopularity = computed(() => props.card.popularity !== undefined);
const popularityPercent = computed(() => {
  if (props.card.popularity === undefined) return 0;
  return Math.min(Math.max(props.card.popularity * 100, 0), 100);
});
const popularityDisplay = computed(() => {
  if (popularityPercent.value < 1) return popularityPercent.value.toFixed(2);
  return Math.round(popularityPercent.value).toString();
});
const popularityColor = computed(() => scoreToColor(popularityPercent.value));

function findSimilarCards() {
  if (!props.card) return;

  saveCurrentSearchQuery(route.query);

  // Navigate to search page with similarity search endpoint
  const queryParams = {
    card_name: props.card.card_name,
    filters: undefined, // No additional filters for similarity search
    searchType: 'similarity'
  };
  router.push({ path: '/search/all/similarity', query: queryParams });
}

function getRecommendations() {
  if (!props.card?.card_data?.name) return;
  const queryParams = { commander: props.card.card_data.name };
  saveSearchQuery('recommend', queryParams);
  router.push({ path: '/search/all/deckbuilder', query: queryParams });
  queueMicrotask(() => {
    saveSearchMutation.mutate({
      query: props.card.card_data.name,
      searchType: 'recommend',
      filters: { commander: props.card.card_data.name },
    });
  });
}

function viewPopularCards() {
  if (!props.card?.card_data?.name) return;
  const queryParams = { commander: props.card.card_data.name };
  saveSearchQuery('popular-by-commander', queryParams);
  router.push({ path: '/popular-by-commander/all', query: queryParams });
}

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}

const isDev = import.meta.env.VITE_IS_DEV === "true";
const showAllData = ref(false);
function toggleShowAllData() {
  showAllData.value = !showAllData.value;
}
</script>

<style scoped>
.card-data {
  position: fixed;
  z-index: 1;
  bottom: 10px;
  left: 10px;
  right: 10px;
  max-width: 100%;
  text-overflow: wrap;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  container-type: inline-size;
}

/* Small Size Variant */

.card-small {
  aspect-ratio: 5/7;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* Large Size Variant */
.card-large {
  aspect-ratio: 5/7;
  width: 100%;
  object-fit: cover;
  border-radius: 14px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 5/7;
  width: 100%;
  background: linear-gradient(135deg,
      rgba(44, 44, 44, 0.9),
      rgba(66, 66, 66, 0.8));
  border-radius: 10px;
  padding: 20px;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-top: 8px;
  text-align: center;
}

.manacost-text {
  font-size: 14px;
}

.searched-card-bg {
  background: #353a75 !important;
}

.commander-card-bg {
  border: 1.5px solid rgba(234, 179, 8, 0.4);
}

.card-image-wrapper img {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-image-wrapper:hover img {
  transform: scale(1.03);
}

.card-root {
  max-width: 330px;
  width: 100%;
  margin: 0 auto;
  /* center horizontally within container */
  display: block;
  box-sizing: border-box;
}

/* Partner commander stack — 24px shorter than a normal card to leave room for extra text */
.partner-stack {
  position: relative;
  width: 100%;
  height: calc(100cqw * 7 / 5 - 24px);
}

.partner-card {
  position: absolute;
  width: 72%;
  left: 50%;
  transform: translateX(-50%);
}

.partner-card.partner-back {
  top: 0;
}

.partner-card:not(.partner-back) {
  bottom: 0;
}

.partner-card.partner-front {
  z-index: 1;
}

.partner-card:not(.partner-front) {
  z-index: 0;
}

.partner-stack .card-large {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Partner images scale individually on hover */
.partner-card img {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.partner-card:hover img {
  transform: scale(1.05);
  z-index: 2;
}
</style>
