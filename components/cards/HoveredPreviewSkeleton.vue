<template>
  <UCard variant="outline" class="preview-root" :ui="{ body: 'p-4' }">
    <div class="preview-card-stack">
      <div class="preview-image-wrapper">
        <USkeleton class="preview-image" />
        <USkeleton class="copy-count-pill" />
      </div>

      <div class="space-y-2">
        <div class="space-y-2">
          <USkeleton class="h-6 w-3/4" />
          <USkeleton class="h-4 w-1/2" />
        </div>

        <div class="flex flex-wrap gap-2">
          <USkeleton class="h-5 w-20 rounded-full" />
          <USkeleton class="h-5 w-28 rounded-full" />
          <USkeleton class="h-5 w-16 rounded-full" />
        </div>

        <USkeleton class="h-6 w-24" />
      </div>

      <div class="preview-actions">
        <USkeleton class="h-11 w-full rounded-lg" />
        <USkeleton class="h-11 w-full rounded-lg" />
        <USkeleton class="h-11 w-full rounded-lg" />
      </div>

      <div class="preview-actions">
        <USkeleton class="h-4 w-28" />
        <div class="grid grid-cols-2 gap-2">
          <USkeleton class="h-10 w-full rounded-lg" />
          <USkeleton class="h-10 w-full rounded-lg" />
        </div>
        <USkeleton class="h-10 w-full rounded-lg" />
        <USkeleton class="h-10 w-full rounded-lg" />
        <USkeleton class="h-10 w-full rounded-lg" />
        <USkeleton class="h-10 w-full rounded-lg" />
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.preview-root {
  width: 100%;
}

.preview-card-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-image-wrapper {
  position: relative;
}

.preview-image {
  width: 100%;
  aspect-ratio: 5 / 7;
  border-radius: 16px;
}

.copy-count-pill {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 52px;
  height: 28px;
  border-radius: 999px;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
