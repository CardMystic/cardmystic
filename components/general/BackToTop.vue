<template>
  <Teleport v-if="showButton" to="#back-to-top-anchor">
    <button
      type="button"
      class="back-to-top cursor-pointer border border-default bg-default text-default shadow-md hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="scrollToTop"
    >
      <UIcon
        name="i-heroicons-arrow-up"
        class="mr-1 shrink-0"
        aria-hidden="true"
      />
      Back to top
    </button>
  </Teleport>
</template>

<script setup lang="ts">
const showButton = ref(false);
const scrollThreshold = 300;
let _rafPending = false;

// Show or hide the button based on scroll position
function handleScroll() {
  if (_rafPending) return;
  _rafPending = true;
  requestAnimationFrame(() => {
    _rafPending = false;
    showButton.value = window.scrollY > scrollThreshold;
  });
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.back-to-top {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  max-width: 100%;
  padding: 0.5rem 1.25rem;
  border-radius: 0 0 0.75rem 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
}
</style>
