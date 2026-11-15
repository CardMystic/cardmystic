<script setup lang="ts">
defineOptions({ name: 'SetsDirectoryPage' });
definePageMeta({ title: 'MTG Sets', breadcrumbsInPage: true });
</script>

<template>
  <CardCollectionDirectory kind="sets" />
</template>
