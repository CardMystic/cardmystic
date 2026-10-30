<template>
  <UCard
    variant="subtle"
    class="w-full max-w-[330px] mx-auto"
    :ui="{ body: 'p-1 sm:p-1' }"
    aria-hidden="true"
    data-testid="card-skeleton"
  >
    <USkeleton
      class="w-full aspect-[5/7]"
      :class="size === 'small' ? 'rounded-lg' : 'rounded-[14px]'"
    />
    <div
      v-if="!hideProgressBar || showCardInfo"
      class="mt-1 flex min-h-8 items-center gap-2"
    >
      <USkeleton v-if="!hideProgressBar" class="h-2 min-w-0 flex-1" />
      <USkeleton v-if="showCardInfo" class="h-7 w-14 shrink-0 rounded-md" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'small' | 'large';
    showCardInfo?: boolean;
    hideProgressBar?: boolean;
  }>(),
  { size: 'large' },
);
</script>
