<script setup lang="ts">
import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';
import { CardColor, type CardColorType } from '~/models/cardModel';
import type { ColorField, ColorFilterOption } from '~/models/filterUtilsModel';
import { cardColorToSymbol } from '~/utils/cardHelpers';
import {
  colorFilterSettings,
  normalizeSelectedColors,
} from '~/utils/colorFilters';

const filters = defineModel<CardSearchFilters>();
const settings = computed(() => colorFilterSettings(filters.value));
const fields = ['Color Identity', 'Casting Colors'];
const options = [
  { label: 'Contains at Most', value: 'Contains At Most' },
  { label: 'Contains at Least', value: 'Contains At Least' },
  { label: 'Match Exactly', value: 'Match Exactly' },
];
function update(updates: Partial<CardSearchFilters>) {
  filters.value = { ...filters.value, ...settings.value, ...updates };
}
function setOption(value: ColorFilterOption) {
  const colors = filters.value?.selectedColors ?? [];
  update({
    selectedColorFilterOption: value,
    selectedColors: normalizeSelectedColors(colors, ['Colorless'], value),
  });
}
function toggle(color: CardColorType, checked: boolean) {
  const previous = filters.value?.selectedColors ?? [];
  const next = checked
    ? [...previous, color]
    : previous.filter((item) => item !== color);
  update({
    selectedColors: normalizeSelectedColors(
      next,
      previous,
      settings.value.selectedColorFilterOption,
    ),
  });
}
</script>

<template>
  <div class="space-y-3">
    <URadioGroup
      aria-label="Color field"
      :model-value="settings.selectedColorField"
      :items="fields"
      :ui="{ label: 'text-base', legend: 'text-base' }"
      @update:model-value="update({ selectedColorField: $event as ColorField })"
    />
    <USelect
      aria-label="Color matching rule"
      :model-value="settings.selectedColorFilterOption"
      :items="options"
      class="w-full"
      :ui="{ base: 'text-base' }"
      @update:model-value="setOption($event as ColorFilterOption)"
    />
    <div class="color-checkboxes grid grid-cols-2 gap-2 sm:grid-cols-3">
      <UCheckbox
        v-for="color in CardColor.options"
        :key="color"
        :model-value="filters?.selectedColors?.includes(color) ?? false"
        variant="card"
        :ui="{ root: 'p-2 min-w-0', label: 'text-base' }"
        @update:model-value="toggle(color, $event === true)"
      >
        <template #label>
          <span class="flex flex-wrap items-center gap-1">
            <ManaColorIcon :type="cardColorToSymbol(color)" />
            {{ color }}
          </span>
        </template>
      </UCheckbox>
    </div>
  </div>
</template>
