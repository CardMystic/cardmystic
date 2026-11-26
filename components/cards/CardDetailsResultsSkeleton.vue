<script setup lang="ts">
withDefaults(defineProps<{ tabCount?: number }>(), { tabCount: 2 });
</script>

<template>
  <div
    class="w-full mb-12"
    role="status"
    aria-label="Loading card searches"
    aria-busy="true"
  >
    <div class="mx-auto w-full max-w-5xl" aria-hidden="true">
      <div
        class="mb-4 flex h-13 justify-center items-center gap-1 py-1 lg:h-11 lg:gap-2 lg:py-0"
      >
        <USkeleton
          v-for="i in tabCount"
          :key="i"
          class="h-11 rounded-[18px]"
          :class="i === 1 ? 'w-36' : 'w-11'"
        />
      </div>
      <div class="mt-2 mb-4 space-y-4">
        <div class="flex flex-wrap gap-2">
          <USkeleton v-if="tabCount !== 4" class="h-10 w-full rounded-md" />
          <USkeleton class="h-10 min-w-0 flex-1 rounded-md" />
          <USkeleton class="h-10 w-10 rounded-md sm:w-28" />
          <template v-if="tabCount === 4">
            <USkeleton class="h-10 w-full rounded-md" />
            <USkeleton class="h-39 w-full rounded-md" />
          </template>
        </div>
        <div class="flex items-center justify-between gap-2">
          <USkeleton class="h-11 w-24 rounded-md" />
          <div
            class="grid justify-items-end gap-x-3 gap-y-1 sm:flex sm:items-center"
          >
            <USkeleton class="h-11 w-32 rounded-md sm:w-36" />
            <USkeleton class="h-5 w-36" />
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3" aria-hidden="true">
      <div class="mb-3 flex min-h-11 items-center justify-between gap-3">
        <USkeleton class="h-5 w-32" />
        <USkeleton class="h-11 w-24 rounded-md" />
      </div>
      <SearchResultsSkeleton
        :default-group-by="tabCount === 4 ? 'type' : undefined"
      />
    </div>
  </div>
</template>
