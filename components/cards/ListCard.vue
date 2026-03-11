<template>
  <UCard variant="subtle" :class="['card-root', isCommander ? 'commander-card-bg' : '']" :ui="{ body: 'p-4 sm:p-4' }">

    <!-- Set Commander Confirmation Modal -->
    <UModal v-model:open="showCommanderModal" title="Set Commander">
      <template #body>
        <p class="text-sm">
          Set <span class="font-bold">{{ card.card_data.name }}</span> as your commander?
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
          <UButton label="Set Commander" color="primary" icon="i-lucide-crown" @click="confirmSetCommander(close)" />
        </div>
      </template>
    </UModal>

    <!-- Clear Commander Confirmation Modal -->
    <UModal v-model:open="showClearCommanderModal" title="Remove Commander">
      <template #body>
        <p class="text-sm">
          Remove <span class="font-bold">{{ card.card_data.name }}</span> as your commander?
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
          <UButton label="Remove Commander" color="error" icon="i-lucide-crown" @click="confirmClearCommander(close)" />
        </div>
      </template>
    </UModal>

    <div class="card-image-wrapper">
      <!-- Card image -->
      <img :class="'card-large'" :src="getCardImageUrl(card.card_data, isFlipped)" :alt="card.card_data.name"
        @error="handleImageError" v-if="getCardImageUrl(card.card_data, isFlipped)" loading="lazy" decoding="async"
        @click="navigateToCard(card.card_data.id)" class="cursor-pointer" />
      <div v-else class="image-placeholder">
        <p class="placeholder-text">{{ card.card_data.name }}</p>
      </div>

      <ClipboardButton :card="card" />

      <!-- Flip Button for Dual-Faced Cards -->
      <div v-if="isDualFaced" class="flip-card-btn" @click.stop="flipCard">
        <UButton class="cursor-pointer" tabindex="0" aria-label="Flip Card" color="neutral" variant="solid" size="md"
          square>
          <UIcon name="i-heroicons-arrow-path" class="flip-card-icon" />
        </UButton>
      </div>
    </div>

    <!-- Card Name and mana cost -->
    <div class="flex flex-col items-center justify-center text-center">
      <div class="flex flex-row items-center justify-between w-full">
        <p class="whitespace-nowrap overflow-hidden truncate">
          {{ card.card_data.name.split(' // ')[0] }}
        </p>
        <ManaCost v-if="card.card_data.mana_cost" :manaCost="card.card_data.mana_cost.split(' // ')[0]"
          class="manacost-text whitespace-nowrap" />
      </div>
      <div class="flex flex-row items-center justify-between w-full text-xs">
        <p class="whitespace-nowrap overflow-hidden truncate">
          <span
            :style="getSimpleCardType(card.card_data.type_line).toLowerCase().startsWith('legendary') ? 'color: #ff4500;' : ''">
            {{ getSimpleCardType(card.card_data.type_line) ?? "N/A" }}
          </span>
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-row items-center justify-between text-center w-full">
        <!-- Left side buttons -->
        <div class="flex flex-row items-center">
          <!-- Buy on TCGPlayer -->
          <UTooltip text="Buy on TCGPlayer" :popper="{ placement: 'top' }">
            <UButton v-if="card.card_data.tcgplayer_id" :to="getAffiliateLink(card.card_data.tcgplayer_id)" external
              color="success" variant="solid" class="mt-1 mr-2" icon="i-heroicons-shopping-cart" size="sm"
              target="_blank" rel="noopener noreferrer" aria-label="Buy on TCGPlayer">
              {{ card.card_data.prices.usd ? `$${card.card_data.prices.usd}` : 'Buy' }}
            </UButton>
          </UTooltip>

          <!-- Set as Commander -->
          <UTooltip v-if="isEligibleCommander || isCommander"
            :text="isCommander ? 'Current commander' : 'Set as commander'" :popper="{ placement: 'top' }">
            <UButton class="mt-1 mr-2 cursor-pointer" :color="isCommander ? 'warning' : 'neutral'" variant="solid"
              icon="i-lucide-crown" size="sm" aria-label="Set as commander" @click="handleCrownClick" />
          </UTooltip>

          <!-- Similarity search -->
          <UTooltip text="Search for similar cards" :popper="{ placement: 'top' }">
            <UButton color="neutral" variant="solid" class="mt-1 mr-2 cursor-pointer" icon="i-mdi-cards-outline"
              size="sm" @click="findSimilarCards" aria-label="Find Similar Cards" />
          </UTooltip>
        </div>

        <!-- Right side: Remove from list -->
        <UTooltip text="Remove from list" :popper="{ placement: 'top' }">
          <UButton class="cursor-pointer" color="error" variant="soft" icon="i-lucide-trash-2" size="sm"
            aria-label="Remove from list" @click="emit('remove', card.card_data.id)" />
        </UTooltip>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import { getAffiliateLink } from '~/utils/tcgPlayer';
