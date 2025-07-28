<template>
  <div class="filters-container">
    <!-- Active Filters Chips -->
    <div v-if="hasActiveFilters" class="active-filters-section mb-4">
      <div class="active-filters-chips">
        <!-- Card Types Chips -->
        <UChip v-for="cardType in selectedCardTypes || []" :key="`type-${cardType}`" color="primary" size="sm"
          class="ma-1" closable @close="removeCardType(cardType)">
          {{ cardType }}
        </UChip>

        <!-- Colors Chips -->
        <UChip v-for="color in selectedColors || []" :key="`color-${color}`" color="primary" size="sm" class="ma-1"
          closable @close="removeColor(color)">
          <ManaIcon :type="cardColorToSymbol(color)" class="mr-1" />
          {{ color }}
        </UChip>

        <!-- Rarities Chips -->
        <UChip v-for="rarity in selectedRarities || []" :key="`rarity-${rarity}`" color="primary" size="sm" class="ma-1"
          closable @close="removeRarity(rarity)">
          {{ rarity }}
        </UChip>

        <!-- Stats Chips -->
        <UChip v-if="selectedCMC" color="info" size="sm" class="ma-1" closable @close="clearCMC">
          CMC {{ selectedCMCOption || 'Equal To' }} {{ selectedCMC }}
        </UChip>

        <UChip v-if="selectedPower" color="info" size="sm" class="ma-1" closable @close="clearPower">
          Power {{ selectedPowerOption || 'Equal To' }} {{ selectedPower }}
        </UChip>

        <UChip v-if="selectedToughness" color="info" size="sm" class="ma-1" closable @close="clearToughness">
          Toughness {{ selectedToughnessOption || 'Equal To' }} {{ selectedToughness }}
        </UChip>

        <!-- Color Filter Option Chip -->
        <UChip v-if="selectedColorFilterOption && selectedColorFilterOption !== 'Contains At Least'" color="warning"
          size="sm" class="ma-1" closable @close="clearColorFilterOption">
          Color: {{ selectedColorFilterOption }}
        </UChip>

        <!-- Formats Chips -->
        <template v-for="(formatItem, index) in selectedCardFormats || []" :key="`format-${index}`">
          <UChip v-if="formatItem.format || formatItem.status" color="success" size="sm" class="ma-1" closable
            @close="removeFormat(index)">
            {{ formatItem.format || 'Any' }} - {{ formatItem.status || 'Any Status' }}
          </UChip>
        </template>

        <!-- Clear All Button -->
        <UButton v-if="hasActiveFilters" color="error" size="sm" class="ma-1 rounded-pill" @click="clearAllFilters"
          icon="i-lucide-circle-x">
          Clear All
        </UButton>
      </div>
    </div>
    <UCollapsible class="flex flex-col gap-2 mb-4">
      <UButton class="filters-toggle-btn mb-3" label="Filters" color="primary" variant="subtle"
        trailing-icon="i-lucide-chevron-down" :ui="{
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
        }" block />

      <!-- Filters Content -->
      <template #content class="filters-content mb-4">
        <UAccordion type="multiple" :unmount-on-hide="false" :items="items">
          <!-- Types Filter -->
          <template #types>
            <div class="accordion-item">
              <USelectMenu v-model="selectedCardTypes" :items="cardTypes" placeholder="Select card types" multiple
                class="w-full" />
            </div>
          </template>
          <!-- Colors Filter -->
          <template #colors>
            <div class="accordion-item">
              <USelect v-model="selectedColorFilterOption" :items="colorFilterOptions" placeholder="Color matching"
                clearable class="w-full" />
              <div class="color-checkboxes">
                <UCheckboxGroup :items="cardColors" orientation="horizontal" variant="card" v-model="selectedColors"
                  class="w-full">
                  <template #label="{ item }">
                    <ManaIcon
                      :type="cardColorToSymbol((item as { value: 'White' | 'Blue' | 'Black' | 'Red' | 'Green' }).value)"
                      class="mr-1" />
                    <!-- Typescript gets confused with the CheckboxGroupItem type so we have to help it out a bit -->
                    {{ (item as { value: string }).value }}
                  </template>
                </UCheckboxGroup>
              </div>
            </div>
          </template>
          <!-- Rarities Filter -->
          <template #rarities>
            <div class="accordion-item">
              <UCheckboxGroup :items="cardRarities" orientation="horizontal" variant="card"
                v-model="selectedRarities" />
            </div>
          </template>
          <!-- Stats Filter -->
          <template #stats>
            <div class="accordion-item">
              <div class="stats-grid">
                <div class="stat-group">
                  <label class="stat-label">Mana Cost</label>
                  <USelect placeholder="Mana Cost Comparison" v-model="selectedCMCOption"
                    :items="comparisonOperators" />
                  <UInput v-model="selectedCMC" placeholder="Any value, e.g. '3'" type="number" />
                </div>
                <div class="stat-group">
                  <label class="stat-label">Power</label>
                  <USelect placeholder="Power Comparison" v-model="selectedPowerOption" :items="comparisonOperators" />
                  <UInput v-model="selectedPower" placeholder="Any value, e.g. '2'" type="number" />
                </div>
                <div class="stat-group">
                  <label class="stat-label">Toughness</label>
                  <USelect placeholder="Toughness Comparison" v-model="selectedToughnessOption"
                    :items="comparisonOperators" />
                  <UInput v-model="selectedToughness" placeholder="Any value, e.g. '2'" type="number" />
                </div>
              </div>
            </div>
          </template>
          <!-- Formats Filter -->
          <template #formats>
            <div class="accordion-item">
              <div v-if="selectedCardFormats && selectedCardFormats.length > 0">
                <div v-for="(format, i) in selectedCardFormats" :key="i" class="mb-3" style="display: flex; gap: 8px;">
                  <USelect v-model="format.format" :items="cardFormats" label="Format" clearable />
                  <USelect v-model="format.status" :items="cardFormatStatuses" label="Status" clearable />
                </div>
              </div>
              <UButton @click="addFormatRow" color="primary" size="sm" icon="i-lucide-plus">
                Add Format
              </UButton>
            </div>
          </template>
        </UAccordion>
      </template>
    </UCollapsible>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { z } from 'zod';
