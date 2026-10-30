<script setup lang="ts">
defineOptions({ name: 'SetsCollectionPage' });
const route = useRoute();
definePageMeta({ key: (route) => route.path, title: 'MTG Sets' });
</script>

<template>
  <CardCollectionPage kind="sets" :slug="String(route.params.slug)" />
</template>
