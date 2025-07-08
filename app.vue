<template>
  <div>
    <v-app>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-app>
    <VueQueryDevtools />
  </div>
</template>

<style lang="sass">
// Override Vuetify's default v-main padding
.v-main
  padding-top: 64px !important
</style>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>
