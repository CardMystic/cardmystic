<template>
  <div v-if="cardCount > 0">
    <span class="text-sm font-medium whitespace-nowrap mr-2"
      >{{ cardCount }} cards in Mainboard</span
    >
    <UButton
      icon="i-heroicons-shopping-cart"
      color="success"
      variant="solid"
      size="xs"
      :label="`Buy ($${totalPrice.toFixed(2)})`"
      class="cursor-pointer"
      @click="emit('buy')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cardCount: number;
  totalPrice: number;
}>();

const emit = defineEmits<{
  buy: [];
}>();
</script>

<style scoped lang="scss"></style>
