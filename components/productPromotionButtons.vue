<template>
  <div class="product-promotion-btns-row">
    <productPromotionButton v-for="(btn, idx) in buttons" :key="idx" :marketplace-link="btn.link"
      :marketplace-image="btn.image" :marketplace-text="btn.text" class="mx-2" />
  </div>
</template>

<script setup lang="ts">
import productPromotionButton from './productPromotionButton.vue';
import { computed } from 'vue';

// Read from env: VITE_MARKETPLACE_BUTTONS as JSON string
const raw = import.meta.env.VITE_MARKETPLACE_BUTTONS || '[]';
let parsed: any[] = [];
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = [];
}
const buttons = computed(() =>
  parsed.filter(
    btn => btn && btn.link && btn.image && btn.text
  )
);
</script>

<style scoped>
.product-promotion-btns-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 18px;
  width: 100%;
}

@media (max-width: 600px) {
  .product-promotion-btns-row {
    gap: 8px;
  }
}
</style>
