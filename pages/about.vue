<template>
  <navbar></navbar>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-6" max-width="600" elevation="10" rounded="xl">
      <v-card-title class="text-h5 font-weight-bold">
        About CardMystic
      </v-card-title>

      <v-card-text class="mt-2 text-body-1">
        CardMystic is an open-source Magic: The Gathering search engine powered
        by AI and vector search. It lets you find cards using natural language
        and smart filters.
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
useHead({ title: 'About - CardMystic' });
</script>
