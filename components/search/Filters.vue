<template>
  <div class="filters-container">
    <!-- Active Filters Chips or a No Filters Selected chip -->
    <div class="active-filters-section mb-2">
      <div v-if="hasActiveFilters" class="active-filters-chips">
        <!-- Card Types Chips -->
        <div v-for="cardType in selectedCardTypes || []" :key="`type-${cardType}`">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="removeCardType(cardType)">{{ cardType }}
          </UButton>
        </div>

        <!-- Colors: single identity chip -->
        <div v-if="(selectedColors || []).length > 0">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="clearColorChip">
            <span class="flex items-center gap-1">
              <ManaIcon v-for="color in selectedColors" :key="color" :type="cardColorToSymbol(color)" class="mr-1" />
              {{ getColorIdentityName(selectedColors) }}
            </span>
          </UButton>
        </div>

        <!-- Rarities Chips -->
        <div v-for="rarity in selectedRarities || []" :key="`rarity-${rarity}`">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="removeRarity(rarity)">{{ rarity }}
          </UButton>
        </div>

        <!-- Stats Chips -->
        <div v-if="selectedCMC">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="clearCMC()">CMC {{ selectedCMCOption || 'Equal To' }} {{
              selectedCMC }}
          </UButton>
        </div>

        <div v-if="selectedPower">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="clearPower()">Power {{ selectedPowerOption || 'Equal To' }} {{
              selectedPower }}
          </UButton>
        </div>

        <div v-if="selectedToughness">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="clearToughness()">Toughness {{ selectedToughnessOption || 'Equal To' }} {{
              selectedToughness }}
          </UButton>
        </div>

        <!-- Color Filter Option Chip -->
        <div v-if="selectedColorFilterOption && selectedColorFilterOption !== 'Contains At Least'">
          <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
            icon="i-lucide-circle-x" @click="clearColorFilterOption()">Color: {{ selectedColorFilterOption }}
          </UButton>
        </div>

        <!-- Formats Chips -->
        <template v-for="(formatItem, index) in selectedCardFormats || []" :key="`format-${index}`">
          <div v-if="formatItem.format || formatItem.status">
            <UButton class="cursor-pointer ma-1 rounded-pill" size="sm" color="neutral" variant="outline"
              icon="i-lucide-circle-x" @click="removeFormat(index)">{{ formatItem.format || 'Any' }} - {{
                formatItem.status || 'Any Status' }}
            </UButton>
          </div>
        </template>

        <!-- Clear All Button -->
        <UButton color="error" size="sm" class="ma-1 rounded-pill" @click="clearAllFilters" icon="i-lucide-circle-x">
          Clear Filters
        </UButton>
      </div>
      <div v-else class="active-filters-chips">
        <UButton class="cursor-default ma-1 rounded-pill" size="sm" color="neutral" variant="outline" disabled>
          No Filters Selected
        </UButton>
      </div>
    </div>

    <UCollapsible v-model:open="isOpen" class="flex flex-col gap-2">
      <UButton class="filters-toggle-btn cursor-pointer" label="Select Filters" color="primary" variant="subtle"
        trailing-icon="i-lucide-chevron-down" icon="i-lucide-list-filter" :ui="{
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
        }" block />

      <!-- Filters Content -->
      <template #content class="filters-content">
        <UAccordion type="multiple" :unmount-on-hide="false" :items="items">
          <!-- Types Filter -->
          <template #types>
            <div class="accordion-item">
              <USelectMenu v-model="selectedCardTypes" :items="cardTypes" placeholder="Select card types" multiple
                class="w-full" />
            </div>
          </template>
          <!-- Colors Filter -->
          <template #colors>
            <div class="accordion-item">
              <div class="flex gap-2">
                <USelect v-model="selectedColorFilterOption" :items="colorFilterOptions"
                  placeholder="Select How To Match Colors" class="w-full" />

                <UButton v-if="selectedColorFilterOption" icon="i-lucide-x" color="neutral" variant="ghost"
                  @click="clearColorFilterOption()" size="sm" class="flex-shrink-0" aria-label="Clear color filter">
                </UButton>
              </div>

              <!-- Warning if no color filter option is selected -->
              <div v-if="!selectedColorFilterOption" class="mt-2 text-yellow-500 text-xs">
                Please Select How To Match Colors before using Color Checkboxes
              </div>

              <!-- Disable checkboxes when a filter option is selected -->
              <div class="color-checkboxes flex flex-wrap">
                <UCheckboxGroup :disabled="!selectedColorFilterOption" :items="cardColors" :orientation="orientation"
                  variant="card" v-model="selectedColors" class="w-full flex flex-wrap">
                  <template #label="{ item }">
                    <ManaIcon :type="cardColorToSymbol((item as { value: CardColorType }).value)" class="mr-1" />
                    <!-- Typescript gets confused with the CheckboxGroupItem type so we have to help it out a bit -->
                    {{ (item as { value: string }).value }}
                  </template>
                </UCheckboxGroup>
              </div>
            </div>
          </template>
          <!-- Rarities Filter -->
          <template #rarities>
            <div class="accordion-item flex flex-wrap">
              <UCheckboxGroup :items="cardRarities" :orientation="orientation" variant="card"
                v-model="selectedRarities" />
            </div>
          </template>
          <!-- Stats Filter -->
          <template #stats>
            <div class="accordion-item">
              <div class="stats-grid">
                <div class="stat-group">
                  <label class="stat-label">Mana Cost</label>
                  <USelect placeholder="Mana Cost Comparison" v-model="selectedCMCOption"
                    :items="comparisonOperators" />
                  <UInput v-model="selectedCMC" placeholder="Any value, e.g. '3'" type="number" />
                </div>
                <div class="stat-group">
                  <label class="stat-label">Power</label>
                  <USelect placeholder="Power Comparison" v-model="selectedPowerOption" :items="comparisonOperators" />
                  <UInput v-model="selectedPower" placeholder="Any value, e.g. '2'" type="number" />
                </div>
                <div class="stat-group">
                  <label class="stat-label">Toughness</label>
                  <USelect placeholder="Toughness Comparison" v-model="selectedToughnessOption"
                    :items="comparisonOperators" />
                  <UInput v-model="selectedToughness" placeholder="Any value, e.g. '2'" type="number" />
                </div>
              </div>
            </div>
          </template>
          <!-- Formats Filter -->
          <template #formats>
            <div class="accordion-item">
              <div v-if="selectedCardFormats && selectedCardFormats.length > 0">
                <div v-for="(format, i) in selectedCardFormats" :key="i" class="mb-3" style="display: flex; gap: 8px;">
                  <USelect class="min-w-[160px]" v-model="format.format" :items="cardFormats" label="Format"
                    clearable />
                  <USelect class="min-w-[160px]" v-model="format.status" :items="cardFormatStatuses" label="Status"
                    clearable />
                </div>
              </div>
              <UButton @click="addFormatRow" color="primary" size="sm" icon="i-lucide-plus">
                Add Format
              </UButton>
            </div>
          </template>
        </UAccordion>
      </template>
    </UCollapsible>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { z } from 'zod';
