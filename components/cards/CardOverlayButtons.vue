<template>
  <div
    v-if="resolvedCardData && (showClipboardControl || showFlipControl)"
    class="card-action-overlay"
    :class="{ 'clipboard-added': isInClipboard }"
  >
    <UTooltip
      v-if="showClipboardControl"
      :text="isInClipboard ? 'Added to clipboard' : 'Add to clipboard'"
    >
      <UButton
        class="cursor-pointer"
        tabindex="0"
        :aria-label="isInClipboard ? 'Card Added' : 'Add Card'"
        :color="isInClipboard ? 'success' : 'neutral'"
        variant="solid"
        size="md"
        square
        @click.stop="handleClipboardClick"
      >
        <UIcon
          :name="isInClipboard ? 'i-heroicons-check' : 'i-heroicons-plus'"
          class="action-icon"
        />
      </UButton>
    </UTooltip>

    <UTooltip v-if="showFlipControl" text="Flip card">
      <UButton
        class="cursor-pointer"
        tabindex="0"
        aria-label="Flip Card"
        color="neutral"
        variant="solid"
        size="md"
        square
        @click.stop="emit('flip')"
      >
        <UIcon name="i-heroicons-arrow-path" class="action-icon" />
      </UButton>
    </UTooltip>
  </div>

  <div
    v-if="(showMenuControl && hasMenuItems) || showCopyCountBadge"
    class="card-menu-overlay"
    :class="{ 'with-copy-count': showCopyCountBadge }"
  >
    <div
      v-if="showCopyCountBadge"
      class="copy-count-wrapper"
      :class="{ 'multi-copy': copyCount > 1 }"
    >
      <span class="copy-count-badge p-1">x{{ copyCount }}</span>
    </div>

    <div v-if="showMenuControl && hasMenuItems" class="menu-wrapper">
      <UDropdownMenu :items="menuItems ?? []">
        <UButton
          class="cursor-pointer"
          tabindex="0"
          aria-label="Card options"
          color="neutral"
          variant="solid"
          size="xs"
          square
          icon="i-lucide-ellipsis-vertical"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, ScryfallCard } from '~/models/cardModel';
import { useClipboard } from '~/composables/useClipboard';
import { getCardImageUrl } from '~/utils/scryfall';

type DropdownMenuItem = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    card: Card | ScryfallCard | null;
    isDualFaced?: boolean;
    showClipboardButton?: boolean;
    showFlipButton?: boolean;
    showMenuButton?: boolean;
    showCopyCount?: boolean;
    numCopies?: number;
    menuItems?: DropdownMenuItem[][];
  }>(),
  {
    isDualFaced: false,
    showClipboardButton: true,
    showFlipButton: false,
    showMenuButton: false,
    showCopyCount: false,
    numCopies: 1,
    menuItems: () => [],
  },
);

const emit = defineEmits<{
  (e: 'flip'): void;
}>();

const clipboard = useClipboard();

const resolvedCardData = computed(() => {
  if (!props.card) return null;
  if ('card_data' in props.card) return props.card.card_data;
  return props.card;
});

const copyCount = computed(() => Math.max(props.numCopies ?? 1, 1));
const showClipboardControl = computed(
  () => Boolean(resolvedCardData.value) && props.showClipboardButton,
);
const showFlipControl = computed(
  () =>
    Boolean(resolvedCardData.value) &&
    props.showFlipButton &&
    props.isDualFaced,
);
const showCopyCountBadge = computed(
  () => props.showCopyCount && copyCount.value > 0,
);
const hasMenuItems = computed(() => (props.menuItems?.length ?? 0) > 0);
const showMenuControl = computed(
  () => props.showMenuButton && hasMenuItems.value,
);

const cardClipData = computed(() => {
  const cardData = resolvedCardData.value;
  if (!cardData) return null;

  return {
    id: cardData.id || '',
    name: cardData.name || '',
    set: cardData.set || '',
    imageUrl: getCardImageUrl(cardData),
    price: cardData.prices?.usd || '0',
  };
});

const isInClipboard = computed(() => {
  if (!cardClipData.value) return false;
  return clipboard.has(cardClipData.value.id);
});

function handleClipboardClick() {
  if (!cardClipData.value) return;

  if (isInClipboard.value) {
    clipboard.remove(cardClipData.value.id);
    return;
  }

  clipboard.add(cardClipData.value);
}
</script>

<style scoped>
.card-action-overlay {
  position: absolute;
  right: 14px;
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

:global(.card-image-container:hover .card-action-overlay:not(.clipboard-added)),
:global(.card-image-wrapper:hover .card-action-overlay:not(.clipboard-added)) {
  opacity: 0.7;
}

.card-action-overlay.clipboard-added {
  opacity: 0.7;
}

.card-menu-overlay {
  position: absolute;
  left: 14px;
  top: 32px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: auto;
}

.card-menu-overlay.with-copy-count {
  top: 30px;
}

.copy-count-wrapper {
  opacity: 0;
  transition: opacity 0.2s;
}

.copy-count-wrapper.multi-copy {
  opacity: 1;
}

:global(.card-image-container:hover .copy-count-wrapper),
:global(.card-image-wrapper:hover .copy-count-wrapper) {
  opacity: 1;
}

.menu-wrapper {
  opacity: 0;
  transition: opacity 0.2s;
}

:global(.card-image-container:hover .menu-wrapper),
:global(.card-image-wrapper:hover .menu-wrapper) {
  opacity: 1;
}

.copy-count-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 6px;
  line-height: 1.4;
  text-align: center;
  min-width: 24px;
  user-select: none;
  pointer-events: none;
}

.action-icon {
  font-size: 1.3rem;
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

  .card-menu-overlay,
  .card-menu-overlay.with-copy-count {
    left: 12px;
    top: 30px;
  }

  .copy-count-wrapper,
  .menu-wrapper {
    opacity: 1 !important;
  }

  .action-icon {
    font-size: 1.1rem;
  }
}
</style>
