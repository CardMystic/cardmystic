<template>
  <div v-if="showBadge" class="gc-badge" :class="sizeClass">
    <span class="gc-text">GC</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  gameChanger: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<'small' | 'large'>,
    default: 'large',
  },
});

const showBadge = computed(() => props.gameChanger);
const sizeClass = computed(() => `gc-badge-${props.size}`);
</script>

<style scoped>
.gc-badge {
  position: absolute;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: white;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
  z-index: 10;
  animation: gcPulse 3s ease-in-out infinite alternate;
  overflow: visible;
}

.gc-text {
  letter-spacing: 1px;
  font-family: 'Arial Black', sans-serif;
}

/* Size variants */
.gc-badge-small {
  top: -8px;
  left: -20px;
  border-radius: 4px;
  padding: 10px 18px 2px 18px;
  font-size: 11px;
  border-width: 1px;
}

.gc-badge-large {
  top: -2px;
  left: -2px;
  border-radius: 8px;
  padding: 4px 4px;
  font-size: 14px;
}

@keyframes gcPulse {
  0% {
    transform: rotate(-45deg) scale(1);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
  }
  100% {
    transform: rotate(-45deg) scale(1.05);
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.6);
  }
}
</style>
