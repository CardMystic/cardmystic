<script setup lang="ts">
import type { SearchBackgroundType } from '~/utils/searchBackgrounds';

defineProps<{ type: SearchBackgroundType }>();
</script>

<template>
  <div class="relative isolate w-full">
    <SearchBackground :type="type" placement="header" />
    <NavigationBreadcrumbs />
    <div class="w-full flex flex-col items-center">
      <slot />
    </div>
  </div>
</template>
