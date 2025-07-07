<template>
  <v-expansion-panels multiple>
    <v-expansion-panel title="Card Types">
      <v-select v-model="filters.selectedCardTypes" :items="cardTypes" label="Card Types" multiple clearable />
    </v-expansion-panel>
    <v-expansion-panel title="Colors">
      <v-select v-model="filters.selectedColorFilterOption" :items="colorFilterOptions" label="Color Filter Option"
        clearable />
      <v-checkbox v-for="color in cardColors" :key="color" v-model="filters.selectedColors[color]" :label="color"
        :value="true" hide-details class="ml-2" />
    </v-expansion-panel>
    <v-expansion-panel title="Rarities">
      <v-checkbox v-for="rarity in cardRarities" :key="rarity" v-model="filters.selectedRarities[rarity]"
        :label="rarity" :value="true" hide-details class="ml-2" />
    </v-expansion-panel>
    <v-expansion-panel title="CMC / Power / Toughness">
      <v-row>
        <v-col cols="4">
          <v-select v-model="filters.selectedCMCOption" :items="comparisonOperators" label="CMC Option" clearable />
          <v-text-field v-model="filters.selectedCMC" label="CMC" clearable />
        </v-col>
        <v-col cols="4">
          <v-select v-model="filters.selectedPowerOption" :items="comparisonOperators" label="Power Option" clearable />
          <v-text-field v-model="filters.selectedPower" label="Power" clearable />
        </v-col>
        <v-col cols="4">
          <v-select v-model="filters.selectedToughnessOption" :items="comparisonOperators" label="Toughness Option"
            clearable />
          <v-text-field v-model="filters.selectedToughness" label="Toughness" clearable />
        </v-col>
      </v-row>
    </v-expansion-panel>
    <v-expansion-panel title="Formats">
      <v-row v-for="(format, i) in filters.selectedCardFormats" :key="i" class="mb-2">
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
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { CardType, CardColor, CardRarity, CardFormat, CardFormatStatus } from '~/models/cardModel';

const props = defineProps({
  filters: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:filters']);

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

const filters = ref({
  selectedCardTypes: [],
  selectedColorFilterOption: 'Contains At Least',
  selectedColors: {},
  selectedRarities: {},
  selectedCMCOption: 'Equal To',
  selectedPowerOption: 'Equal To',
  selectedToughnessOption: 'Equal To',
  selectedCMC: '',
  selectedPower: '',
  selectedToughness: '',
  selectedCardFormats: [],
  ...props.filters,
});

watch(
  filters,
  (val) => emit('update:filters', val),
  { deep: true }
);

function addFormatRow() {
  filters.value.selectedCardFormats.push({ format: '', status: '' });
}
</script>

<style></style>