<template>
  <UAlert
    color="error"
    variant="outline"
    icon="i-lucide-triangle-alert"
    :title="
      rateLimited ? '429 Too Many Requests' : 'Search could not be completed'
    "
    :description="
      rateLimited
        ? 'Try again in 60 seconds'
        : 'We couldn\'t load results for this search. Please try again.'
    "
    role="alert"
  >
    <template #actions>
      <UButton
        label="Retry search"
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
  defineProps<{ isRetrying?: boolean; error?: Error | null }>(),
  {
    isRetrying: false,
  },
);

const rateLimited = computed(() =>
  /\b429\b|too many requests/i.test(props.error?.message ?? ''),
);

defineEmits<{ retry: [] }>();
</script>
