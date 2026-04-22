<template>
  <div class="card-action-overlay" :class="{ 'clipboard-added': isInClipboard }" v-if="resolvedCardData">
    <UTooltip :text="isInClipboard ? 'Added to clipboard' : 'Add to clipboard'">
      <UButton class="cursor-pointer" tabindex="0" :aria-label="isInClipboard ? 'Card Added' : 'Add Card'"
        :color="isInClipboard ? 'success' : 'neutral'" variant="solid" size="md" square
        @click.stop="handleClipboardClick">
        <UIcon :name="isInClipboard ? 'i-heroicons-check' : 'i-heroicons-plus'" class="action-icon" />
      </UButton>
    </UTooltip>
    <UTooltip v-if="isDualFaced" text="Flip card">
      <UButton class="cursor-pointer" tabindex="0" aria-label="Flip Card" color="neutral" variant="solid" size="md"
        square @click.stop="emit('flip')">
        <UIcon name="i-heroicons-arrow-path" class="action-icon" />
      </UButton>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from '~/composables/useClipboard';
import { useToast } from '#imports';
import type { Card, ScryfallCard } from '~/models/cardModel';

const props = defineProps<{
  card: Card | ScryfallCard | null;
  isDualFaced?: boolean;
}>();

const emit = defineEmits<{
  (e: 'flip'): void;
}>();

const clipboard = useClipboard();
const toast = useToast();

/**
 * Resolve the actual card data structure:
 * - If parent passed a wrapper with `.card_data`, use that.
 * - Otherwise assume the passed object is already the Scryfall card.
 */
const resolvedCardData = computed(() => {
  if (!props.card) return null;
  // card wrapper (e.g., from search results) might have .card_data
  if ('card_data' in props.card) return props.card.card_data;
  // page-level card pages may pass a ScryfallCard directly
  return props.card;
});

// Create the clipboard card data structure for this card
const cardClipData = computed(() => {
  const d = resolvedCardData.value;
  if (!d) return null;
  const imageUrl = getCardImageUrl(d);
  return {
    id: d.id || '',
    name: d.name || '',
    set: d.set || '',
    imageUrl: imageUrl,
    price: d.prices?.usd || '0',
  };
});

const isInClipboard = computed(() => {
  if (!cardClipData.value) return false;
  return clipboard.has(cardClipData.value.id);
});

function handleClipboardClick() {
  if (!cardClipData.value) return;
  if (isInClipboard.value) {
    toast.add({ title: 'Card removed from clipboard', icon: 'i-lucide-clipboard-minus' });
    clipboard.remove(cardClipData.value.id);
  } else {
    toast.add({ title: 'Card added to clipboard', icon: 'i-lucide-clipboard-check' });
    clipboard.add(cardClipData.value);
  }
}
</script>

<style scoped>
.card-action-overlay {
  position: absolute;
  right: 18px;
  top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  pointer-events: auto;
  z-index: 2;
  transition: opacity 0.2s;
}

/* show on parent hover (parent classes live outside this scoped component) */
:global(.card-image-container:hover .card-action-overlay:not(.clipboard-added)),
:global(.card-image-wrapper:hover .card-action-overlay:not(.clipboard-added)),
:global(.preview-image-wrapper:hover .card-action-overlay:not(.clipboard-added)) {
  opacity: 0.7;
}

.card-action-overlay.clipboard-added {
  opacity: 0.7;
}

@media (max-width: 767px) {

  .card-action-overlay,
  .card-action-overlay.clipboard-added {
    opacity: 0.7 !important;
  }

  .card-action-overlay {
    right: 14px;
    top: 26px;
  }

  .action-icon {
    font-size: 1.1rem;
  }
}

.action-icon {
  font-size: 1.3rem;
}
</style>
