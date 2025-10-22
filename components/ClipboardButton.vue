<template>
  <div class="searched-plus-btn" :class="{ 'clipboard-added': isInClipboard }" v-if="resolvedCardData">
    <UButton class="cursor-pointer" tabindex="0" :aria-label="isInClipboard ? 'Card Added' : 'Add Card'"
      :color="isInClipboard ? 'success' : 'neutral'" variant="solid" size="lg" square
      @click.stop="handleClipboardClick">
      <UIcon :name="isInClipboard ? 'i-heroicons-check' : 'i-heroicons-plus'" class="searched-plus-icon" />
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from '~/composables/useClipboard';
import { useToast } from '#imports';

const props = defineProps<{ card: Record<string, any> | null }>();

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
  if (props.card.card_data) return props.card.card_data;
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
.searched-plus-btn {
  position: absolute;
  right: 30px;
  top: 44px;
  opacity: 0;
  pointer-events: auto;
  z-index: 2;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  max-width: 36px;
  max-height: 36px;
  transition: opacity 0.2s;
}

/* show on parent hover (parent has .card-image-container or .card-image-wrapper) */
.card-image-container:hover .searched-plus-btn:not(.clipboard-added),
.card-image-wrapper:hover .searched-plus-btn:not(.clipboard-added) {
  opacity: 0.7;
}

.searched-plus-btn.clipboard-added {
  opacity: 0.7;
}

@media (max-width: 767px) {

  .searched-plus-btn,
  .searched-plus-btn.clipboard-added {
    opacity: 0.7 !important;
  }
}

.searched-plus-icon {
  font-size: 1.5rem;
}
</style>
