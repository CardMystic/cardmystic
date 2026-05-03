<template>
  <div class="fixed-fab" :style="{ bottom: bottomOffset + 'px' }">
    <UTooltip :content="{
      side: 'left',
      sideOffset: 8
    }" text="Report an issue with these results">
      <UButton icon="i-lucide-circle-alert" color="neutral" size="xl" variant="soft"
        class="border-2 border-secondary cursor-pointer" @click="onClick && onClick()" />
    </UTooltip>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  onClick?: () => void
}>();
const onClick = props.onClick;

const jumpToVisible = useJumpToVisible();
const defaultBottom = computed(() => jumpToVisible.value ? 58 : 8);

const bottomOffset = ref(defaultBottom.value);
const minBottom = computed(() => jumpToVisible.value ? 58 : 8);
const footerGap = 62;

watch(defaultBottom, (val) => {
  bottomOffset.value = val;
  updatePosition();
});

let _rafPending = false;
function updatePosition() {
  if (_rafPending) return;
  _rafPending = true;
  requestAnimationFrame(() => {
    _rafPending = false;
    const footer = document.querySelector('footer');
    if (!footer) {
      bottomOffset.value = minBottom.value;
      return;
    }

    const footerRect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (footerRect.top < viewportHeight) {
      bottomOffset.value = viewportHeight - footerRect.top + footerGap;
    } else {
      bottomOffset.value = minBottom.value;
    }
  });
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    updatePosition();
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', updatePosition);
    window.removeEventListener('resize', updatePosition);
  }
});
</script>

<style lang="sass" scoped>
.fixed-fab
  position: fixed
  right: 8px
  z-index: 99
  isolation: isolate
  transition: bottom 0.15s ease, transform 0.3s ease

  &:hover
    transform: translateY(-2px)
</style>