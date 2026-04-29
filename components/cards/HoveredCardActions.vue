<template>
  <div class="preview-actions">
    <UButton v-if="card.card_data.tcgplayer_id" class="cursor-pointer"
      :to="getAffiliateLink(card.card_data.tcgplayer_id)" external color="success" variant="solid"
      icon="i-heroicons-shopping-cart" size="lg" target="_blank" rel="noopener noreferrer" :label="buyLabel" block />
    <UButton v-else :to="generateTCGPlayerSearchUrl(card.card_data.name)" class="cursor-pointer" external
      color="primary" variant="solid" icon="i-heroicons-magnifying-glass" size="lg" label="Search on TCGPlayer" block />
    <UButton color="neutral" class="cursor-pointer" variant="outline" icon="i-mdi-cards-outline" size="lg"
      label="Find Similar Cards" block :disabled="findSimilarDisabled" @click="emit('findSimilar')" />
    <UButton v-if="canShowDeckMenu" class="cursor-pointer" color="primary" variant="outline" icon="i-lucide-library-big"
      size="lg" label="Add to Deck" block @click="emit('openAddToDeck')" />
    <UButton class="cursor-pointer" :color="isInClipboard ? 'success' : 'primary'" variant="outline"
      :icon="isInClipboard ? 'i-heroicons-check' : 'i-heroicons-plus'" size="lg"
      :label="isInClipboard ? 'Remove From Clipboard' : 'Add To Clipboard'" block @click="emit('toggleClipboard')" />
    <UButton v-if="isDualFaced" class="cursor-pointer" color="neutral" variant="outline" icon="i-heroicons-arrow-path"
      size="lg" label="Flip Card" block @click="emit('flipCard')" />
    <UButton v-if="showCommanderButtons" class="cursor-pointer" color="primary" variant="outline" icon="i-lucide-box"
      size="lg" label="Get Deck Recommendations" block @click="emit('getRecommendations')" />
    <UButton v-if="showCommanderButtons" class="cursor-pointer" color="error" variant="outline" icon="i-lucide-flame"
      size="lg" label="Popular Cards For Commander" block @click="emit('viewPopularCards')" />
  </div>

  <div v-if="showListActions" class="preview-actions">
    <p class="preview-section-label">List Actions</p>
    <div class="grid grid-cols-2 gap-2">
      <UButton color="neutral" class="cursor-pointer" variant="outline" icon="i-lucide-plus" label="Add Copy"
        :disabled="(numCopies ?? 1) >= 100" @click="emit('addCopy')" />
      <UButton color="neutral" class="cursor-pointer" variant="outline" icon="i-lucide-minus" label="Remove Copy"
        :disabled="(numCopies ?? 1) <= 1" @click="emit('removeCopy')" />
    </div>
    <UButton color="neutral" class="cursor-pointer" variant="outline" icon="i-lucide-hash" label="Set Copies" block
      @click="emit('setCopies')" />
    <UButton v-for="boardOption in availableBoards" :key="boardOption" color="neutral" class="cursor-pointer"
      variant="outline" :icon="boardIcon(boardOption)" :label="`Move to ${boardOption}`" block
      @click="emit('changeBoard', boardOption)" />
    <UButton v-if="showSetCommander" color="warning" class="cursor-pointer" variant="outline" icon="i-lucide-crown"
      label="Set As Commander" block @click="emit('setCommander')" />
    <UButton v-if="showClearCommander" color="warning" class="cursor-pointer" variant="outline" icon="i-lucide-crown"
      label="Remove Commander" block @click="emit('clearCommander')" />
    <UButton color="error" class="cursor-pointer" variant="outline" icon="i-lucide-trash-2" label="Remove From List"
      block @click="emit('removeFromList')" />
  </div>

  <div v-if="showSearchActions" class="preview-actions">
    <p class="preview-section-label">Search Actions</p>
    <UButton v-if="!hideThumbsDownButton" class="cursor-pointer" :color="isThumbsDownClicked ? 'error' : 'primary'"
      variant="outline" icon="i-lucide-thumbs-down" size="lg"
      :label="isThumbsDownClicked ? 'Feedback Submitted' : 'Mark As Poor Result'" block :disabled="isThumbsDownClicked"
      @click="emit('dislike')" />
    <UButton v-if="showAddToDeckbuilderButton" class="cursor-pointer" :color="isInDecklist ? 'success' : 'primary'"
      variant="outline" :icon="isInDecklist ? 'i-lucide-check' : 'i-lucide-layers-plus'" size="lg"
      :label="isInDecklist ? 'Added To Deckbuilder' : 'Add To Deckbuilder'" block @click="emit('addToDeckbuilder')" />
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import { getAffiliateLink, generateTCGPlayerSearchUrl } from '~/utils/tcgPlayer';

const boardOptions = ['Mainboard', 'Sideboard', 'Considering'] as const;
type Board = typeof boardOptions[number];

const props = withDefaults(defineProps<{
  card: Card;
  buyLabel: string;
  canShowDeckMenu?: boolean;
  findSimilarDisabled?: boolean;
  isInClipboard?: boolean;
  isDualFaced?: boolean;
  showCommanderButtons?: boolean;
  showListActions?: boolean;
  numCopies?: number;
  availableBoards?: Board[];
  showSetCommander?: boolean;
  showClearCommander?: boolean;
  showSearchActions?: boolean;
  hideThumbsDownButton?: boolean;
  isThumbsDownClicked?: boolean;
  showAddToDeckbuilderButton?: boolean;
  isInDecklist?: boolean;
}>(), {
  canShowDeckMenu: false,
  findSimilarDisabled: false,
  isInClipboard: false,
  isDualFaced: false,
  showCommanderButtons: false,
  showListActions: false,
  numCopies: 1,
  availableBoards: () => [],
  showSetCommander: false,
  showClearCommander: false,
  showSearchActions: false,
  hideThumbsDownButton: false,
  isThumbsDownClicked: false,
  showAddToDeckbuilderButton: false,
  isInDecklist: false,
});

const emit = defineEmits<{
  (e: 'findSimilar'): void;
  (e: 'openAddToDeck'): void;
  (e: 'toggleClipboard'): void;
  (e: 'flipCard'): void;
  (e: 'getRecommendations'): void;
  (e: 'viewPopularCards'): void;
  (e: 'addCopy'): void;
  (e: 'removeCopy'): void;
  (e: 'setCopies'): void;
  (e: 'changeBoard', board: Board): void;
  (e: 'setCommander'): void;
  (e: 'clearCommander'): void;
  (e: 'removeFromList'): void;
  (e: 'dislike'): void;
  (e: 'addToDeckbuilder'): void;
}>();

function boardIcon(board: Board) {
  if (board === 'Mainboard') return 'i-lucide-layout-grid';
  if (board === 'Sideboard') return 'i-lucide-columns-2';
  return 'i-lucide-help-circle';
}
</script>

<style scoped>
.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-section-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(160, 160, 160, 0.9);
}
</style>