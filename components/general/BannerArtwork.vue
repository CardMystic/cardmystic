<script setup lang="ts">
defineProps<{ src: string }>();
</script>

<template>
  <div class="pointer-events-none absolute inset-0" aria-hidden="true">
    <img :src="src" alt="" class="banner-backdrop" />
    <img
      :src="src"
      alt=""
      :draggable="false"
      decoding="async"
      fetchpriority="high"
      class="banner-art"
    />
    <div class="banner-shade" />
  </div>
</template>

<style scoped>
.banner-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
  filter: blur(32px) brightness(0.5);
  transform: scale(1.1);
}
.banner-art {
  position: absolute;
  inset: 0 0 0 auto;
  width: min(88%, 44rem);
  height: 100%;
  object-fit: cover;
  object-position: center top;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 45%);
  mask-image: linear-gradient(to right, transparent, #000 45%);
}
.banner-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgb(17 24 39 / 95%),
    rgb(17 24 39 / 55%) 55%,
    transparent
  );
}
@media (min-width: 768px) {
  .banner-art {
    width: min(62%, 44rem);
  }
  .banner-shade {
    background: linear-gradient(to top, rgb(17 24 39 / 55%), transparent 80%);
  }
}
</style>
