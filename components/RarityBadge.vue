<template>
  <div v-if="rarity" class="rarity-badge" :class="[sizeClass, rarityClass]">
    <span class="rarity-text">{{ formatRarity(rarity) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  rarity: {
    type: String,
    required: true,
  },
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'medium',
  },
});

const sizeClass = computed(() => `rarity-badge-${props.size}`);
const rarityClass = computed(() => `rarity-${props.rarity.toLowerCase()}`);

function formatRarity(rarity: string): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
</script>

<style scoped>
.rarity-badge {
  font-weight: 500;
  margin: 0;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  display: inline-block;
}

.rarity-text {
  letter-spacing: 0.5px;
  font-family: 'Arial', sans-serif;
}

/* Size variants */
.rarity-badge-small {
  padding: 2px 6px;
  font-size: 0.75rem;
  border-radius: 6px;
}

.rarity-badge-medium {
  padding: 2px 8px;
  font-size: 0.9rem;
  border-radius: 8px;
}

.rarity-badge-large {
  padding: 4px 12px;
  font-size: 1rem;
  border-radius: 10px;
}

/* Rarity-based colors and effects */
.rarity-common {
  background: linear-gradient(135deg, #2c2c2c, #1a1a1a);
  border-color: rgba(255, 255, 255, 0.2);
}

.rarity-uncommon {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  border-color: rgba(192, 192, 192, 0.4);
}

.rarity-rare {
  background: linear-gradient(135deg, #ffd700, #ffb000);
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.rarity-mythic {
  background: linear-gradient(135deg, #ff8c00, #ff6b35, #ff4500);
  border-color: rgba(255, 140, 0, 0.6);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.5);
}

/* Size-specific animations for rare */
.rarity-badge-small.rarity-rare {
  animation: rarePulseSmall 2s ease-in-out infinite alternate;
}

@keyframes rarePulseSmall {
  0% {
    transform: scale(1);
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.3);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
  }
}

/* Size-specific animations for mythic */
.rarity-badge-small.rarity-mythic {
  animation: mythicPulseSmall 1.5s ease-in-out infinite alternate;
}

.rarity-badge-large.rarity-mythic {
  animation: mythicPulseLarge 1.5s ease-in-out infinite alternate;
}

@keyframes mythicPulseSmall {
  0% {
    transform: scale(1);
    box-shadow:
      0 0 8px rgba(255, 140, 0, 0.5),
      0 0 12px rgba(255, 107, 53, 0.3);
  }
  100% {
    transform: scale(1.1);
    box-shadow:
      0 0 12px rgba(255, 140, 0, 0.8),
      0 0 18px rgba(255, 107, 53, 0.5);
  }
}

@keyframes mythicPulseLarge {
  0% {
    transform: scale(1);
    box-shadow:
      0 0 18px rgba(255, 140, 0, 0.5),
      0 0 30px rgba(255, 107, 53, 0.3);
  }
  100% {
    transform: scale(1.1);
    box-shadow:
      0 0 30px rgba(255, 140, 0, 0.8),
      0 0 50px rgba(255, 107, 53, 0.5);
  }
}
</style>
