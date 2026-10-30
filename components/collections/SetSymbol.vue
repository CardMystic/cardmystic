<script setup lang="ts">
import { computed } from 'vue';
import { setSymbolAsset } from '~/utils/set-symbol-assets';

const props = withDefaults(defineProps<{ code: string; size?: number }>(), {
  size: 20,
});
const asset = computed(() => setSymbolAsset(props.code));
const dimensions = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size}px`,
}));
const mask = computed(() =>
  asset.value?.svg
    ? {
        maskImage: `url("${asset.value.svg}")`,
        WebkitMaskImage: `url("${asset.value.svg}")`,
      }
    : undefined,
);
</script>

<template>
  <span
    :data-set-symbol="code.toLowerCase()"
    aria-hidden="true"
    class="inline-flex shrink-0 items-center justify-center align-middle"
    :style="dimensions"
  >
    <span v-if="asset?.glyph" class="set-symbol-glyph">{{ asset.glyph }}</span>
    <span v-else-if="asset?.svg" class="set-symbol-svg" :style="mask" />
    <UIcon v-else name="i-lucide-layers" class="size-full" />
  </span>
</template>

<style scoped>
@font-face {
  font-family: 'Keyrune';
  src: url('/fonts/keyrune/keyrune.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.set-symbol-glyph {
  font-family: 'Keyrune';
  font-style: normal;
  font-weight: normal;
  line-height: 1;
}

.set-symbol-svg {
  width: 100%;
  height: 100%;
  background-color: currentColor;
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
}
</style>
