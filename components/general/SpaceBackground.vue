<template>
  <div class="particle-hero min-h-screen w-full relative overflow-hidden"
    :class="full ? '' : 'flex items-center justify-center px-4 py-12'">
    <canvas ref="canvasRef" class="particle-canvas"></canvas>
    <div :class="full ? 'relative z-10 w-full h-full' : 'w-full max-w-md mx-auto z-10'">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  full?: boolean
}>(), { full: false })

// Particle Configuration
const PARTICLE_COLOR = '#ffffff'         // fill colour (any CSS colour)
const PARTICLE_GLOW_COLOR = 'rgba(168, 85, 247, 0.6)' // shadow/glow colour
const PARTICLE_DENSITY = 2000            // lower = more particles (px² per particle)
const PARTICLE_MOVE_CHANCE = 0.55        // 0-1, fraction of particles that move
const PARTICLE_MIN_SIZE = 1              // minimum size in px
const PARTICLE_MAX_SIZE = 3.5            // maximum size in px
const PARTICLE_MIN_OPACITY = 0.15        // minimum opacity (0-1)
const PARTICLE_MAX_OPACITY = 0.5         // maximum opacity (0-1)
const PARTICLE_MIN_SPEED = 0.05          // minimum drift speed (px/frame)
const PARTICLE_MAX_SPEED = 0.17          // maximum drift speed (px/frame)
const PARTICLE_GLOW_MULTIPLIER = 2       // glow size = particle size × this
const PARTICLE_DIRECTION: 'up' | 'down' = 'up' as 'up' | 'down' // drift direction
const PARTICLE_SHAPE: 'square' | 'circle' = 'circle' as 'square' | 'circle' // shape of each particle

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  moves: boolean
  speed: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let particles: Particle[] = []
let animId = 0

function createParticles(w: number, h: number): Particle[] {
  const count = Math.floor((w * h) / PARTICLE_DENSITY)
  const arr: Particle[] = []
  for (let i = 0; i < count; i++) {
    const moves = Math.random() < PARTICLE_MOVE_CHANCE
    arr.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: PARTICLE_MIN_SIZE + Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE),
      opacity: PARTICLE_MIN_OPACITY + Math.random() * (PARTICLE_MAX_OPACITY - PARTICLE_MIN_OPACITY),
      moves,
      speed: moves ? PARTICLE_MIN_SPEED + Math.random() * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) : 0,
    })
  }
  return arr
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    particles = createParticles(canvas.offsetWidth, canvas.offsetHeight)
  }

  resize()
  window.addEventListener('resize', resize)

  const draw = () => {
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    ctx.clearRect(0, 0, w, h)

    for (const p of particles) {
      if (p.moves) {
        if (PARTICLE_DIRECTION === 'up') {
          p.y -= p.speed
          if (p.y < -p.size) { p.y = h + p.size; p.x = Math.random() * w }
        } else {
          p.y += p.speed
          if (p.y > h + p.size) { p.y = -p.size; p.x = Math.random() * w }
        }
      }

      ctx.globalAlpha = p.opacity
      ctx.shadowColor = PARTICLE_GLOW_COLOR
      ctx.shadowBlur = p.size * PARTICLE_GLOW_MULTIPLIER
      ctx.fillStyle = PARTICLE_COLOR

      if (PARTICLE_SHAPE === 'circle') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
    }

    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    animId = requestAnimationFrame(draw)
  }

  draw()

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style lang="sass" scoped>
.particle-hero
  position: relative
  min-height: 100vh
  background: #000000
  overflow: hidden

.particle-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  z-index: 0
  pointer-events: none
</style>
