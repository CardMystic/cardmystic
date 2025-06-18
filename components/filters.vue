<template>
  <v-expansion-panels v-model="panel">
    <v-expansion-panel value="1" title="Filters" color="white">
      <template #text>
        <!-- Type Filter -->
        <v-row class="mt-0">
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-paw</v-icon>Types</v-label
            >
          </v-col>
          <v-col class="align-center justify-content-center">
            <v-select
              :items="cardTypes"
              v-model="filters.selectedCardTypes"
              :multiple="true"
              :chips="true"
              clearable
            ></v-select>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Color Filters -->
        <v-row>
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white">
              <v-icon class="mr-1">mdi-palette</v-icon>Color
            </v-label>
          </v-col>

          <v-col cols="12" md="9">
            <div class="d-flex flex-wrap" style="gap: 8px">
              <v-checkbox
                v-for="color in cardColors"
                :key="color"
                :label="color"
                :value="true"
                v-model="filters.selectedColors[color]"
                style="white-space: nowrap"
              />
            </div>

            <v-select
              class="mt-4"
              style="max-width: 250px"
              :items="colorFiltersOptions"
              v-model="filters.selectedColorFilterOption"
            />
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Rarity Filter -->
        <v-row>
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white">
              <v-icon class="mr-1">mdi-cards-playing</v-icon>Rarity
            </v-label>
          </v-col>

          <v-col cols="12" md="9">
            <div class="d-flex flex-wrap" style="gap: 8px">
              <v-checkbox
                v-for="rarity in cardRarities"
                :key="rarity"
                :label="rarity"
                :value="rarity"
                v-model="filters.selectedRarities[rarity]"
                style="white-space: nowrap"
              />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- CMC Filter -->
        <v-row class="mt-1">
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white">
              <v-icon class="mr-1">mdi-gold</v-icon>CMC
            </v-label>
          </v-col>

          <v-col cols="12" md="9">
            <div class="d-flex flex-wrap align-center" style="gap: 12px">
              <v-select
                :items="statOptions"
                v-model="filters.selectedCMCOption"
                style="max-width: 250px"
              />
              <v-text-field
                v-model="filters.selectedCMC"
                type="number"
                style="max-width: 150px"
                clearable
              />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Power Filter -->
        <v-row class="mt-1">
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white">
              <v-icon class="mr-1">mdi-arm-flex</v-icon>Power
            </v-label>
          </v-col>

          <v-col cols="12" md="9">
            <div class="d-flex flex-wrap align-center" style="gap: 12px">
              <v-select
                :items="statOptions"
                v-model="filters.selectedPowerOption"
                style="max-width: 250px"
              />
              <v-text-field
                v-model="filters.selectedPower"
                type="number"
                style="max-width: 150px"
                clearable
              />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Toughness Filter -->
        <v-row class="mt-1">
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white">
              <v-icon class="mr-1">mdi-wall</v-icon>Defense
            </v-label>
          </v-col>

          <v-col cols="12" md="9">
            <div class="d-flex flex-wrap align-center" style="gap: 12px">
              <v-select
                :items="statOptions"
                v-model="filters.selectedToughnessOption"
                style="max-width: 250px"
              />
              <v-text-field
                v-model="filters.selectedToughness"
                type="number"
                style="max-width: 150px"
                clearable
              />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Legality Filter -->
        <v-row class="mt-1">
          <v-col
            cols="12"
            md="3"
            class="d-flex align-center justify-content-center"
          >
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white">
              <v-icon class="mr-1">mdi-shield-check</v-icon>Legality
            </v-label>
          </v-col>

          <v-col cols="12" md="9">
            <div
              v-for="(entry, index) in filters.selectedCardFormats"
              :key="index"
              class="d-flex flex-wrap align-center mb-2"
              style="gap: 12px"
            >
              <div style="flex: 1 1 200px; min-width: 160px">
                <v-select
                  label="Format"
                  :items="cardFormats"
                  v-model="entry.format"
                  clearable
                />
              </div>

              <div style="flex: 1 1 200px; min-width: 160px">
                <v-select
                  label="Legality"
                  :items="cardFormatStatuses"
                  v-model="entry.status"
                  clearable
                />
              </div>
            </div>
          </v-col>
        </v-row>
        <div class="d-flex gap-3 justify-end">
          <v-btn
            style="height: 56px"
            class="mr-2"
            @click="clearFilters"
            color="white"
            variant="outlined"
            elevation="3"
            >Reset</v-btn
          >
          <v-btn
            :disabled="searchText.length == 0"
            style="height: 56px"
            @click="emit('search')"
            color="primary"
            elevation="3"
            >Search</v-btn
          >
        </div>
      </template>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { ref, type Ref, defineExpose } from 'vue';
import {
  cardColors,
  cardTypes,
  cardRarities,
  cardFormats,
} from '@/utils/mtgCommon';
import { useSearchStore } from '~/stores/searchStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
  searchText: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['search']);

const searchStore = useSearchStore();

// Get filters from the pinia store
const { filters } = storeToRefs(searchStore);

const panel = ref([]); // open or close this panel

// Dropdown options
const cardFormatStatuses = ['banned', 'restricted', 'legal'];
const colorFiltersOptions = [
  'Match Exactly',
  'Contains At Least',
  'Contains At Most',
];
const statOptions = [
  'Equal To',
  'Less Than',
  'Less Than Or Equal To',
  'Greater Than',
  'Greater Than Or Equal To',
  'Not Equal To',
];

// Watch for changes in selectedCardFormats and add a new entry if all are filled
watch(
  filters.value.selectedCardFormats,
  (newVal) => {
    const allFilled = newVal.every(
      (entry) => entry.format !== null && entry.status !== null,
    );
    if (allFilled) {
      filters.value.selectedCardFormats.push({ format: null, status: null });
    }
  },
  { deep: true },
);

function closePanel() {
  panel.value = [];
}

function clearFilters() {
  // Reset all filters to their default values
  filters.value.selectedCardTypes = [];
  filters.value.selectedColorFilterOption = 'Contains At Most';
  filters.value.selectedColors = {
    Red: true,
    Blue: true,
    Green: true,
    White: true,
    Black: true,
  };
  filters.value.selectedRarities = {
    Common: false,
    Uncommon: false,
    Rare: false,
    Mythic: false,
  };
  filters.value.selectedCMCOption = 'Equal To';
  filters.value.selectedPowerOption = 'Equal To';
  filters.value.selectedToughnessOption = 'Equal To';
  filters.value.selectedCMC = '';
  filters.value.selectedPower = '';
  filters.value.selectedToughness = '';
  filters.value.selectedCardFormats = [{ format: null, status: null }];
}

// Expose the method to the parent
defineExpose({
  closePanel,
});
</script>

<style lang="sass" scoped></style>
