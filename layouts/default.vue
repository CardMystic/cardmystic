<template>
  <div class="layout-container">
    <navbar />
    <main class="main-content">
      <UContainer class="flex responsive-align" style="padding-top: 0px">
        <slot />
      </UContainer>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
/* Default layout: constrained content width via UContainer, static navbar.
 * Use for standard pages like search results, card details, lists, etc. */
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
