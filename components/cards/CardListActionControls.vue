<script setup lang="ts">
import type { CardAction } from '~/utils/card-actions';
const props = withDefaults(
  defineProps<{ actions: CardAction[]; variant?: 'outline' | 'ghost' }>(),
  { variant: 'outline' },
);
const emit = defineEmits<{ select: [action: CardAction] }>();
const copies = computed(() => menuItems('copies'));
const boards = computed(() => menuItems('board'));
const remove = computed(() =>
  props.actions.find((action) => action.group === 'remove'),
);
function menuItems(group: CardAction['group']) {
  return props.actions
    .filter((action) => action.group === group)
    .map((action) => ({
      ...action,
      onSelect: () => emit('select', action),
    }));
}
</script>

<template>
  <div
    v-if="boards.length || copies.length || remove"
    class="grid w-full gap-1"
  >
    <UDropdownMenu
      v-if="boards.length"
      :items="boards"
      :content="{ align: 'start' }"
      :ui="{ content: 'w-[var(--reka-dropdown-menu-trigger-width)]' }"
    >
      <UButton
        label="Move To"
        :ui="{ label: 'whitespace-normal', trailingIcon: 'ml-auto' }"
        icon="i-lucide-arrow-right-left"
        trailing-icon="i-lucide-chevron-down"
        color="neutral"
        :variant="variant"
        class="w-full min-h-11 justify-start text-left"
      />
    </UDropdownMenu>
    <UDropdownMenu
      v-if="copies.length"
      :items="copies"
      :content="{ align: 'start' }"
      :ui="{ content: 'w-[var(--reka-dropdown-menu-trigger-width)]' }"
    >
      <UButton
        label="Set Copies"
        :ui="{ label: 'whitespace-normal', trailingIcon: 'ml-auto' }"
        icon="i-lucide-hash"
        trailing-icon="i-lucide-chevron-down"
        color="neutral"
        :variant="variant"
        class="w-full min-w-0 min-h-11 justify-start whitespace-normal text-left"
      />
    </UDropdownMenu>
    <UButton
      v-if="remove"
      aria-label="Remove From List"
      label="Remove"
      title="Remove From List"
      icon="i-lucide-trash-2"
      color="error"
      :variant="variant"
      :disabled="remove.disabled"
      class="w-full min-h-11 justify-start text-left"
      @click="emit('select', remove)"
    />
  </div>
</template>
