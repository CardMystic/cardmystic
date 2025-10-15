<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <VueQueryDevtools v-if="isDev" />
  </UApp>
</template>

<style lang="sass">

</style>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
const isDev = import.meta.env.VITE_IS_DEV === "true";
</script>
