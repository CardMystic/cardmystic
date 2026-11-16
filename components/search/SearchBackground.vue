<script setup lang="ts">
import {
  searchBackgrounds,
  type SearchBackgroundType,
} from '~/utils/searchBackgrounds';

const props = withDefaults(
  defineProps<{
    type: SearchBackgroundType;
    placement?: 'search' | 'header';
  }>(),
  { placement: 'search' },
);
const art = computed(() => searchBackgrounds[props.type]);
</script>

<template>
  <div
    class="search-background-mask"
    :class="{ 'search-background-header': placement === 'header' }"
    aria-hidden="true"
  >
    <img
      :src="art.src"
      :style="{ objectPosition: 'position' in art ? art.position : undefined }"
      class="search-background-art"
      alt=""
      decoding="async"
      fetchpriority="low"
    />
  </div>
</template>

<style scoped>
.search-background-mask {
  container-type: size;
  position: absolute;
  z-index: -1;
  pointer-events: none;
  top: -160px;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  /* End the fade around the middle of the first input, below the chips. */
  height: 268px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 35%, transparent);
}

.search-background-header {
  top: 0;
  height: 100%;
}

.search-background-art {
  width: 100%;
  max-width: none;
  height: 100%;
  transform: scale(1.06);
  filter: blur(16px);
  object-fit: cover;
  object-position: center 30%;
  opacity: 0.45;
}

.dark .search-background-art {
  opacity: 0.22;
}
</style>
