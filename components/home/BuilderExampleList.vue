<script setup lang="ts">
import type { builderExamples } from '~/utils/search-showcase';
defineProps<{
  example: (typeof builderExamples)[number];
}>();
</script>

<template>
  <NuxtLink
    :to="`/lists/${example.id}`"
    :aria-label="example.label"
    no-prefetch
    class="deck-link relative flex min-h-60 flex-col overflow-hidden rounded-lg border border-default bg-slate-950 text-white shadow-lg hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
  >
    <img
      :src="example.image"
      alt=""
      width="626"
      height="457"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      class="absolute inset-0 size-full object-cover"
    />
    <div
      class="absolute inset-0 bg-linear-to-b from-slate-950/60 to-slate-950/95"
    />
    <div class="relative flex-1 p-4">
      <h4 class="text-lg font-bold">{{ example.label }}</h4>
      <p class="mt-2 text-xs text-slate-300">
        {{ example.format
        }}<template v-if="example.bracket">
          · Bracket {{ example.bracket }}</template
        >
      </p>
      <p class="mt-4 text-sm leading-relaxed">{{ example.description }}</p>
    </div>
    <ColorRatioBar :ratios="example.color_ratios" edge class="relative" />
  </NuxtLink>
</template>
