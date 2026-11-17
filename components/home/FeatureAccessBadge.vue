<script setup lang="ts">
defineProps<{ pro?: boolean; accountRequired?: boolean }>();
</script>

<template>
  <span
    class="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
    :class="
      pro
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-primary/25 bg-primary/10 text-primary'
    "
  >
    <template v-if="pro"
      ><UIcon name="i-lucide-crown" class="size-3.5" aria-hidden="true" />Pro
      Features</template
    >
    <template v-else-if="accountRequired">Free with an account</template>
    <template v-else
      >Free <span aria-hidden="true">·</span> No account required</template
    >
  </span>
</template>
