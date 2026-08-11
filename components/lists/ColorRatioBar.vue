<template>
  <div
    v-if="totalPercent > 0"
    role="img"
    :aria-label="ariaLabel"
    class="relative flex w-full h-1.5 rounded-full overflow-visible bg-black/10 dark:bg-white/10"
  >
    <div
      v-for="segment in visibleSegments"
      :key="segment.key"
      tabindex="0"
      role="group"
      :aria-label="`${CHANNEL_LABELS[segment.key]} ${segment.percent}%`"
      class="relative h-full first:rounded-l-full last:rounded-r-full group/segment focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :style="{ width: `${segment.percent}%`, backgroundColor: segment.color }"
    >
      <!-- Tooltip: mana icon + percentage. Shown on hover AND keyboard focus. -->
      <div
        class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/segment:flex group-focus-within/segment:flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 whitespace-nowrap z-20 shadow-md"
        role="tooltip"
      >
        <ManaIcon :type="segment.key" />
        <span>{{ segment.percent }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ColorRatios } from '~/models/cardListModel';

const props = defineProps<{ ratios: ColorRatios }>();

// MTG-canonical channel order + swatch color. Swatches roughly match the mana
// symbol palette so the bar reads at a glance.
const CHANNELS: Array<{ key: keyof ColorRatios; color: string }> = [
  { key: 'W', color: '#f8f5e0' },
  { key: 'U', color: '#3b82f6' },
  { key: 'B', color: '#3f3f46' },
  { key: 'R', color: '#ef4444' },
  { key: 'G', color: '#22c55e' },
  { key: 'C', color: '#a1a1aa' },
];

const CHANNEL_LABELS: Record<keyof ColorRatios, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
  C: 'Colorless',
};

const visibleSegments = computed(() =>
  CHANNELS.map((c) => ({
    key: c.key,
    color: c.color,
    percent: Math.round((props.ratios[c.key] ?? 0) * 100),
  })).filter((s) => s.percent > 0),
);

const totalPercent = computed(() =>
  visibleSegments.value.reduce((sum, s) => sum + s.percent, 0),
);

const ariaLabel = computed(
  () =>
    `Mana color distribution: ${visibleSegments.value
      .map((s) => `${CHANNEL_LABELS[s.key]} ${s.percent}%`)
      .join(', ')}`,
);
</script>
