<template>
  <UTooltip :content="{
    side: 'left',
    sideOffset: 8
  }" text="Report an issue with these results">
    <UButton icon="i-lucide-circle-alert" color="neutral" class="fixed-fab" size="xl" variant="soft"
      @click="onClick && onClick()" />
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
  bottom: 24px
  right: 24px
  z-index: 9999
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(147, 114, 255, 0.3)
  transition: all 0.3s ease
  
  &:hover
    transform: translateY(-2px)
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(147, 114, 255, 0.4)

  // Ensure the button is always accessible on mobile
  @media (max-width: 768px)
    bottom: 20px
    right: 20px
    scale: 0.9

  // Add some breathing room from the footer
  @media (max-height: 600px)
    bottom: 80px
</style>