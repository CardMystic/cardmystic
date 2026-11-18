<script setup lang="ts">
import type { ScryfallCard } from '~/models/cardModel';
import { getCardImageUrl } from '~/utils/scryfall';

const props = withDefaults(
  defineProps<{
    card: ScryfallCard;
    src?: string;
    imageClass?: string;
  }>(),
  { imageClass: 'aspect-[488/680]' },
);
const emit = defineEmits<{ error: [event: Event] }>();
const imageUrl = computed(() => props.src ?? getCardImageUrl(props.card));
</script>

<template>
  <span class="relative block w-full rounded-[inherit]">
    <GameChangerBadge v-if="card.game_changer" />
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="card.name"
      width="488"
      height="680"
      loading="lazy"
      decoding="async"
      class="block w-full h-auto rounded-[inherit] object-cover"
      :class="imageClass"
      @error="emit('error', $event)"
    />
    <span
      v-else
      class="flex w-full items-center justify-center rounded-[inherit] bg-elevated p-5 text-center text-muted"
      :class="imageClass"
    >
      {{ card.name }}
    </span>
  </span>
</template>
