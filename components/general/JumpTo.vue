<template>
  <div v-if="groups.length > 0"
    class="jump-to-container sm:ml-2 sm:bg-elevated sm:p-2 sm:rounded-md sm:border-2 sm:border-secondary"
    :style="{ bottom: bottomOffset + 'px' }">
    <!-- Desktop: show all group buttons inline -->
    <div class="hidden sm:flex items-center gap-1 flex-wrap">
      <UIcon name="i-lucide-map-pin" class="text-primary mr-0" />
      <UButton v-for="group in groups" :key="group" :label="group" size="xs" color="neutral" variant="soft"
        class="cursor-pointer" @click="scrollToGroup(group)" />
    </div>

    <!-- Mobile: collapsed dropdown -->
    <div class="sm:hidden relative" ref="mobileContainer">
      <UButton icon="i-lucide-map-pin" color="neutral" variant="soft" size="xl"
        class="cursor-pointer border-2 border-secondary" aria-label="Jump to group" @click="mobileOpen = !mobileOpen" />
      <Transition name="fade">
        <div v-if="mobileOpen"
          class="absolute right-0 bottom-full mb-2 bg-elevated rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-40 z-999">
          <span class="text-xs font-medium text-muted px-2 pb-1">Jump to:</span>
          <UButton v-for="group in groups" :key="group" :label="group" size="xs" color="neutral" variant="soft"
            class="cursor-pointer w-full justify-start" @click="scrollToGroup(group); mobileOpen = false" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  groups: string[];
}>();

const mobileOpen = ref(false);
const mobileContainer = ref<HTMLElement | null>(null);
const visible = ref(false);
const bottomOffset = ref(8);
const minBottom = 8;
const footerGap = 12;

const jumpToVisible = useJumpToVisible();

watch(() => props.groups, (groups) => {
  jumpToVisible.value = groups.length > 0;
  if (import.meta.client) {
    nextTick(updatePosition);
  }
}, { immediate: true });

onUnmounted(() => {
  jumpToVisible.value = false;
});

function groupToId(label: string): string {
  return 'group-' + label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase();
}

function scrollToGroup(label: string) {
  // First try: find element by ID (content div inside accordion)
  const id = groupToId(label);
  const contentEl = document.getElementById(id);
  if (contentEl) {
    // Scroll to the accordion trigger (parent) rather than the content
    const trigger = contentEl.closest('[data-accordion-item]')?.querySelector('button')
      ?? contentEl.previousElementSibling as HTMLElement
      ?? contentEl;
    scrollToElement(trigger);
    return;
  }

  // Fallback: find accordion trigger button by text content
  const buttons = document.querySelectorAll('button');
  const triggerBtn = Array.from(buttons).find(
    btn => btn.textContent?.trim().includes(label)
  );
  if (triggerBtn) {
    scrollToElement(triggerBtn);
  }
}

function scrollToElement(el: Element) {
  const navbarOffset = 130;
  const top = el.getBoundingClientRect().top + window.scrollY - navbarOffset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function updatePosition() {
  const scrollY = window.scrollY;
  visible.value = scrollY > 300;

  const footer = document.querySelector('footer');
  if (!footer) {
    bottomOffset.value = minBottom;
    return;
  }

  const footerRect = footer.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  // If footer is visible in viewport, push JumpTo above it
  if (footerRect.top < viewportHeight) {
    bottomOffset.value = viewportHeight - footerRect.top + footerGap;
  } else {
    bottomOffset.value = minBottom;
  }
}

function handleClickOutside(e: MouseEvent) {
  if (mobileContainer.value && !mobileContainer.value.contains(e.target as Node)) {
    mobileOpen.value = false;
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    document.addEventListener('click', handleClickOutside);
    updatePosition();
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', updatePosition);
    window.removeEventListener('resize', updatePosition);
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.jump-to-container {
  position: fixed;
  right: 8px;
  z-index: 9998;
  transition: bottom 0.15s ease;
}
</style>
