<script setup lang="ts">
import { commanderBracket } from '~/utils/commanderBrackets';

const props = defineProps<{ bracket?: number | null; editable?: boolean }>();
const emit = defineEmits<{ edit: [] }>();
const info = computed(() => commanderBracket(props.bracket));
const label = computed(() =>
  info.value ? `Bracket ${info.value.value}` : 'Bracket: Unknown',
);
const description = computed(() =>
  info.value
    ? `${label.value}: ${info.value.name}. ${info.value.description}`
    : 'Bracket: Unknown. The owner has not selected a Commander bracket.',
);
</script>

<template>
  <UTooltip
    :text="description"
    :content="{ ariaLabel: description }"
    :ui="{
      content: 'max-w-72 h-auto',
      text: 'whitespace-normal overflow-visible text-clip',
    }"
  >
    <component
      :is="editable ? 'button' : 'span'"
      :type="editable ? 'button' : undefined"
      :role="editable ? undefined : 'img'"
      :aria-label="editable ? `Edit ${label.toLowerCase()}` : label"
      tabindex="0"
      class="relative z-20 inline-flex min-w-5 shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-primary"
      :class="[
        info?.classes ??
          'bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600',
        { 'cursor-pointer hover:brightness-110': editable },
      ]"
      @click="editable && emit('edit')"
    >
      {{ info?.value ?? '?' }}
    </component>
  </UTooltip>
</template>
