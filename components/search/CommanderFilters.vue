<template>
  <div>
    <!-- Selected colors chips or No Filters chip -->
    <div v-if="modelValue?.selectedColors && modelValue.selectedColors.length > 0" class="mb-2 flex flex-wrap gap-2">
      <UButton class="cursor-pointer rounded-pill" size="sm" color="neutral" variant="outline" icon="i-lucide-circle-x"
        @click="clearColors">
        <span class="flex items-center gap-1">
          <ManaIcon v-for="color in modelValue.selectedColors" :key="color" :type="cardColorToSymbol(color)"
            size="16" />
          {{ getColorIdentityName(modelValue.selectedColors) }}
        </span>
      </UButton>
    </div>
    <div v-else class="mb-2">
      <UButton class="cursor-default rounded-pill" size="sm" color="neutral" variant="outline" disabled>
        No Filters Selected
      </UButton>
    </div>

    <!-- Colors selector -->
    <div class="accordion-item">
      <div class="color-checkboxes">
        <!-- 2 cols (3 rows) on xs, 3 cols (2 rows) on sm, 6 cols on md+ -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 w-full">
          <UCheckbox v-for="item in cardColors" :key="(item as { value: CardColorType }).value"
            :name="`color-${(item as { value: CardColorType }).value}`"
            :model-value="selectedColors.includes((item as { value: CardColorType }).value)"
            @update:model-value="(value) => onToggle((item as { value: CardColorType }).value, value === true)"
            variant="card" class="w-full">
            <template #label>
              <span class="flex items-center gap-1">
                <ManaIcon :type="cardColorToSymbol((item as { value: CardColorType }).value)" class="mr-1" />
                {{ (item as { value: CardColorType }).value }}
              </span>
            </template>
          </UCheckbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ManaIcon from '~/components/ManaIcon.vue';
import { CardColor, cardColorToSymbol, type CardColorType } from '~/models/cardModel';
import type { CheckboxGroupItem } from '@nuxt/ui';
import type { CardSearchFilters } from '~/models/searchModel';
import { getColorIdentityName } from '~/utils/colorPairings';

const { modelValue } = defineProps<{ modelValue?: CardSearchFilters }>();
const emit = defineEmits(['update:modelValue']);

// Map card colors to CheckboxGroup items
const cardColors = CardColor.options.map(color => ({
  label: color,
  value: color
})) as CheckboxGroupItem[];

// Handle color checkbox toggles
function onToggle(val: CardColorType, checked: boolean) {
  const next = new Set(selectedColors.value);
  if (checked) next.add(val);
  else next.delete(val);
  // Triggers setter (and the Colorless validation)
  selectedColors.value = Array.from(next);
}

// Selected colors with Colorless validation
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

function clearColors() {
  const newValue = { ...(modelValue ?? {}), selectedColors: undefined };
  emit('update:modelValue', newValue);
}

function updateFilters(updates: Partial<CardSearchFilters>) {
  const current = modelValue || {} as CardSearchFilters;
  const newValue = { ...current, ...updates };
  emit('update:modelValue', newValue);
}

</script>

<style scoped>
.accordion-item {
  margin-bottom: 8px;
}

.color-checkboxes {
  margin-top: 8px;
  width: 100%;
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
