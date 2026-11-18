<script setup lang="ts">
import { deckSuggestionActions } from '~/utils/card-actions';
defineProps<{
  action: keyof typeof deckSuggestionActions;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}>();
defineEmits<{ click: [] }>();
</script>

<template>
  <UButton
    data-suggestion-action
    v-bind="deckSuggestionActions[action]"
    :aria-label="label"
    :disabled="disabled"
    :loading="loading"
    variant="outline"
    :ui="{ label: 'min-w-0 whitespace-normal [overflow-wrap:anywhere]' }"
    class="w-full min-h-9 flex-wrap justify-center text-base"
    @click="$emit('click')"
  />
</template>
