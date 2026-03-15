<template>
  <div v-if="cardCount > 0" class="deck-stats-bar border-2 border-secondary rounded-lg bg-elevated">
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
</script>

<style scoped lang="scss">
.deck-stats-bar {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
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
