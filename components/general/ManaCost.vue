<script lang="ts" setup>

import { formatSymbols } from '~/utils/formatMTGSymbols';

const props = defineProps({
  manaCost: {
    type: String,
    required: false,
  },
});

const formattedManaCost = computed(() => {
  return formatSymbols(props.manaCost);
});

</script>
<template>
  <div>
    <template v-for="(part, index) in formattedManaCost" :key="index">
      <template v-if="typeof part === 'string'">{{ part }}</template>
      <component v-else :is="part" />
    </template>
  </div>
</template>

<style scoped lang="sass">
</style>