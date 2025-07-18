<template>
  <div class="filters-container">
    <!-- Active Filters Chips -->
    <div v-if="hasActiveFilters" class="active-filters-section mb-4">
      <div class="active-filters-chips">
        <!-- Card Types Chips -->
        <v-chip v-for="cardType in selectedCardTypes || []" :key="`type-${cardType}`" closable color="primary"
          variant="outlined" size="small" class="ma-1" @click:close="removeCardType(cardType)">
          {{ cardType }}
        </v-chip>

        <!-- Colors Chips -->
        <v-chip v-for="color in selectedColors || []" :key="`color-${color}`" closable color="primary"
          variant="outlined" size="small" class="ma-1" @click:close="removeColor(color)">
          <ManaIcon :type="cardColorToSymbol(color)" class="mr-1" />
          {{ color }}
        </v-chip>

        <!-- Rarities Chips -->
        <v-chip v-for="rarity in selectedRarities || []" :key="`rarity-${rarity}`" closable color="accent"
          variant="outlined" size="small" class="ma-1" @click:close="removeRarity(rarity)">
          {{ rarity }}
        </v-chip>

        <!-- Stats Chips -->
        <v-chip v-if="selectedCMC" closable color="info" variant="outlined" size="small" class="ma-1"
          @click:close="clearCMC">
          CMC {{ selectedCMCOption || 'Equal To' }} {{ selectedCMC }}
        </v-chip>

        <v-chip v-if="selectedPower" closable color="info" variant="outlined" size="small" class="ma-1"
          @click:close="clearPower">
          Power {{ selectedPowerOption || 'Equal To' }} {{ selectedPower }}
        </v-chip>

        <v-chip v-if="selectedToughness" closable color="info" variant="outlined" size="small" class="ma-1"
          @click:close="clearToughness">
          Toughness {{ selectedToughnessOption || 'Equal To' }} {{ selectedToughness }}
        </v-chip>

        <!-- Color Filter Option Chip -->
        <v-chip v-if="selectedColorFilterOption && selectedColorFilterOption !== 'Contains At Least'" closable
          color="warning" variant="outlined" size="small" class="ma-1" @click:close="clearColorFilterOption">
          Color: {{ selectedColorFilterOption }}
        </v-chip>

        <!-- Formats Chips -->
        <template v-for="(formatItem, index) in selectedCardFormats || []" :key="`format-${index}`">
          <v-chip v-if="formatItem.format || formatItem.status" closable color="success" variant="outlined" size="small"
            class="ma-1" @click:close="removeFormat(index)">
            {{ formatItem.format || 'Any' }} - {{ formatItem.status || 'Any Status' }}
          </v-chip>
        </template>

        <!-- Clear All Button -->
        <v-btn v-if="hasActiveFilters" variant="tonal" color="error" size="small" class="ma-1 rounded-pill"
          @click="clearAllFilters" prepend-icon="mdi-close">
          Clear All
        </v-btn>
      </div>
    </div>

    <v-btn @click="isExpanded = !isExpanded" variant="outlined" color="primary" class="filters-toggle-btn mb-3" block>
      <v-icon :class="{ 'rotate-180': isExpanded }" class="transition-transform">
        mdi-chevron-down
      </v-icon>
      {{ isExpanded ? 'Hide Filters' : 'Show Filters' }}
    </v-btn>

    <v-expand-transition>
      <div v-show="isExpanded" class="filters-content mb-4">
        <v-expansion-panels multiple variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-shape</v-icon>
              Card Types
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select v-model="selectedCardTypes" :items="cardTypes" label="Select card types" multiple clearable
                chips variant="outlined" density="comfortable" />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-palette</v-icon>
              Colors
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select v-model="selectedColorFilterOption" :items="colorFilterOptions" label="Color matching" clearable
                variant="outlined" density="comfortable" />

              <div class="color-checkboxes">
                <v-checkbox v-for="color in cardColors" :key="color" :label="color"
                  :model-value="isColorSelected(color)" @update:model-value="(value) => toggleColor(color, value)"
                  color="primary" density="compact" hide-details>
                  <template #label>
                    <ManaIcon :type="cardColorToSymbol(color)" class="mr-1" />
                    {{ color }}
                  </template>
                </v-checkbox>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-star</v-icon>
              Rarities
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="rarity-checkboxes">
                <v-checkbox v-for="rarity in cardRarities" :key="rarity" :label="rarity"
                  :model-value="isRaritySelected(rarity)" @update:model-value="(value) => toggleRarity(rarity, value)"
                  color="primary" density="compact" hide-details />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-calculator</v-icon>
              Stats
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="4">
                  <div class="stat-group">
                    <label class="stat-label">Mana Cost</label>
                    <v-select v-model="selectedCMCOption" :items="comparisonOperators" variant="outlined"
                      density="compact" hide-details class="mb-2" />
                    <v-number-input v-model="selectedCMC" placeholder="Any value, e.g. '3'" variant="outlined"
                      density="compact" hide-details />
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="stat-group">
                    <label class="stat-label">Power</label>
                    <v-select v-model="selectedPowerOption" :items="comparisonOperators" variant="outlined"
                      density="compact" hide-details class="mb-2" />
                    <v-number-input v-model="selectedPower" placeholder="Any value, e.g. '2'" variant="outlined"
                      density="compact" hide-details />
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="stat-group">
                    <label class="stat-label">Toughness</label>
                    <v-select v-model="selectedToughnessOption" :items="comparisonOperators" variant="outlined"
                      density="compact" hide-details class="mb-2" />
                    <v-number-input v-model="selectedToughness" placeholder="Any value, e.g. '2'" variant="outlined"
                      density="compact" hide-details />
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-tournament</v-icon>
              Formats
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="selectedCardFormats && selectedCardFormats.length > 0">
                <v-row v-for="(format, i) in selectedCardFormats" :key="i" class="mb-3">
                  <v-col cols="6">
                    <v-select v-model="format.format" :items="cardFormats" label="Format" variant="outlined"
                      density="compact" clearable />
                  </v-col>
                  <v-col cols="6">
                    <v-select v-model="format.status" :items="cardFormatStatuses" label="Status" variant="outlined"
                      density="compact" clearable />
                  </v-col>
                </v-row>
              </div>
              <v-btn @click="addFormatRow" variant="outlined" color="primary" size="small" prepend-icon="mdi-plus">
                Add Format
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { z } from 'zod';
import { CardType, CardColor, CardRarity, CardFormat, CardFormatStatus, cardColorToSymbol } from '~/models/cardModel';
import type { CardSearchFilters } from '~/models/searchModel';
import ManaIcon from '../manaIcon.vue';

