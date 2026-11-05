<script setup lang="ts">
import { manaNames, manaColors } from '~/utils/manaDisplay';
const props = defineProps<{
  compact?: boolean;
  curve: { label: string; count: number }[];
  colors: { label: string; count: number }[];
}>();
const maximum = computed(() =>
  Math.max(1, ...props.curve.map((row) => row.count)),
);
const total = computed(() =>
  props.colors.reduce((sum, row) => sum + row.count, 0),
);
const slices = computed(() => props.colors.filter((row) => row.count));
const percentage = (count: number) =>
  `${((100 * count) / total.value).toFixed(1)}%`;
const pie = computed(() => {
  let previous = 0;
  return `conic-gradient(${slices.value
    .map((row) => {
      const start = previous;
      previous += (100 * row.count) / total.value;
      return `${manaColors[row.label]} ${start}% ${previous}%`;
    })
    .join(', ')})`;
});
</script>
<template>
  <div class="grid gap-8 sm:grid-cols-2">
    <figure aria-label="Mana curve">
      <figcaption class="font-medium mb-4">Mana curve (nonlands)</figcaption>
      <div
        class="flex items-end gap-2 border-b border-default"
        :class="compact ? 'h-32' : 'h-48'"
      >
        <div
          v-for="row in curve"
          :key="row.label"
          class="flex-1 h-full min-w-0 flex flex-col justify-end items-center gap-1"
        >
          <span class="text-sm tabular-nums">{{ row.count }}</span>
          <div
            class="w-full max-w-12 rounded-t bg-primary"
            :style="{ height: `${(row.count / maximum) * 80}%` }"
          />
        </div>
      </div>
      <div class="flex gap-2 mt-2 text-sm text-center" aria-label="Mana values">
        <span v-for="row in curve" :key="row.label" class="flex-1">{{
          row.label
        }}</span>
      </div>
      <p class="text-xs text-muted text-center mt-2">Mana value</p>
    </figure>
    <figure aria-label="Color identity">
      <figcaption class="font-medium mb-4">Color identity</figcaption>
      <div
        v-if="total"
        class="flex flex-wrap items-center justify-center gap-5"
      >
        <div
          class="rounded-full border border-default shrink-0"
          :class="compact ? 'size-28' : 'size-44'"
          :style="{ background: pie }"
          role="img"
          :aria-label="
            slices
              .map(
                (row) =>
                  `${manaNames[row.label]}: ${row.count} (${percentage(row.count)})`,
              )
              .join(', ')
          "
        />
        <ul class="space-y-2">
          <li
            v-for="row in slices"
            :key="row.label"
            class="flex items-center gap-3"
            :aria-label="`${manaNames[row.label]}: ${row.count} (${percentage(row.count)})`"
          >
            <span :title="manaNames[row.label]" class="text-2xl flex"
              ><ManaColorIcon :type="row.label"
            /></span>
            <span class="tabular-nums"
              >{{ row.count }}
              <span class="text-sm text-muted"
                >({{ percentage(row.count) }})</span
              ></span
            >
          </li>
        </ul>
      </div>
      <p v-else class="text-sm text-muted">Add cards to see their colors.</p>
      <p class="text-xs text-muted mt-3">
        Multicolor cards count in each of their colors. Percentages show each
        slice’s share of the chart.
      </p>
    </figure>
  </div>
</template>
