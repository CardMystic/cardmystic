<template>
  <div
    ref="hero"
    class="particle-hero min-h-screen w-full relative overflow-hidden"
    :class="full ? '' : 'flex items-center justify-center px-4 py-12'"
  >
    <div
      v-for="layer in starLayers"
      :key="layer.size"
      class="stars"
      aria-hidden="true"
      :style="{
        backgroundImage: layer.image,
        opacity: layer.opacity,
        animationDuration: `${layer.duration}s`,
        animationPlayState: isAnimating ? 'running' : 'paused',
      }"
    />
    <div
      :class="
        full ? 'relative z-10 w-full h-full' : 'w-full max-w-md mx-auto z-10'
      "
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ full?: boolean }>(), { full: false });

// Repeat a small, deterministic texture instead of painting thousands of
// box shadows. Density and drift speeds match the original 3840 × 2000 field.
const TILE_WIDTH = 960;
const TILE_HEIGHT = 1000;
function starTexture(count: number, size: number, seed: number): string {
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const stars: string[] = [];
  for (let i = 0; i < count; i++) {
    // Keep the small halos inside the tile so its edges stay seamless.
    const x = Math.round(8 + random() * (TILE_WIDTH - 16));
    const y = Math.round(8 + random() * (TILE_HEIGHT - 16));
    if (size >= 3) {
      stars.push(
        `<circle cx="${x}" cy="${y}" r="${size + 2}" fill="url(#glow)"/>`,
      );
    }
    stars.push(`<circle cx="${x}" cy="${y}" r="${size / 2}" fill="white"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_WIDTH}" height="${TILE_HEIGHT}" viewBox="0 0 ${TILE_WIDTH} ${TILE_HEIGHT}"><defs><radialGradient id="glow"><stop stop-color="#a855f7" stop-opacity=".6"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient></defs>${stars.join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const starLayers = [
  { count: 300, size: 1, seed: 42, opacity: 0.35, duration: 90 },
  { count: 150, size: 2, seed: 137, opacity: 0.55, duration: 60 },
  { count: 18, size: 3, seed: 256, opacity: 0.8, duration: 35 },
  { count: 8, size: 4, seed: 389, opacity: 0.9, duration: 22.5 },
].map((layer) => ({
  ...layer,
  image: starTexture(layer.count, layer.size, layer.seed),
}));

const hero = ref<HTMLElement | null>(null);
const isAnimating = ref(true);
let inView = true;
let observer: IntersectionObserver | undefined;
function updateAnimation() {
  isAnimating.value = inView && !document.hidden;
}
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateAnimation();
  });
  if (hero.value) observer.observe(hero.value);
  document.addEventListener('visibilitychange', updateAnimation);
  updateAnimation();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  document.removeEventListener('visibilitychange', updateAnimation);
});
</script>

<style lang="sass" scoped>
.particle-hero
  background: #000

.stars
  position: absolute
  inset: 0 0 -1000px
  pointer-events: none
  background-repeat: repeat
  background-size: 960px 1000px
  animation: drift linear infinite

@keyframes drift
  from
    transform: translateY(0)
  to
    transform: translateY(-1000px)

@media (prefers-reduced-motion: reduce)
  .stars
    animation: none
</style>
