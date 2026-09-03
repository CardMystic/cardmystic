<template>
  <div class="results-layout xl:flex xl:items-start xl:gap-6">
    <aside
      class="preview-rail hidden xl:block xl:w-[20rem] xl:shrink-0 xl:self-start"
    >
      <div class="preview-sticky">
        <HoveredPreviewSkeleton />
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div
        v-if="view === 'grid'"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2"
      >
        <CardSkeleton
          v-for="i in skeletonCount"
          :key="`skeleton-${i}`"
          :showCardInfo="true"
        />
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-0"
      >
        <div
          v-for="i in skeletonCount"
          :key="`text-skeleton-${i}`"
          class="h-9 flex items-center gap-2 px-1.5 border-b border-default"
        >
          <USkeleton class="h-3.5 w-5 shrink-0" />
          <USkeleton
            class="h-3.5"
            :class="i % 3 === 0 ? 'w-2/3' : i % 2 === 0 ? 'w-1/2' : 'w-3/4'"
          />
          <USkeleton class="h-4 w-10 ml-auto shrink-0" />
          <USkeleton class="size-5 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    skeletonCount?: number;
    view?: 'grid' | 'text';
  }>(),
  {
    skeletonCount: 40,
    view: 'grid',
  },
);
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
