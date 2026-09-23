<template>
  <UAlert
    color="error"
    variant="outline"
    icon="i-lucide-triangle-alert"
    :title="rateLimited ? '429 Too Many Requests' : title"
    :description="rateLimited ? 'Try again in 60 seconds' : description"
    role="alert"
  >
    <template #actions>
      <UButton
        :label="retryLabel"
        color="error"
        variant="soft"
        class="cursor-pointer"
        :loading="isRetrying"
        :disabled="isRetrying"
        @click="$emit('retry')"
      />
    </template>
  </UAlert>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isRetrying?: boolean;
    error?: Error | null;
    title?: string;
    description?: string;
    retryLabel?: string;
  }>(),
  {
    isRetrying: false,
    title: 'Search could not be completed',
    description: "We couldn't load results for this search. Please try again.",
    retryLabel: 'Retry search',
  },
);

const rateLimited = computed(() =>
  /\b429\b|too many requests/i.test(props.error?.message ?? ''),
);

defineEmits<{ retry: [] }>();
</script>
