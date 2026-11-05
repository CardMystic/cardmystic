<template>
  <div>
    <UAlert
      color="error"
      variant="outline"
      icon="i-lucide-triangle-alert"
      :title="
        rateLimited
          ? '429 Too Many Requests'
          : starting
            ? 'Search is starting up'
            : unavailable
              ? 'Search is temporarily unavailable'
              : title
      "
      :description="
        rateLimited
          ? 'Try again in 60 seconds'
          : starting
            ? 'Waiting for the search service. Your search will retry when it is ready.'
            : unavailable
              ? 'The search service is unavailable. Please try again shortly.'
              : description
      "
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
    <SearchRecovery v-if="starting || unavailable" @ready="$emit('retry')" />
  </div>
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

const starting = computed(
  () => props.error?.message.includes('Search is starting up') ?? false,
);
const unavailable = computed(
  () =>
    props.error?.message.includes('Search is temporarily unavailable') ?? false,
);
const rateLimited = computed(() =>
  /\b429\b|too many requests/i.test(props.error?.message ?? ''),
);

defineEmits<{ retry: [] }>();
</script>
