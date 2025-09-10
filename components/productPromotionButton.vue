<template>
  <a v-if="showButton" :href="marketplaceLink" target="_blank" rel="noopener noreferrer" class="product-promotion-btn">
    <div class="product-promotion-btn-content">
      <img :src="marketplaceImage" alt="Marketplace" class="product-promotion-btn-img" />
      <span class="product-promotion-btn-text">{{ marketplaceText }}</span>
    </div>
  </a>
</template>

<script setup lang="ts">
const props = defineProps({
  marketplaceLink: { type: String, required: true },
  marketplaceImage: { type: String, required: true },
  marketplaceText: { type: String, required: true }
});
const showButton = props.marketplaceLink && props.marketplaceImage && props.marketplaceText;
</script>

<style scoped>
.product-promotion-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid #a37aff;
  border-radius: 16px;
  background: #fff;
  box-shadow: none;
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  max-width: 180px;
  min-width: 180px;
  min-height: 120px;
  max-height: 120px;
  width: 100%;
}

.product-promotion-btn:hover,
.product-promotion-btn:focus-visible {
  border-color: #7f53ac;
  box-shadow: 0 0 0 2px #a37aff33;
}

.product-promotion-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 14px 8px 14px;
}

.product-promotion-btn-img {
  width: 96px !important;
  max-height: 80px;
  object-fit: contain;
  border-radius: 12px;
  background: #fff;
  margin-bottom: 4px;
}

.product-promotion-btn-text {
  font-size: 0.72rem;
  font-weight: 400;
  color: #111;
  text-align: center;
  margin-top: 0;
  letter-spacing: 0.1px;
  max-width: 160px;
  line-height: 1.2;
  word-break: break-word;
}

@media (max-width: 600px) {
  .product-promotion-btn {
    max-width: 110px;
  }

  .product-promotion-btn-content {
    padding: 6px 6px 4px 6px;
  }

  .product-promotion-btn-img {
    height: 60px;
    width: 60px;
  }

  .product-promotion-btn-text {
    font-size: 0.62rem;
    max-width: 90px;
  }
}
</style>