import { CardType, CardColor, CardRarity, CardFormat, CardFormatStatus, cardColorToSymbol } from '~/models/cardModel';
import type { CardSearchFilters } from '~/models/searchModel';
import ManaIcon from '../manaIcon.vue';
import type { AccordionItem, CheckboxGroupItem, CheckboxGroupValue } from '@nuxt/ui';

type CardColorType = z.infer<typeof CardColor>;
type CardRarityType = z.infer<typeof CardRarity>;

const { modelValue } = defineProps<{ modelValue?: CardSearchFilters }>();

const emit = defineEmits<{
  'update:modelValue': [value: CardSearchFilters]
}>();

const items = [
  {
    label: 'Card Types',
    icon: 'i-lucide-shapes',
    slot: 'types' as const
  },
  {
    label: 'Colors',
    icon: 'i-lucide-palette',
    slot: 'colors' as const
  },
  {
    label: 'Rarities',
    icon: 'i-lucide-star',
    slot: 'rarities' as const
  },
  {
    label: 'Stats',
    icon: 'i-lucide-calculator',
    slot: 'stats' as const
  },
  {
    label: 'Formats',
    icon: 'i-lucide-trophy',
    slot: 'formats' as const
  }
] satisfies AccordionItem[]

const cardTypes = CardType.options;
const cardFormats = CardFormat.options;
const cardFormatStatuses = CardFormatStatus.options;
const colorFilterOptions = [
  'Match Exactly',
  'Contains At Least',
  'Contains At Most',
];
const comparisonOperators = [
  'Equal To',
  'Not Equal To',
  'Greater Than',
  'Less Than',
];

function updateFilters(updates: Partial<CardSearchFilters>) {
  const current = modelValue || {} as CardSearchFilters;
  const newValue = { ...current, ...updates };
  emit('update:modelValue', newValue);
}

// Computed property to check if there are any active filters
const hasActiveFilters = computed(() => {
  const filters = modelValue;
  if (!filters) return false;

  return !!(
    (filters.selectedCardTypes && filters.selectedCardTypes.length > 0) ||
    (filters.selectedColors && filters.selectedColors.length > 0) ||
    (filters.selectedRarities && filters.selectedRarities.length > 0) ||
    filters.selectedCMC ||
    filters.selectedPower ||
    filters.selectedToughness ||
    (filters.selectedColorFilterOption && filters.selectedColorFilterOption !== 'Contains At Least') ||
    (filters.selectedCardFormats && filters.selectedCardFormats.length > 0)
  );
});

const selectedCardTypes = computed({
  get: () => modelValue?.selectedCardTypes,
  set: (value) => updateFilters({ selectedCardTypes: value })
});

const selectedColorFilterOption = computed({
  get: () => modelValue?.selectedColorFilterOption,
  set: (value) => {
    updateFilters({ selectedColorFilterOption: value })
  }
});

const cardColors = CardColor.options.map(color => ({
  label: color,
  value: color
})) as CheckboxGroupItem[];

const selectedColors = computed({
  get: () => modelValue?.selectedColors || [],
  set: (value) => updateFilters({ selectedColors: value })
});

