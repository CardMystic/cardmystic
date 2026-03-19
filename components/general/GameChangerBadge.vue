<template>
  <UTooltip text="Is a Commander Game Changer">
    <div class="gc-corner">
      <span class="gc-text">GC</span>
    </div>
  </UTooltip>
</template>

<script setup lang="ts">
</script>

<style scoped>
.gc-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 2.2em;
  height: 2.2em;
  overflow: hidden;
  z-index: 10;
  pointer-events: auto;
  cursor: default;
  font-size: inherit;
  border-radius: 8px 0 0 0;
}

.gc-corner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #7c3aed;
  clip-path: polygon(0 0, 100% 0, 0 100%);
  border-radius: 8px 0 0 0;
}

.gc-text {
  position: absolute;
  top: 0.7em;
  left: 0.35em;
  color: white;
  font-weight: 800;
  font-size: 0.6em;
  line-height: 1;
  transform: rotate(-45deg);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
