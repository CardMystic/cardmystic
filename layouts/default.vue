<template>
  <div class="min-h-screen flex flex-col bg-zinc-900">
    <navbar />
    <v-main>
      <slot />
    </v-main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
</script>
