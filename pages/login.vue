<template>
  <div class="login-hero min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
    @mousemove="handleMouseMove" @mousedown="handleMouseDown" @mouseup="handleMouseUp">
    <div class="hero-bg"></div>
    <div v-for="dot in dots" :key="dot.id" class="mouse-dot"
      :style="{ left: dot.x + 'px', top: dot.y + 'px', opacity: dot.opacity, width: dot.size + 'px', height: dot.size + 'px' }">
    </div>
    <div class="w-full max-w-md mx-auto z-10">
      <Login />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'home',
  middleware: (to) => {
    // Redirect if already logged in
    const { userProfile } = useUserProfile()
    if (userProfile.value?.id) {
      return navigateTo('/profile')
    }
  }
})

useHead({
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow' // Don't index login pages
    }
  ]
})

useSeoMeta({
  title: () => 'Login - CardMystic',
  description: () => 'Sign in to your CardMystic account to access your saved card lists, search history, and personalized Magic: The Gathering card search experience.',
  ogTitle: () => 'Login - CardMystic',
  ogDescription: () => 'Sign in to your CardMystic account to access your saved card lists, search history, and personalized Magic: The Gathering card search experience.',
  ogType: 'website',
  ogImage: () => 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'CardMystic - Magic: The Gathering card search',
  twitterCard: 'summary',
  twitterTitle: () => 'Login - CardMystic',
  twitterDescription: () => 'Sign in to your CardMystic account to access your saved card lists and personalized MTG search.',
  twitterImage: () => 'https://cardmystic.io/cardmystic_cards.png'
})

import { ref } from 'vue';

// Mouse trail effect (copied from index.vue)
interface Dot {
  id: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
}

const dots = ref<Dot[]>([]);
let dotId = 0;
let lastDotTime = 0;
const isDragging = ref(false);

const handleMouseDown = () => {
  isDragging.value = true;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseMove = (e: MouseEvent) => {
  const now = Date.now();
  // When dragging, create dots more frequently (30ms), otherwise 120ms
  const threshold = isDragging.value ? 30 : 120;
  if (now - lastDotTime < threshold) return;
  lastDotTime = now;

  // Add random offset between -30 and 30 pixels for scatter effect
  const randomOffsetX = (Math.random() - 0.5) * 60;
  const randomOffsetY = (Math.random() - 0.5) * 60;

  // Random size between 4 and 10 pixels
  const randomSize = 6 + Math.random() * 6;

  const newDot: Dot = {
    id: dotId++,
    x: e.clientX + randomOffsetX,
    y: e.clientY + randomOffsetY,
    opacity: 0.5,
    size: randomSize
  };

  dots.value.push(newDot);

  // Remove after animation completes (CSS handles the animation)
  setTimeout(() => {
    dots.value = dots.value.filter(d => d.id !== newDot.id);
  }, 600);

  // When dragging, allow more dots (10), otherwise limit to 3
  const maxDots = isDragging.value ? 10 : 3;
  if (dots.value.length > maxDots) {
    dots.value = dots.value.slice(-maxDots);
  }
};

const { userProfile } = useUserProfile()
</script>

<style lang="sass" scoped>
.login-hero
  position: relative
  min-height: 100vh
  background-color: black
  overflow: hidden

.hero-bg
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  background-image: url('/space.webp')
  background-position: center
  background-attachment: fixed
  opacity: 0.25
  z-index: 0

.mouse-dot
  position: fixed
  width: 8px
  height: 8px
  background-color: white
  pointer-events: none
  z-index: 5
  transform: translate(-50%, -50%)
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8)
  clip-path: polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)
  animation: starFall 0.6s ease-out forwards

@keyframes starFall
  0%
    opacity: 0.5
    transform: translate(-50%, -50%)
  100%
    opacity: 0
    transform: translate(-50%, calc(-50% + 3px))
</style>
