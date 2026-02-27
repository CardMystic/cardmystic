<template>
  <div class="particle-hero min-h-screen w-full relative overflow-hidden"
    :class="full ? '' : 'flex items-center justify-center px-4 py-12'">
    <div class="stars stars-small" :style="{ '--star-shadow': smallShadow }" />
    <div class="stars stars-medium" :style="{ '--star-shadow': mediumShadow }" />
    <div class="stars stars-large" :style="{ '--star-shadow': largeShadow }" />
    <div class="stars stars-xlarge" :style="{ '--star-shadow': xlargeShadow }" />
    <Comets :interval="30" />
    <div :class="full ? 'relative z-10 w-full h-full' : 'w-full max-w-md mx-auto z-10'">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">

withDefaults(defineProps<{
  full?: boolean
}>(), { full: false })

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const FIELD_WIDTH = 3840
const FIELD_HEIGHT = 2000
const SMALL_COUNT = 1500
const MEDIUM_COUNT = 500
const LARGE_COUNT = 67
const XLARGE_COUNT = 20
const STAR_COLOR = '#fff'

// ---------------------------------------------------------------------------
// Seeded PRNG — identical output on server and client for clean hydration.
// ---------------------------------------------------------------------------
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// ---------------------------------------------------------------------------
// Build box-shadow strings. X spans FIELD_WIDTH to cover ultra-wide screens,
// Y spans FIELD_HEIGHT which matches the vertical animation tile.
// ---------------------------------------------------------------------------
function generateShadows(count: number, seed: number): string {
  const rand = seededRandom(seed)
  const shadows: string[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * FIELD_WIDTH)
    const y = Math.round(rand() * FIELD_HEIGHT)
    shadows.push(`${x}px ${y}px ${STAR_COLOR}`)
  }
  return shadows.join(',')
}

// Four layers with different seeds so positions don't overlap
const smallShadow = generateShadows(SMALL_COUNT, 42)
const mediumShadow = generateShadows(MEDIUM_COUNT, 137)
const largeShadow = generateShadows(LARGE_COUNT, 256)
const xlargeShadow = generateShadows(XLARGE_COUNT, 389)

</script>

<style lang="sass" scoped>
.particle-hero
  position: relative
  min-height: 100vh
  background: #000000
  overflow: hidden

// Shared star layer styles
.stars
  position: absolute
  top: 0
  left: 0
  background: transparent
  box-shadow: var(--star-shadow)
  pointer-events: none
  border-radius: 50%
  &::after
    content: ''
    position: absolute
    top: 2000px
    background: transparent
    box-shadow: var(--star-shadow)
    border-radius: 50%

// ------ Small stars (1 px, slow drift) ------
.stars-small
  width: 1px
  height: 1px
  opacity: 0.35
  animation: drift 180s linear infinite
  &::after
    width: 1px
    height: 1px

// ------ Medium stars (2 px, moderate drift) ------
.stars-medium
  width: 2px
  height: 2px
  opacity: 0.55
  animation: drift 120s linear infinite
  &::after
    width: 2px
    height: 2px

// ------ Large stars (3 px, faster drift, purple glow) ------
.stars-large
  width: 3px
  height: 3px
  opacity: 0.8
  animation: drift 70s linear infinite
  filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.6))
  &::after
    width: 3px
    height: 3px

// ------ X-Large stars (4 px, fastest drift, strong purple glow) ------
.stars-xlarge
  width: 4px
  height: 4px
  opacity: 0.9
  animation: drift 45s linear infinite
  filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 16px rgba(168, 85, 247, 0.4))
  &::after
    width: 4px
    height: 4px

@keyframes drift
  from
    transform: translateY(0)
  to
    transform: translateY(-2000px)

</style>
