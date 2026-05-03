<template>
  <div class="results-layout xl:flex xl:items-start xl:gap-6">
    <aside class="preview-rail hidden xl:block xl:w-[20rem] xl:shrink-0 xl:self-start">
      <div class="preview-sticky">
        <HoveredPreviewSkeleton />
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  skeletonCount?: number;
}>(), {
  skeletonCount: 40,
});
</script>

<style scoped>
.preview-sticky {
  width: 100%;
}

.preview-rail {
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
}
</style>