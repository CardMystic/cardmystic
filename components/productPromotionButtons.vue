<template>
  <div class="product-promotion-btns-row">
    <productPromotionButton v-for="(btn, idx) in buttons" :key="idx" :marketplace-link="btn.link"
      :marketplace-image="btn.image" :marketplace-text="btn.text" class="mx-2" />
  </div>
</template>

<script setup lang="ts">
import productPromotionButton from './ProductPromotionButton.vue';
import { ref, onMounted } from 'vue';

type PromotionButton = { link: string; image: string; text: string };
const buttons = ref<PromotionButton[]>([]);

onMounted(async () => {
  try {
    const res = await fetch('/config.json');
    const data = await res.json();
    if (Array.isArray(data.marketplaceButtons)) {
      buttons.value = data.marketplaceButtons.filter(
        (btn: any) => btn && btn.link && btn.image && btn.text
      );
    }
  } catch (e) {
    console.error('Failed to load marketplace buttons config:', e);
    buttons.value = [];
  }
});
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
    flex-direction: column;
    align-items: center;
  }
}
</style>
