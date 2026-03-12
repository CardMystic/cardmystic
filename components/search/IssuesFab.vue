<template>
  <div class="fixed-fab">
    <UTooltip :content="{
      side: 'left',
      sideOffset: 8
    }" text="Report an issue with these results">
      <UButton icon="i-lucide-circle-alert" color="neutral" size="xl" variant="soft" class="border-2 border-secondary"
        @click="onClick && onClick()" />
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
  bottom: 58px
  right: 8px
  z-index: 99
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
</style>