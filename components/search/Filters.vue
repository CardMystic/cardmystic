<template>
  <div class="filters-container">
    <v-btn @click="isExpanded = !isExpanded" variant="outlined" color="primary" class="filters-toggle-btn mb-3" block>
      <v-icon :class="{ 'rotate-180': isExpanded }" class="transition-transform">
        mdi-chevron-down
      </v-icon>
      {{ isExpanded ? 'Hide Filters' : 'Show Filters' }}
    </v-btn>

    <v-expand-transition>
      <div v-show="isExpanded" class="filters-content">
        <v-expansion-panels multiple>
          <v-expansion-panel title="Card Types">
            <v-select v-model="selectedCardTypes" :items="cardTypes" label="Card Types" multiple clearable />
          </v-expansion-panel>
          <v-expansion-panel title="Colors">
            <v-select v-model="selectedColorFilterOption" :items="colorFilterOptions" label="Color Filter Option"
              clearable />
            <v-select v-model="selectedColors" :items="cardColors" label="Colors" multiple clearable class="ml-2" />
          </v-expansion-panel>
          <v-expansion-panel title="Rarities">
            <v-select v-model="selectedRarities" :items="cardRarities" label="Rarities" multiple clearable
              class="ml-2" />
          </v-expansion-panel>
          <v-expansion-panel title="CMC / Power / Toughness">
            <v-row>
              <v-col cols="4">
                <v-select v-model="selectedCMCOption" :items="comparisonOperators" label="CMC Option" clearable />
                <v-text-field v-model="selectedCMC" label="CMC" clearable />
              </v-col>
              <v-col cols="4">
                <v-select v-model="selectedPowerOption" :items="comparisonOperators" label="Power Option" clearable />
                <v-text-field v-model="selectedPower" label="Power" clearable />
              </v-col>
              <v-col cols="4">
                <v-select v-model="selectedToughnessOption" :items="comparisonOperators" label="Toughness Option"
                  clearable />
                <v-text-field v-model="selectedToughness" label="Toughness" clearable />
              </v-col>
            </v-row>
          </v-expansion-panel>
          <v-expansion-panel title="Formats">
            <v-row v-for="(format, i) in selectedCardFormats" :key="i" class="mb-2">
              <v-col cols="6">
                <v-select v-model="format.format" :items="cardFormats" label="Format" clearable />
              </v-col>
              <v-col cols="6">
                <v-select v-model="format.status" :items="cardFormatStatuses" label="Status" clearable />
              </v-col>
            </v-row>
            <v-btn @click="addFormatRow" size="small" class="mt-2">Add Format</v-btn>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { CardType, CardColor, CardRarity, CardFormat, CardFormatStatus } from '~/models/cardModel';
import type { CardSearchFilters } from '~/models/searchModel';

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
  get: () => props.modelValue?.selectedCMC,
  set: (value) => updateFilters({ selectedCMC: value })
});

const selectedPower = computed({
  get: () => props.modelValue?.selectedPower,
  set: (value) => updateFilters({ selectedPower: value })
});

const selectedToughness = computed({
  get: () => props.modelValue?.selectedToughness,
  set: (value) => updateFilters({ selectedToughness: value })
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
</style>