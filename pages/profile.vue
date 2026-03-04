<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'fullscreen'
})

</script>

<template>
  <SpaceBackground class="flex justify-center">
    <Profile />
  </SpaceBackground>
</template>
