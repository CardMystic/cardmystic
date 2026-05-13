<template>
  <span :class="iconClass" id="mana-icon" aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

const props = defineProps<{ type: string }>();

const iconClass = computed(() => `ms ms-${props.type.toLowerCase()} ms-cost`);

// Lazy-load the ~67 kB `mana-font` stylesheet only when a `ManaIcon` first
// mounts. Mana symbols are rare on initial paint (filters start collapsed and
// the homepage hero has no mana cost), so deferring the CSS until it is
// actually needed keeps it off the critical path. Vite extracts the dynamic
// import into its own CSS chunk that loads asynchronously without blocking
// rendering.
onMounted(() => {
  if (import.meta.client) {
    void import('mana-font/css/mana.min.css');
  }
});
</script>

<style scoped>
#mana-icon {
  margin: 0 2px 0 0;
  margin-inline-start: 0 !important;
  vertical-align: unset;
  font-size: 0.7em;
}
</style>
