<template>
  <div class="basic-search-container">
    <ChipSelector
      class="chip-selector mb-4"
      :options="chipSelectorOptions"
      :tooltips="chipSelectorTooltips"
      :selected-index="chipSelectedIndex"
      @update:selectedIndex="chipSelectedIndex = $event"
    />

    <!-- Search bar and filters -->
    <div class="search-section" :style="{ maxWidth: maxWidth }">
      <div class="d-flex align-center">
        <v-text-field
          v-if="chipSelectedIndex !== 2"
          v-model="searchStore.query"
          label="Search..."
          variant="solo"
          elevation="5"
          @keyup.enter="handleSearch"
          :loading="searching"
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
        ></v-text-field>

        <v-file-input
          v-else
          v-model="uploadedFile"
          label="Upload an image"
          accept="image/*"
          variant="solo"
          prepend-icon="mdi-camera"
          class="flex-grow-1"
        />

        <v-btn
          @click="toggleFilters"
          color="primary"
          variant="elevated"
          icon="mdi-filter"
          class="ml-2 mb-6 filters-btn"
          size="default"
        ></v-btn>
      </div>

      <div v-if="showFilters" class="mt-0">
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
import { ref, watch } from 'vue';
import { useSearchStore } from '~/stores/searchStore';

const props = defineProps({
  maxWidth: {
    type: String,
    default: '705px',
  },
  isHomePage: {
    type: Boolean,
    default: false,
  },
  searching: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['search', 'update:chipSelectedIndex']);

const router = useRouter();
const searchStore = useSearchStore();

// Chip Selector component
const chipSelectorOptions = searchStore.endpoints.map((e: any) => e.name);
const chipSelectorTooltips = searchStore.endpoints.map((e: any) => e.tooltip);
const chipSelectedIndex = ref(0);

// File upload
const uploadedFile = ref<File | null>(null);

// Filters
const filterRef: any = ref(null);
const showFilters = ref(false);

watch(uploadedFile, (file) => {
  if (file) {
    searchStore.imageFile = file;
    searchStore.query = '';
    handleSearch();
  }
});

watch(chipSelectedIndex, (newValue) => {
  emit('update:chipSelectedIndex', newValue);
});

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

function handleSearch() {
  filterRef.value?.closePanel();
  showFilters.value = false; // Hide filters when searching
  emit('search', chipSelectedIndex.value);
}

// Expose methods that parent components might need
defineExpose({
  setChipIndex: (index: number) => {
    chipSelectedIndex.value = index;
  },
});
</script>

<style lang="sass" scoped>
.basic-search-container
  width: 100%
  display: flex
  flex-direction: column
  align-items: center

.chip-selector
  position: relative
  margin-bottom: 20px

.search-section
  width: 100%

.filters-btn
  width: 40px
  height: 48px
  border-radius: 4px
  margin-left: 12px

.filters-btn.mb-6
  height: 56px
</style>
