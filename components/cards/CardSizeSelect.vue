<script setup lang="ts">
const { size, setSize } = useCardSize();
</script>

<template>
  <label
    class="display-control-row flex min-w-0 flex-wrap items-center gap-2 text-sm"
  >
    <span class="shrink-0">Card size</span>
    <USelect
      :model-value="size"
      :items="[
        { label: 'Large', value: 'large' },
        { label: 'Medium', value: 'medium' },
        { label: 'Small', value: 'small' },
      ]"
      aria-label="Card size"
      size="sm"
      class="min-w-0 flex-1"
      @update:model-value="setSize"
    />
  </label>
</template>
