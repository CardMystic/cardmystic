<script setup lang="ts">
import { manaNames, manaColors } from '~/utils/manaDisplay';
const props = defineProps<{
  compact?: boolean;
  view?: 'curve' | 'colors';
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
  <div
    class="grid gap-8"
    :class="{ 'sm:grid-cols-2': !view, 'compact-charts': compact }"
  >
    <figure class="min-w-0" v-if="view !== 'colors'" aria-label="Mana curve">
      <figcaption
        class="font-medium mb-4"
        :class="{ 'border-b border-white/15 pb-2': compact }"
      >
        Mana curve<span v-if="!compact"> (nonlands)</span>
      </figcaption>
      <div
        class="curve-bars flex items-end gap-2 border-b border-default"
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
      <div
        class="curve-labels flex gap-1 sm:gap-2 mt-2 text-sm text-center"
        aria-label="Mana values"
      >
        <span v-for="row in curve" :key="row.label" class="flex-1">{{
          row.label
        }}</span>
      </div>
      <p v-if="!compact" class="text-xs text-muted text-center mt-2">
        Mana value
      </p>
    </figure>
    <figure class="min-w-0" v-if="view !== 'curve'" aria-label="Color identity">
      <figcaption
        class="font-medium mb-4"
        :class="{ 'border-b border-white/15 pb-2': compact }"
      >
        Color identity
      </figcaption>
      <div
        v-if="total"
        class="color-distribution flex flex-wrap items-center justify-center gap-5"
      >
        <div
          class="rounded-full border border-default shrink-0 max-w-full aspect-square"
          :class="compact ? 'w-28' : 'w-44'"
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
      <p v-if="!compact" class="text-xs text-muted mt-3">
        Multicolor cards count in each of their colors.
      </p>
    </figure>
  </div>
</template>

<style scoped>
@media screen {
  .compact-charts {
    grid-template-columns: repeat(auto-fit, minmax(min(8rem, 100%), 1fr));
    gap: 0.625rem;
  }
  .compact-charts figcaption {
    margin-bottom: 0.25rem;
    padding-bottom: 0.125rem;
    font-size: 0.875rem;
  }
  .compact-charts .curve-bars {
    height: 3.5rem;
    gap: 0.125rem;
  }
  .compact-charts .curve-bars span,
  .compact-charts .curve-labels {
    font-size: 0.75rem;
  }
  .compact-charts .curve-labels {
    margin-top: 0.125rem;
    gap: 0.125rem;
  }
  .compact-charts .color-distribution {
    gap: 0.375rem;
    justify-content: start;
  }
  .compact-charts .color-distribution [role='img'] {
    width: 2.5rem;
    height: 2.5rem;
  }
  .compact-charts li {
    margin: 0;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }
  .compact-charts li .text-2xl {
    font-size: 0.875rem;
  }
  .compact-charts li .text-sm {
    font-size: inherit;
  }
}
</style>
