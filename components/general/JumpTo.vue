<template>
  <div v-if="hasJumpTargets" class="jump-to-content xl:ml-2">
    <!-- Desktop: show all group buttons inline -->
    <div class="hidden xl:flex items-center gap-1 flex-wrap">
      <UIcon name="i-lucide-map-pin" class="text-primary mr-0" />
      <template v-if="boardSections.length > 1">
        <UButton v-for="section in boardSections" :key="'board-' + section" :label="section" size="xs" color="primary"
          variant="soft" class="cursor-pointer" @click="scrollToBoard(section)" />
        <div v-if="groups.length > 0" class="w-px h-4 bg-gray-500/30 mx-0.5"></div>
      </template>
      <UButton v-for="group in groups" :key="group" :label="group" size="xs" color="neutral" variant="soft"
        class="cursor-pointer" @click="scrollToGroup(group)" />
    </div>

    <!-- Mobile: collapsed dropdown -->
    <div class="xl:hidden relative" ref="mobileContainer">
      <UButton icon="i-lucide-map-pin" color="neutral" variant="soft" size="xl"
        class="cursor-pointer border-2 border-secondary" aria-label="Jump to group" @click="mobileOpen = !mobileOpen" />
      <Transition name="fade">
        <div v-if="mobileOpen"
          class="absolute right-0 bottom-full mb-2 bg-elevated rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-40 z-999">
          <span class="text-xs font-medium text-muted px-2 pb-1">Jump to:</span>
          <template v-if="boardSections.length > 1">
            <UButton v-for="section in boardSections" :key="'board-' + section" :label="section" size="xs"
              color="primary" variant="soft" class="cursor-pointer w-full justify-start"
              @click="scrollToBoard(section); mobileOpen = false" />
            <div v-if="groups.length > 0" class="border-t border-gray-500/30 my-1"></div>
          </template>
          <UButton v-for="group in groups" :key="group" :label="group" size="xs" color="neutral" variant="soft"
            class="cursor-pointer w-full justify-start" @click="scrollToGroup(group); mobileOpen = false" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  groups: string[];
  boardSections?: string[];
}>(), {
  boardSections: () => [],
});

const emit = defineEmits<{
  (e: 'jumpBoard', board: string): void;
}>();

const mobileOpen = ref(false);
const mobileContainer = ref<HTMLElement | null>(null);
const hasJumpTargets = computed(() => props.groups.length > 0 || props.boardSections.length > 1);

const jumpToVisible = useJumpToVisible();

watch(hasJumpTargets, (value) => {
  jumpToVisible.value = value;
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

function scrollToBoard(board: string) {
  emit('jumpBoard', board);
  if (board === 'Mainboard') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById('board-' + board.toLowerCase());
  if (el) {
    scrollToElement(el);
  }
}

function scrollToElement(el: Element) {
  const navbarOffset = 130;
  const top = el.getBoundingClientRect().top + window.scrollY - navbarOffset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function handleClickOutside(e: MouseEvent) {
  if (mobileContainer.value && !mobileContainer.value.contains(e.target as Node)) {
    mobileOpen.value = false;
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.jump-to-content {
  width: max-content;
  max-width: 100%;
}
</style>
