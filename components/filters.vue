<template>
  <v-expansion-panels v-model="panel">
    <v-expansion-panel value="1" title="Filters" color="white">
      <template #text>
        <!-- Type Filter -->
        <v-row class="mt-0">
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-paw</v-icon>Type</v-label
            >
          </v-col>
          <v-col class="align-center justify-content-center">
            <v-select
              :items="cardTypes"
              v-model="selectedCardType"
              :multiple="true"
              :chips="true"
            ></v-select>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Color Filter -->
        <v-row>
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-palette</v-icon>Color</v-label
            >
          </v-col>
          <v-col class="d-flex flex-row align-center justify-content-center">
            <div class="d-flex flex-row align-center justify-content-center">
              <v-checkbox
                v-for="color in cardColors"
                :key="color"
                :label="color"
                :value="color"
                v-model="selectedCardColor"
                class="mr-3"
              ></v-checkbox>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Rarity Filter -->
        <v-row>
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-cards-playing</v-icon>Rarity</v-label
            >
          </v-col>
          <v-col class="align-center justify-content-center">
            <v-select
              :items="cardRarities"
              v-model="selectedCardRarity"
            ></v-select>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- CMC Filter -->
        <v-row>
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-gold</v-icon>CMC</v-label
            >
          </v-col>
          <v-col class="align-center justify-content-center">
            <v-text-field v-model="selectedCMC" type="number"></v-text-field>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Power Filter -->
        <v-row>
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-arm-flex</v-icon>Power</v-label
            >
          </v-col>
          <v-col class="align-center justify-content-center">
            <v-text-field v-model="selectedPower" type="number"></v-text-field>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Toughness Filter -->
        <v-row>
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-wall</v-icon>Defense</v-label
            >
          </v-col>
          <v-col class="align-center justify-content-center">
            <v-text-field
              v-model="selectedToughness"
              type="number"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-divider class="my-2" color="white" opacity="1"></v-divider>

        <!-- Legality Filter -->
        <v-row>
          <v-col cols="3" class="d-flex align-center justify-content-center">
            <v-label class="mt-0 mr-4" style="font-size: 18px; color: white"
              ><v-icon class="mr-1">mdi-shield-check</v-icon>Legality</v-label
            >
          </v-col>
          <v-col class="mt-1 pb-0">
            <v-select
              label="Format"
              :items="cardFormats"
              v-model="selectedCardFormat"
            ></v-select>
          </v-col>
          <v-col class="mt-1 pb-0">
            <v-select
              label="Legality"
              :items="cardFormatStatuses"
              v-model="selectedCardFormatStatus"
            ></v-select>
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { ref, type Ref, defineExpose } from 'vue';
import { type IFilter } from '@/types/IVectorBackend';
import {
  cardColors,
  cardTypes,
  cardRarities,
  cardFormats,
} from '@/utils/mtgCommon';

const emit = defineEmits<{
  (event: 'newFilter', newFilter: IFilter): void;
}>();

const panel = ref([]);

const selectedCardType = ref();
const selectedCardColor = ref();
const selectedCardRarity = ref();
const selectedCardFormat = ref();

const selectedCardFormatStatus = ref();
const cardFormatStatuses = ['banned', 'restricted', 'legal'];

const selectedCMC = ref('');
function addFilter(type: string, value: string) {
  const newFilter = {
    type: type,
    value: value,
  };

  if (type == 'manaCosts') {
    selectedCMC.value = '';
  } else if (type == 'powers') {
    selectedPower.value = '';
  } else if (type == 'toughnesses') {
    selectedToughness.value = '';
  } else if (type == 'types') {
    selectedCardType.value = null;
  } else if (type == 'colors') {
    selectedCardColor.value = null;
  } else if (type == 'rarities') {
    selectedCardRarity.value = null;
  } else if (type == 'legalities') {
    selectedCardFormat.value = null;
    selectedCardFormatStatus.value = null;
  }
  console.log('emitting', newFilter);

  emit('newFilter', newFilter);
}

const selectedPower = ref('');
const selectedToughness = ref('');

function closePanel() {
  panel.value = [];
}

// Expose the method to the parent
defineExpose({
  closePanel,
});
</script>

<style lang="sass" scoped></style>
