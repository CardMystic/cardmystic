<script setup lang="ts">
defineOptions({ name: 'ThemesCollectionPage' });
const route = useRoute();
definePageMeta({ key: (route) => route.path, title: 'MTG Themes' });
</script>

<template>
  <CardCollectionPage kind="themes" :slug="String(route.params.slug)" />
</template>
