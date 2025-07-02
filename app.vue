<template>
  <div>
    <Analytics></Analytics>
    <v-app>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-app>
  </div>
</template>

<style lang="sass"></style>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
</script>