import { CardType, CardColor, CardRarity, CardFormat, CardFormatStatus, cardColorToSymbol } from '~/models/cardModel';
import type { CardSearchFilters } from '~/models/searchModel';
import ManaIcon from '../ManaIcon.vue';
import type { AccordionItem, CheckboxGroupItem, CheckboxGroupValue } from '@nuxt/ui';
import { getColorIdentityName } from '~/utils/colorPairings';

type CardColorType = z.infer<typeof CardColor>;
type CardRarityType = z.infer<typeof CardRarity>;

const screenWidth = ref(0)
const isOpen = ref(false)

function collapse() {
  isOpen.value = false;
}

defineExpose({ collapse });

onMounted(() => {
  screenWidth.value = window.innerWidth
  window.addEventListener('resize', () => {
    if (window && window.innerWidth) {
      screenWidth.value = window.innerWidth;
    }
  })
})

const orientation: Ref<'vertical' | 'horizontal'> = computed(() =>
  screenWidth.value < 768 ? 'vertical' : 'horizontal'
)

const { modelValue } = defineProps<{ modelValue?: CardSearchFilters }>();

const emit = defineEmits<{
  'update:modelValue': [value: CardSearchFilters]
}>();

const items = [
  {
    label: 'Card Types',
    icon: 'i-lucide-shapes',
    slot: 'types' as const
  },
  {
    label: 'Colors',
    icon: 'i-lucide-palette',
    slot: 'colors' as const
  },
  {
    label: 'Rarities',
    icon: 'i-lucide-star',
    slot: 'rarities' as const
  },
  {
    label: 'Stats',
    icon: 'i-lucide-calculator',
    slot: 'stats' as const
  },
  {
    label: 'Formats',
    icon: 'i-lucide-trophy',
    slot: 'formats' as const
  }
] satisfies AccordionItem[]

const cardTypes = CardType.options;
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
  const current = modelValue || {} as CardSearchFilters;
  const newValue = { ...current, ...updates };
  emit('update:modelValue', newValue);
}

// Computed property to check if there are any active filters
const hasActiveFilters = computed(() => {
  const filters = modelValue;
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
  get: () => modelValue?.selectedCardTypes,
  set: (value) => updateFilters({ selectedCardTypes: value })
});

