<template>
  <div v-if="showButton" class="back-to-top cursor-pointer" @click="scrollToTop">
    <UIcon name="i-heroicons-arrow-up" class="mr-1" />
    Back to top
  </div>
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

<style lang="sass" scoped>
.back-to-top
  position: fixed
  top: 83px
  left: 50%
  transform: translateX(-50%)
  z-index: 9999
  background: white
  color: black
  padding: 8px 20px
  border-radius: 0 0 12px 12px
  display: flex
  align-items: center
  justify-content: center
  font-weight: 500
  font-size: 14px
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)
  border: 1px solid rgba(0, 0, 0, 0.1)
  opacity: 0.9
  &:hover
    opacity: 1
  @media (max-width: 767px)
    top: 73px
</style>
