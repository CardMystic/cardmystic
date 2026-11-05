<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    loading?: 'lazy' | 'eager';
    fetchpriority?: 'low' | 'high' | 'auto';
  }>(),
  {
    loading: 'lazy',
    fetchpriority: 'low',
    width: undefined,
    height: undefined,
  },
);
const image = useTemplateRef<HTMLImageElement>('image');
const loaded = shallowRef(false);
const failed = shallowRef(false);

function checkCachedImage() {
  if (!image.value?.complete) return;
  loaded.value = image.value.naturalWidth > 0;
  failed.value = !loaded.value;
}
onMounted(checkCachedImage);
watch(
  () => props.src,
  () => {
    loaded.value = !!image.value?.complete && image.value.naturalWidth > 0;
    failed.value = false;
  },
  { flush: 'post' },
);
</script>

<template>
  <span
    class="preview-image block overflow-hidden bg-elevated"
    :aria-busy="!loaded && !failed"
  >
    <USkeleton
      v-if="!loaded && !failed"
      class="absolute inset-0 size-full rounded-none"
      aria-hidden="true"
    />
    <img
      v-show="!failed"
      :key="src"
      ref="image"
      :src="src"
      :draggable="false"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :fetchpriority="fetchpriority"
      decoding="async"
      class="size-full"
      :class="{ 'opacity-0': !loaded }"
      @load="loaded = true"
      @error="failed = true"
    />
    <span
      v-if="failed"
      class="absolute inset-0 flex items-center justify-center text-muted"
      :role="alt ? 'img' : undefined"
      :aria-label="alt ? `${alt} unavailable` : undefined"
      :aria-hidden="!alt"
    >
      <UIcon name="i-lucide-image-off" class="size-5" aria-hidden="true" />
    </span>
  </span>
</template>

<style scoped>
.preview-image:not(.absolute) {
  position: relative;
}
.preview-image > img {
  object-fit: inherit;
  object-position: inherit;
}
</style>
