<template>
  <div class="min-h-screen flex flex-col bg-zinc-900">
    <UiHeader />
    <main class="flex-1">
      <slot />
    </main>
    <UiFooter />
  </div>
</template>

<script setup lang="ts">
import UiHeader from "@/components/ui/Header.vue";
import UiFooter from "@/components/ui/Footer.vue";
</script>
