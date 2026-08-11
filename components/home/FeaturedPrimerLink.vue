<template>
  <NuxtLink
    :to="`/lists/${primer.decklist.id}/primer`"
    class="relative block border border-black-300 dark:border-gray-400 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group min-h-65 md:min-h-97.5"
  >
    <!-- Banner background -->
    <div
      v-if="bannerImageUrl"
      class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 dark:opacity-50 dark:group-hover:opacity-80 transition-opacity"
      :style="{ backgroundImage: `url(${bannerImageUrl})` }"
    ></div>
    <div
      class="absolute inset-0 bg-linear-to-t from-white/90 via-white/60 dark:from-black/90 dark:via-black/60 to-transparent"
    ></div>

    <div class="relative p-3 md:p-4">
      <!-- Author -->
      <div class="flex items-center gap-1.5 text-xs md:text-sm mb-1 md:mb-2">
        <UIcon name="i-lucide-user" class="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <span class="truncate font-medium">
          {{ primer.decklist.username || 'Anonymous' }}
        </span>
      </div>

      <!-- Deck name + description -->
      <h3 class="text-base md:text-lg font-bold mb-0.5 line-clamp-1">
        {{ primer.decklist.name || 'Untitled deck' }}
      </h3>
      <p
        v-if="primer.decklist.description"
        class="text-xs md:text-sm mb-1 md:mb-2 line-clamp-1"
      >
        {{ primer.decklist.description }}
      </p>

      <!-- Commander or format -->
      <p class="text-xs md:text-sm mb-1 md:mb-2 line-clamp-1">
        <span v-if="primer.decklist.commanders.length">
          <UIcon name="i-lucide-crown" class="w-3 h-3 md:w-4 md:h-4 shrink-0" />
          {{ primer.decklist.commanders.join(', ') }}
        </span>
        <span v-else>
          <UIcon
            name="i-lucide-trophy"
            class="w-3 h-3 md:w-4 md:h-4 shrink-0"
          />
          {{ primer.decklist.format }}
        </span>
      </p>

      <!-- Primer preview -->
      <p
        class="text-xs md:text-sm opacity-80 line-clamp-14 italic whitespace-pre-line"
      >
        {{ primer.primer_preview }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FeaturedPrimer } from '~/models/cardListModel';

const props = defineProps<{ primer: FeaturedPrimer }>();

const bannerImageUrl = computed(() => {
  if (!props.primer.decklist.avatar_card_name) return null;
  return scryfallArtCropUrl(props.primer.decklist.avatar_card_name);
});
</script>
