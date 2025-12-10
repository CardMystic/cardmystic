<template>
  <div class="flex flex-col items-center mb-4">
    <div class="text-5xl md:text-6xl font-bold overflow-hidden inline-flex">
      <span v-for="(char, index) in formattedCount" :key="`pos-${index}`"
        class="inline-block bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent"
        :class="{ 'animate-slide-up': charChanged(index) }">
        {{ char }}
      </span>
    </div>
    <div class="text-sm md:text-base text-gray-400 uppercase tracking-wider font-medium mt-2">
      Total Queries Processed
    </div>
  </div>
</template>

<script lang="ts" setup>
const { totalQueries, isLoading } = useQueryMetrics();

const previousCount = ref<string>('');
const mounted = ref(false);

const formattedCount = computed(() => {
  if (!mounted.value || !totalQueries.value) {
    return '---';
  }
  return totalQueries.value.toLocaleString();
});

const charChanged = (index: number) => {
  if (!previousCount.value) return false;
  return previousCount.value[index] !== formattedCount.value[index];
};

watch(formattedCount, (newVal, oldVal) => {
  if (oldVal) {
    previousCount.value = oldVal;
  }
  // Reset after animation completes
  setTimeout(() => {
    previousCount.value = '';
  }, 400);
});

onMounted(() => {
  mounted.value = true;
});
</script>

<style scoped>
@keyframes slideUp {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}
</style>