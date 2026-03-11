<template>
  <div v-if="groups.length > 0" class="ml-2 jump-to-container sm:bg-elevated p-2 rounded-md border-2 border-secondary"
    :style="{ bottom: bottomOffset + 'px' }">
    <!-- Desktop: show all group buttons inline -->
    <div class="hidden sm:flex items-center gap-1 flex-wrap">
      <UIcon name="i-lucide-map-pin" class="text-primary mr-1" />
      <span class="text-xs font-medium text-muted mr-1">Jump to:</span>
      <UButton v-for="group in groups" :key="group" :label="group" size="xs" color="neutral" variant="soft"
        class="cursor-pointer" @click="scrollToGroup(group)" />
    </div>

    <!-- Mobile: collapsed dropdown -->
    <div class="sm:hidden relative" ref="mobileContainer">
      <UButton icon="i-lucide-map-pin" color="primary" variant="solid" size="sm" class="cursor-pointer"
        aria-label="Jump to group" @click="mobileOpen = !mobileOpen" />
      <Transition name="fade">
        <div v-if="mobileOpen"
          class="absolute right-0 bottom-full mb-2 bg-elevated rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-40 z-50">
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

function groupToId(label: string): string {
  return 'group-' + label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase();
}

function scrollToGroup(label: string) {
  const id = groupToId(label);
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
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
