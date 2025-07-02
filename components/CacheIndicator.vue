<template>
  <div v-if="showIndicator" class="cache-indicator">
    <v-chip
      size="small"
      :color="indicatorColor"
      variant="elevated"
      class="cache-chip"
    >
      <v-icon start>{{ indicatorIcon }}</v-icon>
      {{ indicatorText }}
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useSearchStore } from '~/stores/searchStore';

const searchStore = useSearchStore();
const showIndicator = ref(false);
const mounted = ref(false);
const indicatorText = ref('');
const indicatorColor = ref('success');
const indicatorIcon = ref('mdi-lightning-bolt');

onMounted(() => {
  mounted.value = true;
});

// Watch for cache hits and show "Used Cached Query" with lightning bolt in green
watch(
  () => searchStore.cacheHitTriggered,
  (newValue, oldValue) => {
    console.log(
      'CacheIndicator: cacheHitTriggered changed',
      newValue,
      oldValue,
    );
    if (mounted.value && newValue > oldValue) {
      indicatorText.value = 'Used Cached Query';
      indicatorColor.value = 'success';
      indicatorIcon.value = 'mdi-lightning-bolt';
      showIndicator.value = true;
      console.log('CacheIndicator: Showing "Used Cached Query"');
      setTimeout(() => {
        showIndicator.value = false;
      }, 3000);
    }
  },
);

// Watch for when queries get cached and show "Query Cached" with refresh icon in blue
watch(
  () => searchStore.queryCachedTriggered,
  (newValue, oldValue) => {
    console.log(
      'CacheIndicator: queryCachedTriggered changed',
      newValue,
      oldValue,
    );
    if (mounted.value && newValue > oldValue) {
      indicatorText.value = 'Query Cached';
      indicatorColor.value = 'info';
      indicatorIcon.value = 'mdi-refresh';
      showIndicator.value = true;
      console.log('CacheIndicator: Showing "Query Cached"');
      setTimeout(() => {
        showIndicator.value = false;
      }, 3000);
    }
  },
);

defineExpose({
  showCacheHit: () => {
    if (mounted.value) {
      indicatorText.value = 'Used Cached Query';
      indicatorColor.value = 'success';
      indicatorIcon.value = 'mdi-lightning-bolt';
      showIndicator.value = true;
      setTimeout(() => (showIndicator.value = false), 3000);
    }
  },
});
</script>

<style scoped lang="sass">
.cache-indicator
  position: fixed
  top: 100px
  right: 20px
  z-index: 9999
  animation: slideIn 0.3s ease-out

.cache-chip
  font-weight: 600 !important
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important
  border: 1px solid rgba(255, 255, 255, 0.2) !important
  animation: gentle-pulse 3s ease-in-out infinite

@keyframes slideIn
  from
    transform: translateX(100%)
    opacity: 0
  to
    transform: translateX(0)
    opacity: 1

@keyframes gentle-pulse
  0%, 100%
    transform: scale(1)
    opacity: 0.9
  50%
    transform: scale(1.02)
    opacity: 1
</style>
