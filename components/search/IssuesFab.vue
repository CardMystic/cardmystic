<template>
  <UTooltip text="Report an issue with these results">
    <template #activator="{ open }">
      <UButton icon="i-mdi-alert-circle-outline" color="surface-variant" class="fixed-fab" size="xl" circle
        @click="onClick && onClick()" @mouseenter="open" @focus="open" />
    </template>
  </UTooltip>
</template>

<script lang="ts" setup>
const props = defineProps<{
  onClick?: () => void
}>();
const onClick = props.onClick;
</script>

<style lang="sass" scoped>
.fixed-fab
  position: fixed
  bottom: 32px
  right: 32px
  z-index: 100
</style>