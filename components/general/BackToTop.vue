<template>
  <UButton v-if="showButton" icon="i-heroicons-arrow-up" color="primary" variant="solid" size="lg"
    class="back-to-top-button cursor-pointer" aria-label="Back to top" @click="scrollToTop" square
    style="position: fixed !important; top: 85px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 9999 !important; width: 120px !important; max-width: 200px !important; height: auto !important; max-height: 48px !important;">
    Back to top
  </UButton>
</template>

<script setup lang="ts">
const showButton = ref(false)
const scrollThreshold = 300

// Show or hide the button based on scroll position
function handleScroll() {
  const scrollY = window.scrollY
  showButton.value = scrollY > scrollThreshold
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('scroll', handleScroll)
    handleScroll()
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>
