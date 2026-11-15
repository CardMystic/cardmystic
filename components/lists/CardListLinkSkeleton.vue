<script setup lang="ts">
defineProps<{
  primer?: boolean;
  showSettingsButton?: boolean;
  collection?: boolean;
}>();
</script>

<template>
  <div
    class="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-default bg-elevated"
    aria-hidden="true"
  >
    <div class="flex-1 p-4" :class="primer ? 'min-h-72' : 'min-h-40'">
      <div class="flex items-start justify-between gap-3">
        <USkeleton class="h-6 w-1/2" />
        <div class="flex max-w-[48%] flex-col items-end gap-1">
          <USkeleton class="h-6 w-20" />
          <USkeleton class="h-7 w-16" />
          <USkeleton v-if="!collection" class="h-4 w-12" />
          <div
            v-if="showSettingsButton"
            class="grid size-11 place-items-center"
          >
            <USkeleton class="size-5 rounded-full" />
          </div>
        </div>
      </div>
      <USkeleton v-if="!collection" class="mt-1 h-5 w-1/2" />
      <div class="mt-3 space-y-2">
        <USkeleton
          v-for="i in primer ? 7 : 1"
          :key="i"
          class="h-4"
          :class="i === 1 ? 'w-4/5' : 'w-full'"
        />
      </div>
    </div>
    <div
      class="mx-4 flex h-13 items-center justify-between gap-3 border-t border-accented"
    >
      <USkeleton class="h-4 w-28" /><USkeleton class="h-5 w-20" />
    </div>
    <USkeleton class="h-1.5 w-full rounded-none" />
  </div>
</template>
