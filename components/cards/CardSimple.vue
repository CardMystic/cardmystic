<template>
  <div class="card-simple">
    <img :class="sizeClass" :src="getCardImageUrl(card.card_data)" :alt="card.card_data.name" @error="handleImageError"
      v-if="getCardImageUrl(card.card_data)" loading="lazy" decoding="async" @click="navigateToCard(card.card_data.id)"
      class="cursor-pointer" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { Card } from '~/models/cardModel';
import { useRouter } from 'vue-router';
import { getCardImageUrl } from '~/utils/scryfall';

const router = useRouter();

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  size: {
    type: String as PropType<'small' | 'large'>,
    default: 'large',
  },
});

const sizeClass = computed(() => `card-${props.size}`);

function navigateToCard(cardId: string | undefined) {
  if (!cardId) {
    console.warn('Cannot navigate to card: ID is undefined');
    return;
  }
  router.push(`/card/${cardId}`);
}

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}
</script>

<style scoped>
.card-simple {
  width: 100%;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-simple:hover {
  transform: scale(1.05);
}

.card-small {
  aspect-ratio: 5/7;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.card-large {
  aspect-ratio: 5/7;
  width: 100%;
  object-fit: cover;
  border-radius: 14px;
}
</style>
