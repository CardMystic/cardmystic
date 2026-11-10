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
import stars from '~/assets/images/stars.svg?no-inline';

const starLayers = [
  { size: 1, image: `url("${stars}#stars-1")`, opacity: 0.35, duration: 90 },
  { size: 2, image: `url("${stars}#stars-2")`, opacity: 0.55, duration: 60 },
  { size: 3, image: `url("${stars}#stars-3")`, opacity: 0.8, duration: 35 },
  { size: 4, image: `url("${stars}#stars-4")`, opacity: 0.9, duration: 22.5 },
];

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
</style>
