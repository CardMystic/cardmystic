<template>
  <div v-if="activeFilterChips.length > 0" class="filter-chips-container">
    <v-chip
      v-for="chip in activeFilterChips"
      :key="chip.key"
      closable
      @click:close="clearFilter(chip.key)"
      size="small"
      color="primary"
      variant="elevated"
      class="mr-2 mb-2 filter-chip"
    >
      {{ chip.label }}
    </v-chip>
    <v-btn
      v-if="activeFilterChips.length > 1"
      @click="clearAllFilters"
      size="small"
      variant="text"
      color="white"
      class="clear-all-btn"
    >
      Clear All
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSearchStore } from '~/stores/searchStore';

const searchStore = useSearchStore();

const activeFilterChips = computed(() => {
  const chips = [];
  const f = searchStore.filters;

  // Card Types
  if (f.selectedCardTypes.length > 0) {
    chips.push({
      key: 'cardTypes',
      label: `Types: ${f.selectedCardTypes.join(', ')}`,
    });
  }

  // Color Filter
  const excludedColors = Object.entries(f.selectedColors)
    .filter(([_, selected]) => !selected)
    .map(([color, _]) => color);

  const includedColors = Object.entries(f.selectedColors)
    .filter(([_, selected]) => selected)
    .map(([color, _]) => color);

  if (
    excludedColors.length > 0 ||
    includedColors.length < 5 ||
    f.selectedColorFilterOption !== 'Contains At Most'
  ) {
    let colorLabel = '';

    if (f.selectedColorFilterOption === 'Contains At Most') {
      if (excludedColors.length > 0) {
        colorLabel = `Excluded: ${excludedColors.join(', ')}`;
      }
    } else if (f.selectedColorFilterOption === 'Match Exactly') {
      colorLabel = `Matches: ${includedColors.join(', ')}`;
    } else if (f.selectedColorFilterOption === 'Contains At Least') {
      colorLabel = `Included: ${includedColors.join(', ')}`;
    }

    if (colorLabel) {
      chips.push({
        key: 'colors',
        label: `Colors: ${colorLabel}`,
      });
    }
  }

  // Rarities
  const selectedRarities = Object.entries(f.selectedRarities)
    .filter(([_, selected]) => selected)
    .map(([rarity, _]) => rarity);

  if (selectedRarities.length > 0) {
    chips.push({
      key: 'rarities',
      label: `Rarities: ${selectedRarities.join(', ')}`,
    });
  }

  // CMC
  if (f.selectedCMC !== '' || f.selectedCMCOption !== 'Equal To') {
    chips.push({
      key: 'cmc',
      label: `CMC: ${f.selectedCMCOption} ${f.selectedCMC || '?'}`,
    });
  }

  // Power
  if (f.selectedPower !== '' || f.selectedPowerOption !== 'Equal To') {
    chips.push({
      key: 'power',
      label: `Power: ${f.selectedPowerOption} ${f.selectedPower || '?'}`,
    });
  }

  // Toughness
  if (f.selectedToughness !== '' || f.selectedToughnessOption !== 'Equal To') {
    chips.push({
      key: 'toughness',
      label: `Toughness: ${f.selectedToughnessOption} ${f.selectedToughness || '?'}`,
    });
  }

  // Card Formats
  const activeFormats = f.selectedCardFormats.filter(
    (format) => format.format !== null && format.status !== null,
  );

  if (activeFormats.length > 0) {
    activeFormats.forEach((format, index) => {
      chips.push({
        key: `format-${index}`,
        label: `${format.format}: ${format.status}`,
      });
    });
  }

  return chips;
});

function clearFilter(filterKey: string) {
  const f = searchStore.filters;

  switch (filterKey) {
    case 'cardTypes':
      f.selectedCardTypes = [];
      break;
    case 'colors':
      f.selectedColorFilterOption = 'Contains At Most';
      f.selectedColors = {
        Red: true,
        Blue: true,
        Green: true,
        White: true,
        Black: true,
      };
      break;
    case 'rarities':
      f.selectedRarities = {
        Common: false,
        Uncommon: false,
        Rare: false,
        Mythic: false,
      };
      break;
    case 'cmc':
      f.selectedCMC = '';
      f.selectedCMCOption = 'Equal To';
      break;
    case 'power':
      f.selectedPower = '';
      f.selectedPowerOption = 'Equal To';
      break;
    case 'toughness':
      f.selectedToughness = '';
      f.selectedToughnessOption = 'Equal To';
      break;
    default:
      // Handle format filters
      if (filterKey.startsWith('format-')) {
        const index = parseInt(filterKey.split('-')[1]);
        if (f.selectedCardFormats[index]) {
          f.selectedCardFormats[index] = { format: null, status: null };
        }
      }
      break;
  }
}

function clearAllFilters() {
  searchStore.clearFilters();
}
</script>

<style scoped>
.filter-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.filter-chip {
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-all-btn {
  text-transform: none;
  font-weight: 500;
  transition: color 0.3s;
}

.clear-all-btn:hover {
  color: rgb(var(--v-theme-primary));
}
</style>
