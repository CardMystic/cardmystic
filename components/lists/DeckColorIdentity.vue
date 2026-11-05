<script setup lang="ts">
import type { ColorRatios } from '~/models/cardListModel';
import { deckColors } from '~/utils/deckLibrary';
import { getColorIdentityName, type CardColor } from '~/utils/colorPairings';

const props = defineProps<{ ratios: ColorRatios }>();
const names: Record<string, CardColor> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
  C: 'Colorless',
};
const colors = computed(() => deckColors(props.ratios));
const identity = computed(() => {
  const values = colors.value.map((color) => names[color]);
  if (values.length === 1 && values[0] === 'Colorless') return 'Colorless';
  return values.length === 1 && values[0] !== 'Colorless'
    ? `Mono-${values[0]}`
    : getColorIdentityName(values);
});
</script>

<template>
  <span
    v-if="colors.length"
    class="inline-flex flex-wrap items-center justify-end gap-1"
  >
    <span class="inline-flex items-center text-lg" aria-hidden="true">
      <ManaColorIcon v-for="color in colors" :key="color" :type="color" />
    </span>
    <span>{{ identity }}</span>
  </span>
</template>
