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
    class="grid w-full gap-2"
  >
    <UDropdownMenu
      v-if="boards.length"
      :items="boards"
      :content="{ align: 'start' }"
      :ui="{ content: 'w-[var(--reka-dropdown-menu-trigger-width)]' }"
    >
      <UButton
        label="Move To"
        icon="i-lucide-arrow-right-left"
        trailing-icon="i-lucide-chevron-down"
        color="neutral"
        :variant="variant"
        class="w-full"
        block
      />
    </UDropdownMenu>
    <div v-if="copies.length || remove" class="flex w-full gap-2">
      <UDropdownMenu
        v-if="copies.length"
        :items="copies"
        :content="{ align: 'start' }"
        :ui="{ content: 'w-[var(--reka-dropdown-menu-trigger-width)]' }"
      >
        <UButton
          label="Set # of Copies"
          icon="i-lucide-hash"
          trailing-icon="i-lucide-chevron-down"
          color="neutral"
          :variant="variant"
          class="min-w-0 flex-1"
          block
        />
      </UDropdownMenu>
      <UButton
        v-if="remove"
        aria-label="Remove From List"
        title="Remove From List"
        icon="i-lucide-trash-2"
        color="error"
        :variant="variant"
        :disabled="remove.disabled"
        square
        @click="emit('select', remove)"
      />
    </div>
  </div>
</template>
