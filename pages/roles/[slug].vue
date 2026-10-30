<script setup lang="ts">
defineOptions({ name: 'RolesCollectionPage' });
const route = useRoute();
definePageMeta({ key: (route) => route.path, title: 'MTG Roles' });
</script>

<template>
  <CardCollectionPage kind="roles" :slug="String(route.params.slug)" />
</template>
