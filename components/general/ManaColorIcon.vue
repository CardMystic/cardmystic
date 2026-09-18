<template>
  <svg
    v-if="symbol"
    class="inline-block size-[1.3em] shrink-0 align-baseline text-[0.7em]"
    style="margin: 0 2px 0 0; margin-inline-start: 0 !important"
    viewBox="0 0 41.6 41.6"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="20.8" cy="20.8" r="20.8" :fill="symbol.background" />
    <path :d="symbol.path" transform="translate(4.8 4.8)" fill="#111" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { manaColorSymbols } from '~/utils/manaColorSymbols';

const props = defineProps<{ type: string }>();

const symbol = computed(
  () =>
    manaColorSymbols[props.type.toLowerCase() as keyof typeof manaColorSymbols],
);
</script>
