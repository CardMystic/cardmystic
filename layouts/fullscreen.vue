<template>
  <div class="layout-container">
    <navbar :is-fixed="true" />
    <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
/* Fullscreen layout: full-width content, fixed navbar that overlays the page.
 * Use for the landing page where content (e.g. hero sections) extends
 * edge-to-edge and scrolls behind the navbar. */
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
