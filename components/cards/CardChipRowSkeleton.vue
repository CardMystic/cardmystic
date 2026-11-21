<script setup lang="ts">
defineProps<{ editable?: boolean }>();
</script>

<template>
  <div aria-hidden="true" class="flex min-w-0 flex-wrap items-center gap-1.5">
    <USkeleton class="h-3 w-12 shrink-0" />
    <USkeleton v-if="editable" class="h-6 w-12 shrink-0" />
    <USkeleton class="h-6 w-16" />
    <USkeleton class="h-6 w-20" />
    <USkeleton class="h-6 w-12" />
  </div>
</template>
