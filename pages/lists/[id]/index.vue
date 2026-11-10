<script setup lang="ts">
defineOptions({ name: 'SavedDeckPage' });
const route = useRoute();
</script>
<template>
  <DeckEditor
    :key="String(route.params.id)"
    :list-id="String(route.params.id)"
  />
</template>
