<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="show && !nearPageBottom"
        ref="footer"
        class="sticky-footer-wrap"
      >
        <div class="sticky-footer-shell" :class="shellLayoutClass">
          <slot v-if="slots.default" />
          <div
            v-else
            class="max-w-[1900px] flex justify-center items-center gap-8"
          >
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
  </ClientOnly>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';
const footer = useTemplateRef<HTMLElement>('footer');
function updateToastOffset() {
  if (!import.meta.client) return;
  if (footer.value) {
    const bottom =
      window.innerHeight - footer.value.getBoundingClientRect().top;
    document.documentElement.style.setProperty(
      '--notification-bottom',
      `calc(${bottom}px + 0.5rem)`,
    );
  } else document.documentElement.style.removeProperty('--notification-bottom');
}
useResizeObserver(footer, updateToastOffset);
watch(footer, updateToastOffset, { flush: 'post' });
withDefaults(
  defineProps<{
    show?: boolean;
  }>(),
  {
    show: true,
  },
);

const slots = useSlots();
const hasLeftSlot = computed(() => Boolean(slots.left));
const hasRightSlot = computed(() => Boolean(slots.right));
const shellLayoutClass = computed(() => {
  if (hasLeftSlot.value && hasRightSlot.value) return 'justify-between';
  if (hasLeftSlot.value) return 'justify-start';
  return 'justify-end';
});

const nearPageBottom = ref(false);
const BOTTOM_THRESHOLD = 250;
let _rafPending = false;

function checkScrollPosition() {
  if (!import.meta.client || _rafPending) return;
  _rafPending = true;
  requestAnimationFrame(() => {
    _rafPending = false;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const distanceFromBottom = docHeight - (scrollTop + windowHeight);
    nearPageBottom.value = distanceFromBottom < BOTTOM_THRESHOLD;
  });
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', updateToastOffset);
    checkScrollPosition();
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', checkScrollPosition);
    window.removeEventListener('resize', updateToastOffset);
    document.documentElement.style.removeProperty('--notification-bottom');
  }
});
</script>

<style scoped>
.sticky-footer-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  pointer-events: none;
  padding: 0;
}

/* Dialogs mark background portals inert; do not cover them with purchase controls. */
.sticky-footer-wrap[aria-hidden='true'] {
  visibility: hidden;
  pointer-events: none;
}

.sticky-footer-shell {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid
    color-mix(in oklab, var(--ui-secondary) 52%, transparent);
  background: color-mix(in oklab, var(--ui-bg) 92%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  pointer-events: auto;
}

@media (max-width: 39.999rem) {
  .sticky-footer-wrap {
    padding: 0 0.5rem;
    bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
  .sticky-footer-shell {
    padding: 0.625rem 0.75rem;
    border: 1px solid color-mix(in oklab, var(--ui-secondary) 52%, transparent);
    border-radius: 1.25rem;
  }
}
</style>
