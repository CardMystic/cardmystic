<template>
  <img v-if="visible" src="/comet_dog.webp" alt="" class="comet-dog" :style="{
    '--start-x': startX + 'vw',
    '--start-y': startY + 'vh',
    '--end-x': endX + 'vw',
    '--end-y': endY + 'vh',
    '--duration': duration + 's',
  }" @animationend="visible = false" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Chance per roll: 1 / VISITS_PER_COMET.
 * Rolls once on load, then every ROLL_INTERVAL_MS while the page is open.
 * With 60 and 60 000 ms → on average ~60 minutes (1 hour) to see him.
 */
const VISITS_PER_COMET = 60
const ROLL_INTERVAL_MS = 60_000

const visible = ref(false)
const startX = ref(0)
const startY = ref(0)
const endX = ref(0)
const endY = ref(0)
const duration = ref(6)
let rollTimer: ReturnType<typeof setInterval> | null = null

function trySpawnComet() {
  // Don't spawn while one is already on screen
  if (visible.value) return
  if (Math.random() * VISITS_PER_COMET >= 1) return

  // Pick a random edge to enter from (0=top, 1=right, 2=bottom, 3=left)
  const edge = Math.floor(Math.random() * 4)
  const rand = () => 10 + Math.random() * 80 // 10-90 range to avoid corners

  switch (edge) {
    case 0: // top
      startX.value = rand()
      startY.value = -15
      break
    case 1: // right
      startX.value = 115
      startY.value = rand()
      break
    case 2: // bottom
      startX.value = rand()
      startY.value = 115
      break
    case 3: // left
      startX.value = -15
      startY.value = rand()
      break
  }

  // End somewhere in the middle of the viewport
  endX.value = 20 + Math.random() * 60
  endY.value = 20 + Math.random() * 60

  duration.value = 12 + Math.random() * 6 // 12-18 seconds

  visible.value = true
}

onMounted(() => {
  trySpawnComet()
  rollTimer = setInterval(trySpawnComet, ROLL_INTERVAL_MS)
})

onUnmounted(() => {
  if (rollTimer) clearInterval(rollTimer)
})
</script>

<style scoped>
.comet-dog {
  position: fixed;
  z-index: 5;
  width: 120px;
  height: 120px;
  object-fit: contain;
  pointer-events: none;
  animation:
    comet-drift var(--duration) ease-out forwards,
    comet-spin var(--duration) linear forwards,
    comet-fade var(--duration) ease-in forwards;
}

@keyframes comet-drift {
  0% {
    left: var(--start-x);
    top: var(--start-y);
  }

  100% {
    left: var(--end-x);
    top: var(--end-y);
  }
}

@keyframes comet-spin {
  0% {
    transform: rotate(0deg) scale(0.6);
  }

  15% {
    transform: rotate(180deg) scale(1);
  }

  50% {
    transform: rotate(720deg) scale(0.5);
  }

  100% {
    transform: rotate(1440deg) scale(0.05);
  }
}

@keyframes comet-fade {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  60% {
    opacity: 0.9;
  }

  100% {
    opacity: 0;
  }
}
</style>
