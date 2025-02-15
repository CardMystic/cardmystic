<template>
  <v-expansion-panels v-model="panel">
  <v-expansion-panel
  value="1"
    title="Filters"
    color="white"
  >
  <template #text>
    <p style="margin-bottom: 8px;">Click <v-icon style="position: relative; top: -1px">mdi-plus-box</v-icon> to add the Filter</p>

    <!-- Type Filter -->
    <v-row class="mt-0">
      <v-col class="py-0">
        <v-select
          label="Type"
          :items="cardTypes"
          v-model="selectedCardType"
        ></v-select>
      </v-col>
      <v-col cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter('types', selectedCardType)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>

    <!-- Color Filter -->
    <v-row>
      <v-col class="py-0">
        <v-select
          label="Color"
          :items="cardColors"
          v-model="selectedCardColor"
        ></v-select>
      </v-col>
      <v-col cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter('colors', selectedCardColor)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>

    <!-- Color Filter -->
    <v-row>
      <v-col class="py-0">
        <v-select
          label="Rarity"
          :items="cardRarities"
          v-model="selectedCardRarity"
        ></v-select>
      </v-col>
      <v-col cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter('rarities', selectedCardRarity)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>

    <!-- CMC Filter -->
    <v-row>
      <v-col class="py-0">
        <v-text-field label="Converted Mana Cost" v-model="selectedCMC"></v-text-field>
      </v-col>
      <v-col cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter('manaCosts', selectedCMC)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>

    <!-- Power Filter -->
    <v-row>
      <v-col class="py-0">
        <v-text-field label="Power" v-model="selectedPower" type="number"></v-text-field>
      </v-col>
      <v-col cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter('powers', selectedPower)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>


    <!-- Toughness Filter -->
    <v-row>
      <v-col class="py-0">
        <v-text-field label="Toughness" v-model="selectedToughness" type="number"></v-text-field>
      </v-col>
      <v-col cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter('toughnesses', selectedToughness)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>


    <!-- Legality Filter -->
    <v-row>
      <v-col class="py-0">
        <v-select label="Format" :items="cardFormats" v-model="selectedCardFormat"></v-select>
      </v-col>
      <v-col class="py-0">
        <v-select label="Legality" :items="cardFormatStatuses" v-model="selectedCardFormatStatus"></v-select>
      </v-col>
      <v-col class="py-0" cols="1" style="display: flex; align-items: center; justify-content: center;">
        <v-icon @click="addFilter(selectedCardFormat, selectedCardFormatStatus)" size="30" style="position: relative; top: -12px">
          mdi-plus-box
        </v-icon>
      </v-col>
    </v-row>

  </template>
  </v-expansion-panel>
</v-expansion-panels>
</template>

<script setup lang="ts">
import { ref, type Ref, defineExpose } from 'vue';
import { type IFilter } from '@/types/IVectorBackend';
import { cardColors, cardTypes, cardRarities, cardFormats } from '@/utils/mtgCommon';

const emit = defineEmits<{
  (event: 'newFilter', newFilter: IFilter): void;
}>();

const panel = ref([]);

const selectedCardType = ref()
const selectedCardColor = ref()
const selectedCardRarity = ref()
const selectedCardFormat = ref()

const selectedCardFormatStatus = ref()
const cardFormatStatuses = [
  "banned",
  "restricted",
  "legal"
]

const selectedCMC = ref('')
function addFilter(type: string, value: string) {
  const newFilter = {
    'type': type,
    'value': value,
  };

  if(type == 'manaCosts') {
    selectedCMC.value = ''
  } else if(type == 'powers') {
    selectedPower.value = ''
  } else if(type == 'toughnesses') {
    selectedToughness.value = ''
  } else if(type == 'types') {
    selectedCardType.value = null
  } else if(type == 'colors') {
    selectedCardColor.value = null
  } else if(type == 'rarities') {
    selectedCardRarity.value = null
  } else if(type == 'legalities') {
    selectedCardFormat.value = null
    selectedCardFormatStatus.value = null
  }
  console.log('emitting', newFilter)

  emit('newFilter', newFilter);
}

const selectedPower = ref('')
const selectedToughness = ref('')

function closePanel() {
  panel.value = []
}

// Expose the method to the parent
defineExpose({
  closePanel
});

</script>

<style lang="sass" scoped>
</style>