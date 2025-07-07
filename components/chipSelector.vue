<template>
  <div class="chip-group">
    <div v-for="(option, index) in options" :key="option" class="chip-container">
      <v-chip :color="selectedIndex === index ? 'primary' : 'default'"
        :variant="selectedIndex === index ? 'elevated' : 'outlined'" class="chip" @click="select(index)"
        :disabled="option === 'Image' || option === 'Keyword'">
        {{ option }}
        <v-icon size="18" class="ml-2" @click.stop="toggleTooltip(index)">
          mdi-help-circle
        </v-icon>
      </v-chip>
      <p class="ma-0 pa-0" v-if="option == 'Image' || option == 'Keyword'" style="font-size: 11px">
        Coming Soon!
      </p>
      <client-only>
        <v-tooltip v-model="tooltipOpen[index]" location="top" activator="parent">
          <span>{{ tooltips[index] }}</span>
        </v-tooltip>
      </client-only>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  options: string[];
  tooltips: string[];
  selectedIndex: number;
}>();

const emit = defineEmits<{
  (e: 'update:selectedIndex', index: number): void;
}>();

function select(index: number) {
  emit('update:selectedIndex', index);
}

const tooltipOpen = ref<boolean[]>(props.options.map(() => false));

function toggleTooltip(index: number) {
  showTooltipWithTimeout(index);
}

function showTooltipWithTimeout(index: number, duration = 2000) {
  tooltipOpen.value = tooltipOpen.value.map((_, i) => i === index);

  setTimeout(() => {
    tooltipOpen.value[index] = false;
  }, duration);
}
</script>

<style scoped>
.chip-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.chip-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chip {
  cursor: pointer;
}
</style>
