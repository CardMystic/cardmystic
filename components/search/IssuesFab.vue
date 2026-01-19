<template>
  <div class="fixed-fab">
    <UTooltip :content="{
      side: 'left',
      sideOffset: 8
    }" text="Report an issue with these results">
      <UButton icon="i-lucide-circle-alert" color="neutral" size="xl" variant="soft" @click="onClick && onClick()" />
    </UTooltip>
  </div>
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

  border-radius: 9999px
  isolation: isolate

  transition: transform 0.3s ease

  &::before
    content: ""
    position: absolute
    inset: 0
    border-radius: inherit
    z-index: -1
    transition: box-shadow 0.3s ease

  &:hover
    transform: translateY(-2px)

  &:hover::before
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(147, 114, 255, 0.4)

  @media (max-width: 768px)
    bottom: 20px
    right: 20px
    scale: 0.9

  @media (max-height: 600px)
    bottom: 80px
</style>