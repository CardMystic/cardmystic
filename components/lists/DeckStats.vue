<template>
  <div v-if="cardCount > 0" class="deck-stats-bar border-2 border-secondary rounded-lg bg-elevated"
    :style="{ bottom: bottomOffset + 'px' }">
    <span class="text-sm font-medium whitespace-nowrap">{{ cardCount }} cards</span>
    <span class="text-muted">|</span>
    <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid" size="xs"
      :label="`Buy ($${totalPrice.toFixed(2)})`" class="cursor-pointer" @click="emit('buy')" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cardCount: number
  totalPrice: number
}>()

const emit = defineEmits<{
  buy: []
}>()

const bottomOffset = ref(12)
const minBottom = 12
const footerGap = 12

function updatePosition() {
  const footer = document.querySelector('footer')
  if (!footer) {
    bottomOffset.value = minBottom
    return
  }

  const footerRect = footer.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  if (footerRect.top < viewportHeight) {
    bottomOffset.value = viewportHeight - footerRect.top + footerGap
  } else {
    bottomOffset.value = minBottom
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })
    updatePosition()
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', updatePosition)
    window.removeEventListener('resize', updatePosition)
  }
})
</script>

<style scoped lang="scss">
.deck-stats-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  transition: bottom 0.15s ease;
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  min-width: 218px;
}
</style>
