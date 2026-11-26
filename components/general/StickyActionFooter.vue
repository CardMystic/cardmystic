<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="show && (!hideAtPageBottom || !nearPageBottom)"
        ref="footer"
        class="sticky-footer-wrap"
      >
        <div
          class="sticky-footer-shell"
          :class="shellLayoutClass"
          @focusin="revealFocusedAction"
        >
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
function revealFocusedAction(event: FocusEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const row = target.closest<HTMLElement>('.sticky-footer-actions');
  if (!row) return;
  const control = target.getBoundingClientRect();
  const bounds = row.getBoundingClientRect();
  if (control.left < bounds.left) row.scrollLeft += control.left - bounds.left;
  else if (control.right > bounds.right)
    row.scrollLeft += control.right - bounds.right;
}

function updateToastOffset() {
  if (!import.meta.client) return;
  if (footer.value) {
    const bottom =
      window.innerHeight - footer.value.getBoundingClientRect().top;
    document.documentElement.style.setProperty(
      '--notification-bottom',
      `calc(${bottom}px + 0.5rem)`,
    );
    if (!props.hideAtPageBottom) {
      document.documentElement.style.setProperty(
        '--persistent-footer-height',
        `${bottom}px`,
      );
    }
  } else {
    document.documentElement.style.removeProperty('--notification-bottom');
    document.documentElement.style.removeProperty('--persistent-footer-height');
  }
}
useResizeObserver(footer, updateToastOffset);
watch(footer, updateToastOffset, { flush: 'post' });
const props = withDefaults(
  defineProps<{
    show?: boolean;
    hideAtPageBottom?: boolean;
  }>(),
  {
    show: true,
    hideAtPageBottom: true,
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
    document.documentElement.style.removeProperty('--persistent-footer-height');
  }
});
</script>

<style scoped>
.sticky-footer-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  pointer-events: none;
  padding: 0;
}

/* Menus also hide background portals from assistive technology. Keep the bar
   visible while respecting their interaction lock; dialogs stack above it. */
.sticky-footer-wrap[aria-hidden='true'] .sticky-footer-shell {
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

.sticky-footer-shell :deep(.sticky-footer-actions) {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: safe center;
  gap: 0.25rem;
  overflow-x: auto;
  padding: 0.125rem;
}

.sticky-footer-shell :deep(.sticky-footer-actions > *) {
  flex-shrink: 0;
}

.sticky-footer-shell :deep(.sticky-footer-actions button) {
  white-space: nowrap;
}

@media (min-width: 40rem) {
  .sticky-footer-shell :deep(.sticky-footer-actions) {
    gap: 0.75rem;
  }
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
