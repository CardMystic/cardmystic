<template>
  <!-- SEO Title and Description -->
  <h1 class="text-2xl sm:text-3xl font-bold text-center mt-4">
    {{ seoEntry ? seoEntry.title : fallbackTitle }}
  </h1>
  <p class="text-gray-400 text-center mb-4 max-w-2xl">
    {{ seoEntry ? seoEntry.description : fallbackDescription }}
  </p>
</template>

<script lang="ts" setup>
const props = defineProps({
  seoEntry: {
    // Uses SEO entry text if available, otherwise fallback to fallbackTitle and fallbackDescription
    type: Object,
    required: false,
  },
  fallbackTitle: {
    type: String,
    required: false,
  },
  fallbackDescription: {
    type: String,
    required: false,
  },
});
</script>

<style></style>