import { getCardImageUrl } from '~/utils/scryfall';
import ClipboardButton from '~/components/clipboard/ClipboardButton.vue';
import { DefaultLimitSimilarity } from '~/models/searchModel';

const router = useRouter();

const { data: commanders } = useFetch<string[]>('/commanders.min.json', {
  key: 'commanders-list-card',
  lazy: true,
  server: false,
  default: () => [] as string[],
})

const props = defineProps<{
  card: Card;
  isCommander: boolean;
}>();

const emit = defineEmits<{
  (e: 'remove', cardId: string): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander'): void;
}>();

const isFlipped = ref(false);
const showCommanderModal = ref(false);
const showClearCommanderModal = ref(false);

const isEligibleCommander = computed(() => {
  if (!commanders.value || commanders.value.length === 0) return false;
  const name = props.card.card_data.name;
  return commanders.value.includes(name);
});

const isDualFaced = computed(() => {
  const cardData = props.card?.card_data;
  if (!cardData?.card_faces || cardData.card_faces.length < 2) return false;
  const flippableLayouts = ['transform', 'modal_dfc', 'reversible_card'];
  return flippableLayouts.includes(cardData.layout);
});

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function handleCrownClick() {
  if (props.isCommander) {
    showClearCommanderModal.value = true;
  } else {
    showCommanderModal.value = true;
  }
}

function confirmSetCommander(close: () => void) {
  emit('setCommander', props.card.card_data.name);
  close();
}

function confirmClearCommander(close: () => void) {
  emit('clearCommander');
  close();
}

function navigateToCard(cardId: string | undefined) {
  if (!cardId) return;
  router.push(`/card/${cardId}`);
}

function findSimilarCards() {
  if (!props.card) return;
  const queryParams = {
    card_name: props.card.card_name,
    limit: DefaultLimitSimilarity,
    filters: undefined,
    searchType: 'similarity'
  };
  router.push({ path: '/search/similarity', query: queryParams });
}

function getSimpleCardType(type_line: string): string {
  if (!type_line) return 'Unknown';
  const faces = type_line.split('//');
  if (faces.length === 1) {
    return faces[0].split(' — ')[0].trim();
  } else {
    const frontType = faces[0].split(' — ')[0].trim();
    const backType = faces[1].split(' — ')[0].trim();
    return `${frontType} // ${backType}`;
  }
}

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}
</script>

<style scoped>
.card-root {
  max-width: 330px;
  width: 100%;
  margin: 0 auto;
  display: block;
  box-sizing: border-box;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

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
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8));
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

.commander-card-bg {
  background: #3a3520 !important;
  border: 1.5px solid rgba(234, 179, 8, 0.4);
}

.card-image-wrapper img {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-image-wrapper:hover img {
  transform: scale(1.03);
}

.flip-card-btn {
  position: absolute;
  right: 30px;
  top: 88px;
  opacity: 0;
  pointer-events: auto;
  z-index: 2;
  width: 30px;
  height: 30px;
  min-width: 30px;
  min-height: 30px;
  max-width: 30px;
  max-height: 30px;
  transition: opacity 0.2s;
}

.card-image-wrapper:hover .flip-card-btn {
  opacity: 0.7;
}

@media (max-width: 767px) {
  .flip-card-btn {
    opacity: 0.7 !important;
  }
}

.flip-card-icon {
  font-size: 1.2rem;
}
</style>
