<script setup lang="ts">
withDefaults(defineProps<{ full?: boolean }>(), { full: false });
</script>

<template>
  <div
    class="page-background min-h-screen w-full relative overflow-hidden"
    :class="full ? '' : 'flex items-center justify-center px-4 py-12'"
  >
    <div
      :class="
        full ? 'relative z-10 w-full h-full' : 'w-full max-w-md mx-auto z-10'
      "
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-background {
  background: #080808 url('/playmat-background.jpg') center bottom / cover
    no-repeat;
}
</style>
