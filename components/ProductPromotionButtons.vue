<template>
  <div class="product-promotion-btns-row">
    <!-- Show skeletons while loading -->
    <template v-if="loading">
      <div v-for="i in skeletonCount" :key="`promo-skel-${i}`" class="mx-2">
        <USkeleton class="product-promotion-skeleton-item" />
      </div>
    </template>
    <!-- Render real buttons after load -->
    <template v-else>
      <productPromotionButton v-for="(btn, idx) in buttons" :key="idx" :marketplace-link="btn.link"
        :marketplace-image="btn.image" :marketplace-text="btn.text" class="mx-2" />
    </template>
  </div>
</template>

<script setup lang="ts">
import productPromotionButton from '~/components/ProductPromotionButton.vue';
import { ref, onMounted } from 'vue';

type PromotionButton = { link: string; image: string; text: string };
const loading = ref(true);
const skeletonCount = 3; // number of skeleton placeholders to show while loading
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
  } finally {
    loading.value = false;
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

/* Skeleton sizing to match .product-promotion-btn */
.product-promotion-skeleton-item {
  display: block;
  max-width: 180px;
  min-width: 180px;
  min-height: 120px;
  max-height: 120px;
  width: 100%;
  border-radius: 16px;
}

@media (max-width: 600px) {
  .product-promotion-skeleton-item {
    max-width: 110px;
    min-width: 110px;
    min-height: 90px;
    max-height: 90px;
  }
}
</style>
