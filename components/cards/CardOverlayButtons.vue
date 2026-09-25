<template>
  <div
    v-if="resolvedCardData && (showClipboardControl || showFlipControl)"
    class="card-action-overlay"
    :class="{ 'clipboard-added': isInClipboard }"
  >
    <UButton
      v-if="showClipboardControl"
      :title="isInClipboard ? 'Added to clipboard' : 'Add to clipboard'"
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

    <UButton
      v-if="showFlipControl"
      title="Flip card"
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
  </div>

  <div
    v-if="showMenuControl || showCopyCountBadge"
    class="card-menu-overlay"
    :class="{ 'with-copy-count': showCopyCountBadge }"
  >
    <div v-if="showMenuControl" class="menu-wrapper" @click.stop>
      <UDropdownMenu :items="menuItems ?? []">
        <UButton
          class="card-menu-trigger cursor-pointer"
          tabindex="0"
          aria-label="Card options"
          color="neutral"
          variant="solid"
          size="md"
          square
        >
          <span
            class="card-menu-surface rounded-md bg-inverted"
            aria-hidden="true"
          >
            <UIcon name="i-lucide-ellipsis-vertical" class="size-5" />
          </span>
        </UButton>
      </UDropdownMenu>
    </div>

    <div
      v-if="showCopyCountBadge"
      class="copy-count-wrapper"
      :class="{ 'multi-copy': copyCount > 1 }"
    >
      <span class="copy-count-badge p-1">x{{ copyCount }}</span>
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
    oracleId: cardData.oracle_id || '',
    name: cardData.name || '',
    set: cardData.set || '',
    imageUrl: getCardImageUrl(cardData),
    price: cardData.prices?.usd || '0',
  };
});

const isInClipboard = computed(() => {
  const id = resolvedCardData.value?.id;
  return Boolean(id && clipboard.has(id));
});

function handleClipboardClick() {
  const cardData = resolvedCardData.value;
  if (!cardData) return;

  if (isInClipboard.value) {
    clipboard.remove(cardData.id);
    return;
  }

  // The payload (including its image URL) is only needed when adding a card.
  if (cardClipData.value) clipboard.add(cardClipData.value);
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

:global(
  .card-image-container:has(
      :focus-visible,
      .card-menu-trigger[data-state='open']
    )
    .card-action-overlay
),
:global(
  .card-image-wrapper:has(:focus-visible, .card-menu-trigger[data-state='open'])
    .card-action-overlay
),
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
  align-items: flex-start;
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

:global(
  .card-image-container:has(
      :focus-visible,
      .card-menu-trigger[data-state='open']
    )
    .copy-count-wrapper
),
:global(
  .card-image-wrapper:has(:focus-visible, .card-menu-trigger[data-state='open'])
    .copy-count-wrapper
),
:global(.card-image-container:hover .copy-count-wrapper),
:global(.card-image-wrapper:hover .copy-count-wrapper) {
  opacity: 1;
}

.menu-wrapper {
  opacity: 0;
  transition: opacity 0.2s;
}

:global(
  .card-image-container:has(
      :focus-visible,
      .card-menu-trigger[data-state='open']
    )
    .menu-wrapper
),
:global(
  .card-image-wrapper:has(:focus-visible, .card-menu-trigger[data-state='open'])
    .menu-wrapper
),
:global(.card-image-container:hover .menu-wrapper),
:global(.card-image-wrapper:hover .menu-wrapper) {
  opacity: 1;
}

.menu-wrapper :deep(.card-menu-trigger) {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
}

.menu-wrapper :deep(.card-menu-surface) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.menu-wrapper :deep(.card-menu-trigger:hover .card-menu-surface) {
  opacity: 0.9;
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

@media (max-width: 767px), (hover: none) {
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

  .menu-wrapper :deep(.card-menu-trigger) {
    /* Enlarge the touch target without covering more art or moving the visible button. */
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    margin: -6px;
    padding: 6px;
    touch-action: manipulation;
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