type CardColorType = z.infer<typeof CardColor>;
type CardRarityType = z.infer<typeof CardRarity>;

const props = defineProps<{
  modelValue?: CardSearchFilters
}>();

const emit = defineEmits<{
  'update:modelValue': [value: CardSearchFilters]
}>();

// Collapsible state
const isExpanded = ref(false);

const cardTypes = CardType.options;
const cardColors = CardColor.options;
const cardRarities = CardRarity.options;
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
  const current = props.modelValue ?? {} as CardSearchFilters;
  emit('update:modelValue', { ...current, ...updates });
}

// Computed property to check if there are any active filters
const hasActiveFilters = computed(() => {
  const filters = props.modelValue;
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
  get: () => props.modelValue?.selectedCardTypes,
  set: (value) => updateFilters({ selectedCardTypes: value })
});

const selectedColorFilterOption = computed({
  get: () => props.modelValue?.selectedColorFilterOption,
  set: (value) => {
    updateFilters({ selectedColorFilterOption: value })
  }
});

const selectedColors = computed({
  get: () => (props.modelValue?.selectedColors),
  set: (value) => {
    updateFilters({ selectedColors: value });
  }
});

const selectedRarities = computed({
  get: () => (props.modelValue?.selectedRarities),
  set: (value) => updateFilters({ selectedRarities: value })
});

const selectedCMCOption = computed({
  get: () => props.modelValue?.selectedCMCOption,
  set: (value) => updateFilters({ selectedCMCOption: value })
});

