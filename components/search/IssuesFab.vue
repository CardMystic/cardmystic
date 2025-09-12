<template>
  <UButton icon="i-lucide-circle-alert" variant="soft" @click="onClick && onClick()" aria-label="Report an issue">
    Report Results
  </UButton>
</template>

<script lang="ts" setup>
const props = defineProps<{
  onClick?: () => void
}>();
const onClick = props.onClick;
</script>

<style lang="sass" scoped>
</style>