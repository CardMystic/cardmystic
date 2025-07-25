<template>
  <navbar />
  <UContainer class="min-h-screen flex responsive-align" style="padding-top: 0px">
    <slot />
  </UContainer>
  <Footer />
</template>

<script setup lang="ts">
</script>

<style scoped lang="sass">
.responsive-align
  align-items: flex-start

  @media (min-width: 960px)
    align-items: center
</style>
