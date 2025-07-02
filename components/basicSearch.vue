<template>
  <div class="basic-search-container">
    <!-- Cache Indicator -->
    <CacheIndicator />

    <!-- Header with Chip Selector and Cached Searches Button -->
    <div class="search-header">
      <ChipSelector
        class="chip-selector"
        :options="chipSelectorOptions"
        :tooltips="chipSelectorTooltips"
        :selected-index="chipSelectedIndex"
        @update:selectedIndex="chipSelectedIndex = $event"
      />

      <CachedSearchesButton />
    </div>

    <!-- Search bar and filters -->
    <div class="search-section" :style="{ maxWidth: maxWidth }">
      <div class="d-flex align-center">
        <!-- Autocomplete for Similar Search -->
        <v-autocomplete
          v-if="chipSelectedIndex === 1"
          v-model="searchStore.query"
          :items="autocompleteItems"
          :loading="loading"
          :search="autocompleteSearch"
          @update:search="onAutocompleteSearch"
          @update:modelValue="onAutocompleteSelection"
          @blur="onAutocompleteBlur"
          label="Search for a card..."
          variant="solo"
          elevation="5"
          @keyup.enter="handleSearch"
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
          no-filter
          :clearable="!!searchStore.query"
          :no-data-text="getNoDataText()"
          auto-select-first
          :menu-props="{ maxHeight: '200px' }"
        ></v-autocomplete>

        <!-- Regular text field for other search types -->
        <v-text-field
          v-else
          v-model="searchStore.query"
          label="Search..."
          variant="solo"
          elevation="5"
          @keyup.enter="handleSearch"
          :loading="loading"
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
          :clearable="!!searchStore.query"
        ></v-text-field>

        <v-btn
          @click="toggleFilters"
          color="primary"
          variant="elevated"
          icon="mdi-filter"
          class="ml-2 filters-btn"
          size="default"
        ></v-btn>
      </div>

      <div v-if="showFilters" class="mt-2">
        <filters
          ref="filterRef"
          :search-text="searchStore.query"
          @search="handleSearch"
          @close="toggleFilters"
        ></filters>
      </div>

      <!-- Active Filter Chips -->
      <FilterChips class="mt-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useSearchStore } from '~/stores/searchStore';

const props = defineProps({
  maxWidth: {
    type: String,
    default: '705px',
  },
});

const emit = defineEmits(['search', 'update:chipSelectedIndex']);

const searchStore = useSearchStore();
const { loading } = storeToRefs(searchStore);

// Chip Selector component
const chipSelectorOptions = searchStore.endpoints.map((e: any) => e.name);
const chipSelectorTooltips = searchStore.endpoints.map((e: any) => e.tooltip);
// Use the store's selectedChipIndex and ensure it defaults to 0
const chipSelectedIndex = computed({
  get: () => searchStore.selectedChipIndex,
  set: (value: number) => {
    searchStore.selectedChipIndex = value;
    emit('update:chipSelectedIndex', value);
  },
});

// Ensure the store starts with AI search selected
onMounted(() => {
  if (
    searchStore.selectedChipIndex === undefined ||
    searchStore.selectedChipIndex === null
  ) {
    searchStore.selectedChipIndex = 0; // Default to AI search
  }
});

// Filters
const filterRef: any = ref(null);
const showFilters = ref(false);

// Autocomplete functionality
const autocompleteItems = ref<string[]>([]);
const autocompleteLoading = ref(false);
const autocompleteSearch = ref('');
const lastTypedValue = ref('');
let debounceTimeout: NodeJS.Timeout | null = null;

function getNoDataText() {
  if (!autocompleteSearch.value || autocompleteSearch.value.length < 2) {
    return 'Begin typing for card suggestions';
  }
  return 'No cards found';
}

// Clear autocomplete when switching away from similar search
watch(
  () => searchStore.selectedChipIndex,
  (newValue) => {
    if (newValue !== 1) {
      autocompleteItems.value = [];
      autocompleteSearch.value = '';
    }
  },
);

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

function handleSearch() {
  showFilters.value = false;
  emit('search', chipSelectedIndex.value);
}

// Debounced autocomplete search
function onAutocompleteSearch(query: string) {
  autocompleteSearch.value = query;
  lastTypedValue.value = query; // Store what user actually typed

  // Immediately update the search store with the typed value
  searchStore.query = query;

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  // Only search if query has at least 2 characters
  if (query && query.length >= 2) {
    debounceTimeout = setTimeout(async () => {
      await fetchAutocompleteResults(query);
    }, 300);
  } else {
    // Clear items but don't show loading for short queries
    autocompleteItems.value = [];
  }
}

function onAutocompleteSelection(value: string) {
  if (value && value !== lastTypedValue.value) {
    searchStore.query = value;
    // Automatically run search when user selects from autocomplete
    handleSearch();
  }
}

function onAutocompleteBlur() {
  // Since we're now updating searchStore.query immediately in onAutocompleteSearch,
  // we don't need to restore anything here. The value is already preserved.
}

async function fetchAutocompleteResults(query: string) {
  autocompleteLoading.value = true;
  try {
    const response = await fetch(
      `/api/proxy/cards/autocomplete?q=${encodeURIComponent(query)}&limit=10`,
    );
    if (response.ok) {
      const data = await response.json();
      // Extract suggestions array from the response
      autocompleteItems.value = data.suggestions || [];
    } else {
      autocompleteItems.value = [];
    }
  } catch (error) {
    console.error('Autocomplete error:', error);
    autocompleteItems.value = [];
  } finally {
    autocompleteLoading.value = false;
  }
}

// Expose methods that parent components might need
defineExpose({
  setChipIndex: (index: number) => {
    searchStore.selectedChipIndex = index;
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