const selectedColorFilterOption = computed({
  get: () => modelValue?.selectedColorFilterOption,
  set: (value) => {
    updateFilters({ selectedColorFilterOption: value });

    // If color filter option is cleared, clear all selected colors
    if (value === undefined && modelValue?.selectedColors && modelValue.selectedColors.length > 0) {
      updateFilters({ selectedColors: undefined });
      return;
    }

    // When changing to Match Exactly or Contains At Least, validate existing color selections
    if ((value === 'Match Exactly' || value === 'Contains At Least') && modelValue?.selectedColors) {
      const colors = [...modelValue.selectedColors];
      const hasColorless = colors.includes('Colorless');
      const hasOtherColors = colors.some(color => color !== 'Colorless');

      // If both colorless and other colors are selected, remove colorless
      if (hasColorless && hasOtherColors) {
        const updatedColors = colors.filter(color => color !== 'Colorless');
        updateFilters({ selectedColors: updatedColors });
      }
    }
  }
});

const cardColors = CardColor.options.map(color => ({
  label: color,
  value: color
})) as CheckboxGroupItem[];

const selectedColors = computed({
  get: () => modelValue?.selectedColors || [],
  set: (value) => {
    const colorOption = modelValue?.selectedColorFilterOption;

    // Only apply validation for these specific filter options
    if (colorOption === 'Match Exactly' || colorOption === 'Contains At Least') {
      const hasColorless = value.includes('Colorless');
      const hasOtherColors = value.some(color => color !== 'Colorless');

      // If we have both colorless and other colors, decide which to keep
      if (hasColorless && hasOtherColors) {
        // Get the previous selection
        const previousSelection = modelValue?.selectedColors || [];

        // Determine what changed by comparing previous and current selection
        if (!previousSelection.includes('Colorless')) {
          // Colorless was just added, remove all other colors
          value = ['Colorless'];
        } else {
          // Another color was added, remove Colorless
          value = value.filter(color => color !== 'Colorless');
        }
      }
    }

    updateFilters({ selectedColors: value });
  }
});

const cardRarities = CardRarity.options.map(rarity => ({
  label: rarity,
  value: rarity
})) as CheckboxGroupItem[];

const selectedRarities = computed({
  get: () => modelValue?.selectedRarities || [],
  set: (value) => updateFilters({ selectedRarities: value })
});

const selectedCMCOption = computed({
  get: () => modelValue?.selectedCMCOption,
  set: (value) => updateFilters({ selectedCMCOption: value })
});

const selectedPowerOption = computed({
  get: () => modelValue?.selectedPowerOption,
  set: (value) => updateFilters({ selectedPowerOption: value })
});

const selectedToughnessOption = computed({
  get: () => modelValue?.selectedToughnessOption,
  set: (value) => updateFilters({ selectedToughnessOption: value })
});

const selectedCMC = computed({
  get: () => modelValue?.selectedCMC ? Number(modelValue.selectedCMC) : undefined,
  set: (value) => updateFilters({ selectedCMC: value ? String(value) : undefined })
});

const selectedPower = computed({
  get: () => modelValue?.selectedPower ? Number(modelValue.selectedPower) : undefined,
  set: (value) => updateFilters({ selectedPower: value ? String(value) : undefined })
});

const selectedToughness = computed({
  get: () => modelValue?.selectedToughness ? Number(modelValue.selectedToughness) : undefined,
  set: (value) => updateFilters({ selectedToughness: value ? String(value) : undefined })
});

const selectedCardFormats = computed({
  get: () => modelValue?.selectedCardFormats,
  set: (value) => updateFilters({ selectedCardFormats: value })
});

function addFormatRow() {
  const currentFormats = [...(modelValue?.selectedCardFormats || [])];
  currentFormats.push({ format: undefined, status: undefined });
  updateFilters({ selectedCardFormats: currentFormats });
}

// Chip removal functions
function removeCardType(cardType: string) {
  const currentTypes = [...(modelValue?.selectedCardTypes || [])];
  const index = currentTypes.indexOf(cardType as any);
  if (index !== -1) {
    currentTypes.splice(index, 1);
    updateFilters({ selectedCardTypes: currentTypes.length > 0 ? currentTypes : undefined });
  }
}

function removeRarity(rarity: CardRarityType) {
  const currentRarities = [...(modelValue?.selectedRarities || [])];
  const index = currentRarities.indexOf(rarity);
  if (index !== -1) {
    currentRarities.splice(index, 1);
    updateFilters({ selectedRarities: currentRarities.length > 0 ? currentRarities : undefined });
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
  // Clear both color filter option and selected colors simultaneously
  updateFilters({
    selectedColorFilterOption: undefined,
    selectedColors: undefined
  });
}

function removeFormat(index: number) {
  const currentFormats = [...(modelValue?.selectedCardFormats || [])];
  currentFormats.splice(index, 1);
  updateFilters({ selectedCardFormats: currentFormats.length > 0 ? currentFormats : undefined });
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
    selectedColorFilterOption: "Contains At Least",
    selectedCardFormats: undefined
  });
}

// Clear the single color identity chip
function clearColorChip() {
  updateFilters({ selectedColors: undefined });
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

.accordion-item {
  margin-bottom: 16px;
}

.color-checkboxes {
  margin-top: 8px;
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.87);
  margin-bottom: 0;
  display: block;
}

.fade-out {
  animation: fadeOut 3s forwards;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
