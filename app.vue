<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <VueQueryDevtools />
  </UApp>
</template>

<style lang="sass">

</style>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>
