<template>
  <div>
    <Analytics></Analytics>
    <v-app class="gradient-background">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-app>
  </div>
</template>

<style lang="sass">
// Override Vuetify's default v-main padding
.v-main
  padding-top: 64px !important
</style>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
</script>
