<template>
  <navbar></navbar>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-6" max-width="600" elevation="10" rounded="xl">
      <v-card-title class="text-h5 font-weight-bold"> Contact Us </v-card-title>

      <v-card-text class="mt-2 text-body-1">
        Have questions, feedback, or ideas for CardMystic? We'd love to hear
        from you!
        <br /><br />
        💬 Discord:
        <a href="https://discord.gg/GmPZ3e7tZH" target="_blank"
          >Join our server</a
        >
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
useHead({ title: 'Contact - CardMystic' });
</script>
