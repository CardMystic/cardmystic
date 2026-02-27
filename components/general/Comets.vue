<template>
  <div class="comet-container">
    <div v-for="c in comets" :key="c.id" class="comet" :style="{
      '--start-x': c.startX,
      '--start-y': c.startY,
      '--end-x': c.endX,
      '--end-y': c.endY,
      '--tail-angle': c.tailAngle,
      '--comet-size': size + 'px',
      '--comet-speed': speed + 's',
      '--comet-tail': tailLength + 'px',
      '--comet-color': color,
      '--comet-glow': glowColor,
    }" @animationend="removeComet(c.id)" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Comet configuration — all props with sensible defaults
// ---------------------------------------------------------------------------
const {
  interval = 1,
  size = 4,
  speed = 2,
  tailLength = 100,
  color = '#fff',
  glowColor = 'rgba(168, 85, 247, 0.8)',
} = defineProps<{
  /** seconds between comets (average) */
  interval?: number
  /** px — diameter of the comet head */
  size?: number
  /** seconds — how long the streak takes */
  speed?: number
  /** px — length of the trailing tail */
  tailLength?: number
  /** color of the comet head & tail */
  color?: string
  /** purple glow color */
  glowColor?: string
}>()

// ---------------------------------------------------------------------------
// Comet — spawns roughly every COMET_INTERVAL s from a random point,
// streaks in a random direction, then disappears.
// ---------------------------------------------------------------------------
interface Comet {
  id: number
  startX: string
  startY: string
  endX: string
  endY: string
  tailAngle: string
}

const comets = ref<Comet[]>([])
let cometId = 0
let cometTimer: ReturnType<typeof setTimeout> | null = null

function spawnComet() {
  const angle = Math.random() * Math.PI * 2
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  // Compute the tail angle in actual pixel-space so it matches the visual
  // direction of travel (vw and vh have different pixel sizes).
  const aspect = window.innerWidth / window.innerHeight
  const pixelDx = cosA          // vw component
  const pixelDy = sinA / aspect // vh→vw correction
  const tailAngle = (Math.atan2(pixelDy, pixelDx) * 180) / Math.PI

  // Pick a random point roughly in the centre of the viewport
  const midX = 20 + Math.random() * 60 // vw  (avoid extreme edges)
  const midY = 20 + Math.random() * 60 // vh

  // Walk backward / forward along the angle until BOTH x and y are off-screen.
  // Off-screen means x < -10 or x > 110, AND y < -10 or y > 110 (generous buffer).
  function distToOffScreen(dirSign: number): number {
    let t = 0
    // Increase t until the point is outside the viewport in at least one axis
    // with a solid buffer so the comet is fully invisible.
    // We need the point to be outside [-10, 110] in BOTH vw and vh or just
    // one axis — but to be safe we keep going until at least one axis is well past.
    const step = 5
    while (t < 300) {
      t += step
      const px = midX + cosA * dirSign * t
      const py = midY + sinA * dirSign * t
      if (px < -15 || px > 115 || py < -15 || py > 115) return t
    }
    return t
  }

  const backDist = distToOffScreen(-1) + 10
  const fwdDist = distToOffScreen(1) + 10

  const startX = midX - cosA * backDist
  const startY = midY - sinA * backDist
  const endX = midX + cosA * fwdDist
  const endY = midY + sinA * fwdDist

  comets.value.push({
    id: ++cometId,
    startX: `${startX}vw`,
    startY: `${startY}vh`,
    endX: `${endX}vw`,
    endY: `${endY}vh`,
    tailAngle: `${tailAngle}deg`,
  })
}

function removeComet(id: number) {
  comets.value = comets.value.filter(c => c.id !== id)
}

function scheduleComet() {
  const base = interval * 1000
  const delay = base * 0.8 + Math.random() * base * 0.4
  cometTimer = setTimeout(() => {
    spawnComet()
    scheduleComet()
  }, delay)
}

onMounted(() => {
  scheduleComet()
})

onUnmounted(() => {
  if (cometTimer) clearTimeout(cometTimer)
})
</script>

<style lang="sass" scoped>
// ------ Comet container ------
.comet-container
  position: absolute
  inset: 0
  pointer-events: none
  overflow: visible
  z-index: 5

// ------ Comet (JS-spawned, random direction) ------
.comet
  position: absolute
  left: var(--start-x)
  top: var(--start-y)
  width: var(--comet-size)
  height: var(--comet-size)
  background: var(--comet-color)
  border-radius: 50%
  pointer-events: none
  opacity: 0.9
  filter: drop-shadow(0 0 8px var(--comet-glow)) drop-shadow(0 0 16px var(--comet-glow))
  animation: comet-streak var(--comet-speed) linear forwards
  // Tail — rotated to trail behind direction of travel
  &::after
    content: ''
    position: absolute
    top: 50%
    right: 100%
    width: var(--comet-tail)
    height: 2px
    transform: translateY(-50%) rotate(0deg)
    transform-origin: right center
    background: linear-gradient(to left, var(--comet-color), var(--comet-glow) 30%, transparent)
    border-radius: 2px

@keyframes comet-streak
  0%
    opacity: 0
    transform: translate(0, 0) rotate(var(--tail-angle))
  5%
    opacity: 0.95
  85%
    opacity: 0.95
  100%
    opacity: 0
    transform: translate(calc(var(--end-x) - var(--start-x)), calc(var(--end-y) - var(--start-y))) rotate(var(--tail-angle))
</style>
