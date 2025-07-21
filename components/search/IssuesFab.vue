<template>
  <v-tooltip text="Report an issue with these results">
    <template v-slot:activator="{ props }">
      <v-fab v-bind="props" color="surface-variant" icon="mdi-alert-circle-outline" class="fixed-fab"></v-fab>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.fixed-fab
  position: fixed
  bottom: 32px
  right: 32px
  z-index: 100
</style>