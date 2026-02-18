<script setup lang="ts">
const showTooltip = ref(false)

onMounted(() => {
  if (process.server) return;
  // Check if user has dismissed the tooltip before
  const dismissed = localStorage.getItem('loginTooltipDismissed')
  if (dismissed === 'true') {
    showTooltip.value = false
  } else {
    showTooltip.value = true
  }
})

function dismissTooltip() {
  showTooltip.value = false
  if (process.server) return;
  localStorage.setItem('loginTooltipDismissed', 'true')
}
</script>

<template>
  <div v-if="showTooltip"
    class="absolute top-full right-0 mt-4 w-64 bg-white text-black p-3 rounded-lg shadow-lg z-50 flex flex-row items-center">

    <div class="text-sm font-medium">
      <span class="font-bold animate-rainbow">NEW!</span> Create an account for card lists, search history, and more!
    </div>
    <UButton @click="dismissTooltip" icon="i-lucide-x" size="xs" color="neutral" variant="solid"
      class=" rounded-full shadow-md cursor-pointer" />
    <!-- Arrow pointing up -->
    <div class="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45"></div>
  </div>
</template>

<style scoped>
@keyframes rainbow {
  0% {
    color: #dc2626;
  }

  25% {
    color: #ea580c;
  }

  50% {
    color: #16a34a;
  }

  75% {
    color: #2563eb;
  }

  100% {
    color: #dc2626;
  }
}

.animate-rainbow {
  animation: rainbow 3s ease-in-out infinite;
}
</style>
