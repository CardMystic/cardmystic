<script setup lang="ts">
import { deckCardGridClasses } from '~/composables/useDeckCardGrid';
defineProps<{ expanded: boolean }>();
</script>

<template>
  <div
    :class="[
      deckCardGridClasses,
      'deck-suggestion-grid min-w-0',
      { 'deck-suggestion-preview': !expanded },
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
@media (max-width: 39.999rem) {
  .deck-suggestion-preview {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: 10rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
}
</style>
