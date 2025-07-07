<template>
  <div class="basic-search-container">


    <!-- Search bar and filters -->
    <div class="search-section" :style="{ maxWidth: maxWidth }">
      <div class="d-flex align-center">
        <!-- Autocomplete for Similar Search -->
        <v-autocomplete v-if="chipSelectedIndex === 1" v-model="searchStore.query" :items="autocompleteItems"
          :loading="loading" :search="autocompleteSearch" @update:search="onAutocompleteSearch"
          @update:modelValue="onAutocompleteSelection" @blur="onAutocompleteBlur" label="Search for a card..."
          variant="solo" elevation="5" @keyup.enter="handleSearch" prepend-inner-icon="mdi-magnify" class="flex-grow-1"
          no-filter :clearable="!!searchStore.query" :no-data-text="getNoDataText()" auto-select-first
          :menu-props="{ maxHeight: '200px' }"></v-autocomplete>

        <!-- Regular text field for other search types -->
        <v-text-field v-else v-model="searchStore.query" label="Search..." variant="solo" elevation="5"
          @keyup.enter="handleSearch" :loading="loading" prepend-inner-icon="mdi-magnify" class="flex-grow-1"
          :clearable="!!searchStore.query"></v-text-field>

        <v-btn @click="toggleFilters" color="primary" variant="elevated" icon="mdi-filter" class="ml-2 filters-btn"
          size="default"></v-btn>
      </div>

      <div v-if="showFilters" class="mt-2">
        <filters ref="filterRef" :search-text="searchStore.query" @search="handleSearch" @close="toggleFilters">
        </filters>
      </div>

      <!-- Active Filter Chips -->
      <FilterChips class="mt-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';

const props = defineProps({
  maxWidth: {
    type: String,
    default: '705px',
  },
});

</script>

<style lang="sass" scoped>
.basic-search-container
  width: 100%
  display: flex
  flex-direction: column
  align-items: center

.search-header
  display: flex
  justify-content: space-between
  align-items: center
  width: 100%
  max-width: 1096px
  margin-bottom: 20px

  @media (max-width: 768px)
    flex-direction: column
    gap: 12px
    align-items: center

.chip-selector
  position: relative

.search-section
  width: 100%

.filters-btn
  width: 40px
  height: 56px
  border-radius: 4px
  margin-left: 12px
  margin-bottom: 24px

:deep(.v-autocomplete .v-field__append-inner)
  display: none !important

:deep(.v-autocomplete .v-input__append)
  display: none !important
</style>
