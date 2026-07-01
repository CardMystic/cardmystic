<template>
  <span :class="iconClass" id="mana-icon" aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import 'mana-font/css/mana.min.css';

const props = defineProps<{ type: string }>();

const iconClass = computed(() => `ms ms-${props.type.toLowerCase()} ms-cost`);
</script>

<style scoped>
#mana-icon {
  margin: 0 2px 0 0;
  margin-inline-start: 0 !important;
  vertical-align: unset;
  font-size: 0.7em;
}
</style>
