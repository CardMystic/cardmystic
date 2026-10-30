<script setup lang="ts">
defineOptions({ name: 'EditorLayout' });
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <navbar />
    <main class="flex-1 w-full min-w-0 px-1 sm:px-6 lg:px-8">
      <NavigationBreadcrumbs />
      <slot />
    </main>
    <Footer />
  </div>
</template>
