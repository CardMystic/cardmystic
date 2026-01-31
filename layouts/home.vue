<template>
  <div class="layout-container">
    <!-- <navbar :is-fixed="true" /> -->
    <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="sass">
.layout-container
  min-height: 100vh
  display: flex
  flex-direction: column

.main-content
  flex: 1

.responsive-align
  align-items: flex-start
</style>