const cardRarities = CardRarity.options.map(rarity => ({
  label: rarity,
  value: rarity
})) as CheckboxGroupItem[];

const selectedRarities = computed({
  get: () => modelValue?.selectedRarities || [],
  set: (value) => updateFilters({ selectedRarities: value })
});

const selectedCMCOption = computed({
  get: () => modelValue?.selectedCMCOption,
  set: (value) => updateFilters({ selectedCMCOption: value })
});

const selectedPowerOption = computed({
  get: () => modelValue?.selectedPowerOption,
  set: (value) => updateFilters({ selectedPowerOption: value })
});

const selectedToughnessOption = computed({
  get: () => modelValue?.selectedToughnessOption,
  set: (value) => updateFilters({ selectedToughnessOption: value })
});

const selectedCMC = computed({
  get: () => modelValue?.selectedCMC ? Number(modelValue.selectedCMC) : undefined,
  set: (value) => updateFilters({ selectedCMC: value ? String(value) : undefined })
});

const selectedPower = computed({
  get: () => modelValue?.selectedPower ? Number(modelValue.selectedPower) : undefined,
  set: (value) => updateFilters({ selectedPower: value ? String(value) : undefined })
});

const selectedToughness = computed({
  get: () => modelValue?.selectedToughness ? Number(modelValue.selectedToughness) : undefined,
  set: (value) => updateFilters({ selectedToughness: value ? String(value) : undefined })
});

const selectedCardFormats = computed({
  get: () => modelValue?.selectedCardFormats,
  set: (value) => updateFilters({ selectedCardFormats: value })
});

function addFormatRow() {
  const currentFormats = [...(modelValue?.selectedCardFormats || [])];
  currentFormats.push({ format: undefined, status: undefined });
  updateFilters({ selectedCardFormats: currentFormats });
}

// Chip removal functions
function removeCardType(cardType: string) {
  const currentTypes = [...(modelValue?.selectedCardTypes || [])];
  const index = currentTypes.indexOf(cardType as any);
  if (index !== -1) {
    currentTypes.splice(index, 1);
    updateFilters({ selectedCardTypes: currentTypes.length > 0 ? currentTypes : undefined });
  }
}

function removeColor(color: CardColorType) {
  const currentColors = [...(modelValue?.selectedColors || [])];
  const index = currentColors.indexOf(color);
  if (index !== -1) {
    currentColors.splice(index, 1);
    updateFilters({ selectedColors: currentColors.length > 0 ? currentColors : undefined });
  }
}

function removeRarity(rarity: CardRarityType) {
  const currentRarities = [...(modelValue?.selectedRarities || [])];
  const index = currentRarities.indexOf(rarity);
  if (index !== -1) {
    currentRarities.splice(index, 1);
    updateFilters({ selectedRarities: currentRarities.length > 0 ? currentRarities : undefined });
  }
}

function clearCMC() {
  updateFilters({ selectedCMC: undefined, selectedCMCOption: undefined });
}

function clearPower() {
  updateFilters({ selectedPower: undefined, selectedPowerOption: undefined });
}

function clearToughness() {
  updateFilters({ selectedToughness: undefined, selectedToughnessOption: undefined });
}

function clearColorFilterOption() {
  updateFilters({ selectedColorFilterOption: undefined });
}

function removeFormat(index: number) {
  const currentFormats = [...(modelValue?.selectedCardFormats || [])];
  currentFormats.splice(index, 1);
  updateFilters({ selectedCardFormats: currentFormats.length > 0 ? currentFormats : undefined });
}

function clearAllFilters() {
  updateFilters({
    selectedCardTypes: undefined,
    selectedColors: undefined,
    selectedRarities: undefined,
    selectedCMC: undefined,
    selectedPower: undefined,
    selectedToughness: undefined,
    selectedCMCOption: undefined,
    selectedPowerOption: undefined,
    selectedToughnessOption: undefined,
    selectedColorFilterOption: undefined,
    selectedCardFormats: undefined
  });
}
</script>

<style scoped>
.filters-container {
  width: 100%;
}

.filters-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.filters-toggle-btn .v-icon {
  transition: transform 0.3s ease-in-out;
}

.rotate-180 {
  transform: rotate(180deg);
}

.transition-transform {
  transition: transform 0.3s ease-in-out;
}

.filters-content {
  margin-top: 8px;
}

.active-filters-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.accordion-item {
  margin-bottom: 16px;
}

.color-checkboxes {
  margin-top: 8px;
  width: 100%;
}

.color-checkboxes>div {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.87);
  margin-bottom: 0;
  display: block;
}

.v-expansion-panel-title {
  font-weight: 500;
}

.v-expansion-panel-text {
  padding-top: 16px;
}
</style>