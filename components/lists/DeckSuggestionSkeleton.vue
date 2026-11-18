<script setup lang="ts">
withDefaults(defineProps<{ action?: boolean }>(), { action: true });
</script>

<template>
  <div class="min-w-0 flex flex-col gap-2">
    <USkeleton class="w-full aspect-[488/680] rounded-[14px]" />
    <USkeleton v-if="action" class="w-full h-9 rounded-md" />
  </div>
</template>
