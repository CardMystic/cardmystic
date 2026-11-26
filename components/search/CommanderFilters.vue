<template>
  <!-- Selected colors chips or No Filters chip -->
  <div
    v-if="modelValue?.selectedColors && modelValue.selectedColors.length > 0"
    class="mb-2 flex flex-wrap gap-2"
  >
    <UButton
      class="cursor-pointer rounded-pill"
      size="sm"
      color="neutral"
      variant="outline"
      icon="i-lucide-circle-x"
      @click="clearColors"
    >
      <span class="flex items-center gap-1">
        <ManaColorIcon
          v-for="color in modelValue.selectedColors"
          :key="color"
          :type="cardColorToSymbol(color)"
          size="16"
        />
        {{ getColorIdentityName(modelValue.selectedColors) }}
      </span>
    </UButton>
  </div>
  <div v-else class="mb-2 flex">
    <UButton
      class="cursor-default rounded-pill"
      size="sm"
      color="neutral"
      variant="outline"
      disabled
    >
      No Filters Selected
    </UButton>
  </div>

  <ColorFilterControls
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import ManaColorIcon from '~/components/general/ManaColorIcon.vue';
import { cardColorToSymbol } from '~/utils/cardHelpers';
import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';
import { getColorIdentityName } from '~/utils/colorPairings';

const { modelValue } = defineProps<{ modelValue?: CardSearchFilters }>();
const emit = defineEmits(['update:modelValue']);

function clearColors() {
  const newValue = { ...(modelValue ?? {}), selectedColors: undefined };
  emit('update:modelValue', newValue);
}
</script>
