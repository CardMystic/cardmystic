<template>
  <UAlert
    color="error"
    variant="outline"
    icon="i-lucide-triangle-alert"
    title="Search could not be completed"
    description="We couldn't load results for this search. Please try again."
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
withDefaults(defineProps<{ isRetrying?: boolean }>(), {
  isRetrying: false,
});

defineEmits<{ retry: [] }>();
</script>
