<template>
  <UDropdownMenu
    v-if="isMounted && hasJumpTargets"
    :items="items"
    :content="{ side: 'top', align: 'end' }"
    :ui="{ content: 'max-h-72 overflow-y-auto' }"
  >
    <UButton
      label="Jump To"
      aria-label="Jump to group"
      icon="i-lucide-map-pin"
      color="neutral"
      variant="ghost"
      size="sm"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    groups: string[];
    boardSections?: string[];
  }>(),
  {
    boardSections: () => [],
  },
);

const emit = defineEmits<{
  (e: 'jumpBoard', board: string): void;
}>();

const isMounted = ref(false);
const hasJumpTargets = computed(
  () => props.groups.length > 0 || props.boardSections.length > 1,
);

const jumpToVisible = useJumpToVisible();

watch(
  () => isMounted.value && hasJumpTargets.value,
  (value) => {
    jumpToVisible.value = value;
  },
  { immediate: true },
);

onUnmounted(() => {
  jumpToVisible.value = false;
});

function groupToId(label: string): string {
  return (
    'group-' +
    label
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/-+$/, '')
      .toLowerCase()
  );
}

function scrollToGroup(label: string) {
  // First try: find element by ID (content div inside accordion)
  const id = groupToId(label);
  const contentEl = document.getElementById(id);
  if (contentEl) {
    // Scroll to the accordion trigger (parent) rather than the content
    const trigger =
      contentEl.closest('[data-accordion-item]')?.querySelector('button') ??
      (contentEl.previousElementSibling as HTMLElement) ??
      contentEl;
    scrollToElement(trigger);
    return;
  }

  // Fallback: find accordion trigger button by text content
  const buttons = document.querySelectorAll('button');
  const triggerBtn = Array.from(buttons).find((btn) =>
    btn.textContent?.trim().includes(label),
  );
  if (triggerBtn) {
    scrollToElement(triggerBtn);
  }
}

async function scrollToBoard(board: string) {
  emit('jumpBoard', board);
  await nextTick();
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

onMounted(() => {
  isMounted.value = true;
});
const items = computed(() => [
  ...(props.boardSections.length > 1
    ? props.boardSections.map((section) => ({
        label: section,
        onSelect: () => scrollToBoard(section),
      }))
    : []),
  ...props.groups.map((group) => ({
    label: group,
    onSelect: () => scrollToGroup(group),
  })),
]);
</script>
