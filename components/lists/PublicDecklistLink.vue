<template>
  <NuxtLink
    :to="`/lists/${decklist.id}`"
    class="relative block border max-w-[500px] border-black-300 dark:border-gray-400 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group"
  >
    <!-- Background Image -->
    <div
      v-if="bannerImageUrl"
      class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 dark:opacity-50 dark:group-hover:opacity-80 transition-opacity"
      :style="{ backgroundImage: `url(${bannerImageUrl})` }"
    ></div>
    <div
      class="absolute inset-0 bg-linear-to-t from-white/80 via-white/40 dark:from-black/80 dark:via-black/40 to-transparent"
    ></div>

    <!-- Content -->
    <div class="relative p-2 md:p-4">
      <h3 class="text-base md:text-xl font-semibold mb-1 md:mb-2 line-clamp-1">
        {{ decklist.name || 'Untitled deck' }}
      </h3>
      <p
        v-if="decklist.description"
        class="text-xs md:text-sm mb-2 md:mb-3 line-clamp-2"
      >
        {{ decklist.description }}
      </p>
      <p v-else class="text-xs md:text-sm mb-2 md:mb-3 opacity-60 italic">
        No description
      </p>

      <div class="flex items-center justify-between text-xs md:text-sm gap-2">
        <NuxtLink
          v-if="showAuthor && decklist.username"
          :to="`/user/${decklist.user_id}`"
          class="flex items-center gap-1 hover:text-primary truncate"
          @click.stop
        >
          <UIcon name="i-lucide-user" class="w-3 h-3 md:w-4 md:h-4 shrink-0" />
          <span class="truncate">{{ decklist.username }}</span>
        </NuxtLink>
        <span v-else-if="showAuthor" class="opacity-60 italic truncate">
          Anonymous
        </span>
        <span class="shrink-0">{{ formattedDate }}</span>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4 shrink-0" />
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatShortDate } from '~/utils/dateFormatter';
import type { DecklistSummary } from '~/models/discoveryModel';

const props = withDefaults(
  defineProps<{
    decklist: DecklistSummary;
    showAuthor?: boolean;
  }>(),
  { showAuthor: true },
);

const bannerImageUrl = computed(() => {
  const cardName =
    props.decklist.avatar_card_name || props.decklist.commanders[0];
  if (!cardName) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
});

const formattedDate = computed(() => {
  if (!props.decklist.updated_at) return '';
  return formatShortDate(props.decklist.updated_at);
});
</script>
