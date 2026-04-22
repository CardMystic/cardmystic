<template>
  <Teleport to="body">
    <div v-if="show" class="sticky-footer-wrap">
      <div class="sticky-footer-shell" :class="shellLayoutClass">
        <div class="max-w-[1900px] flex justify-center items-center gap-8">
          <div v-if="hasLeftSlot" class="flex grow justify-end">
            <slot name="left" />
          </div>
          <div v-if="hasRightSlot" class="shrink-0">
            <slot name="right" />
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  show?: boolean;
}>(), {
  show: true,
});

const slots = useSlots();
const hasLeftSlot = computed(() => Boolean(slots.left));
const hasRightSlot = computed(() => Boolean(slots.right));
const shellLayoutClass = computed(() => {
  if (hasLeftSlot.value && hasRightSlot.value) return 'justify-between';
  if (hasLeftSlot.value) return 'justify-start';
  return 'justify-end';
});
</script>

<style scoped>
.sticky-footer-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9997;
  pointer-events: none;
  padding: 0;
}

.sticky-footer-shell {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid color-mix(in oklab, var(--ui-secondary) 52%, transparent);
  background: color-mix(in oklab, var(--ui-bg) 92%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.2);
  padding: 8px max(8px, env(safe-area-inset-right)) calc(env(safe-area-inset-bottom) + 8px) max(8px, env(safe-area-inset-left));
  pointer-events: auto;
}

@media (max-width: 639px) {
  .sticky-footer-shell {
    gap: 8px;
    padding-top: 6px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 6px);
  }
}
</style>
