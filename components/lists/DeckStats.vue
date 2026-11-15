<template>
  <div v-if="cardCount > 0">
    <span class="text-sm font-medium whitespace-nowrap mr-2"
      >{{ cardCount }} cards in Mainboard</span
    >
    <UButton
      v-bind="cardActionStyles.buy"
      variant="solid"
      size="xs"
      :label="`Buy ($${totalPrice.toFixed(2)})`"
      class="cursor-pointer"
      @click="emit('buy')"
    />
  </div>
</template>

<script setup lang="ts">
import { cardActionStyles } from '~/utils/card-actions';
defineProps<{
  cardCount: number;
  totalPrice: number;
}>();

const emit = defineEmits<{
  buy: [];
}>();
</script>

<style scoped lang="scss"></style>