const selectedPowerOption = computed({
  get: () => props.modelValue?.selectedPowerOption,
  set: (value) => updateFilters({ selectedPowerOption: value })
});

const selectedToughnessOption = computed({
  get: () => props.modelValue?.selectedToughnessOption,
  set: (value) => updateFilters({ selectedToughnessOption: value })
});

const selectedCMC = computed({
  get: () => Number(props.modelValue?.selectedCMC),
  set: (value) => updateFilters({ selectedCMC: value ? String(value) : undefined })
});

const selectedPower = computed({
  get: () => Number(props.modelValue?.selectedPower),
  set: (value) => updateFilters({ selectedPower: value ? String(value) : undefined })
});

const selectedToughness = computed({
  get: () => Number(props.modelValue?.selectedToughness),
  set: (value) => updateFilters({ selectedToughness: value ? String(value) : undefined })
});

const selectedCardFormats = computed({
  get: () => props.modelValue?.selectedCardFormats,
  set: (value) => updateFilters({ selectedCardFormats: value })
});

function addFormatRow() {
  const currentFormats = [...(props.modelValue?.selectedCardFormats || [])];
  currentFormats.push({ format: undefined, status: undefined });
  updateFilters({ selectedCardFormats: currentFormats });
}

// Helper functions for color checkboxes
function isColorSelected(color: CardColorType): boolean {
  return props.modelValue?.selectedColors?.includes(color) ?? false;
}

function toggleColor(color: CardColorType, isSelected: boolean | null) {
  if (isSelected === null) isSelected = false;

  const currentColors = [...(props.modelValue?.selectedColors || [])];
  const colorIndex = currentColors.indexOf(color);

  if (isSelected && colorIndex === -1) {
    currentColors.push(color);
  } else if (!isSelected && colorIndex !== -1) {
    currentColors.splice(colorIndex, 1);
  }

  updateFilters({ selectedColors: currentColors });
}

// Helper functions for rarity checkboxes
function isRaritySelected(rarity: CardRarityType): boolean {
  return props.modelValue?.selectedRarities?.includes(rarity) ?? false;
}

function toggleRarity(rarity: CardRarityType, isSelected: boolean | null) {
  if (isSelected === null) isSelected = false;

  const currentRarities = [...(props.modelValue?.selectedRarities || [])];
  const rarityIndex = currentRarities.indexOf(rarity);

  if (isSelected && rarityIndex === -1) {
    currentRarities.push(rarity);
  } else if (!isSelected && rarityIndex !== -1) {
    currentRarities.splice(rarityIndex, 1);
  }

  updateFilters({ selectedRarities: currentRarities });
}

// Chip removal functions
function removeCardType(cardType: string) {
  const currentTypes = [...(props.modelValue?.selectedCardTypes || [])];
  const index = currentTypes.indexOf(cardType as any);
  if (index !== -1) {
    currentTypes.splice(index, 1);
    updateFilters({ selectedCardTypes: currentTypes });
  }
}

function removeColor(color: CardColorType) {
  const currentColors = [...(props.modelValue?.selectedColors || [])];
  const index = currentColors.indexOf(color);
  if (index !== -1) {
    currentColors.splice(index, 1);
    updateFilters({ selectedColors: currentColors });
  }
}

function removeRarity(rarity: CardRarityType) {
  const currentRarities = [...(props.modelValue?.selectedRarities || [])];
  const index = currentRarities.indexOf(rarity);
  if (index !== -1) {
    currentRarities.splice(index, 1);
    updateFilters({ selectedRarities: currentRarities });
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
  const currentFormats = [...(props.modelValue?.selectedCardFormats || [])];
  currentFormats.splice(index, 1);
  updateFilters({ selectedCardFormats: currentFormats });
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

.color-checkboxes,
.rarity-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.stat-group {
  margin-bottom: 16px;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.87);
  margin-bottom: 8px;
  display: block;
}

.v-expansion-panel-title {
  font-weight: 500;
}

.v-expansion-panel-text {
  padding-top: 16px;
}

/* Responsive adjustments */
@media (max-width: 768px) {

  .color-checkboxes,
  .rarity-checkboxes {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 4px;
  }
}
</style>