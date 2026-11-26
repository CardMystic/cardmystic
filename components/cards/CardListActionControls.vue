<script setup lang="ts">
import { cardActionStyles, type CardAction } from '~/utils/card-actions';
const props = withDefaults(
  defineProps<{
    actions: CardAction[];
    printingEnabled?: boolean;
    variant?: 'outline' | 'ghost';
  }>(),
  { variant: 'outline' },
);
const emit = defineEmits<{
  select: [action: CardAction];
  changePrinting: [];
}>();
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
    v-if="printingEnabled || boards.length || copies.length || remove"
    class="grid w-full gap-1"
  >
    <div v-if="printingEnabled || boards.length" class="flex flex-wrap gap-1">
      <UButton
        v-if="printingEnabled"
        label="Set Printing"
        v-bind="cardActionStyles.printing"
        :variant="variant"
        class="min-h-11 min-w-0 flex-1 basis-[8rem] justify-start whitespace-normal text-left"
        :ui="{ label: 'whitespace-normal wrap-anywhere' }"
        @click="emit('changePrinting')"
      />
      <UDropdownMenu
        v-if="boards.length"
        :items="boards"
        :content="{ align: 'start' }"
        :ui="{
          content:
            'w-[max(12rem,var(--reka-dropdown-menu-trigger-width))] max-w-[calc(100vw-2rem)]',
          itemLabel: 'whitespace-normal wrap-anywhere',
        }"
      >
        <UButton
          label="Move"
          :ui="{
            label: 'whitespace-normal wrap-anywhere',
            trailingIcon: 'ml-auto',
          }"
          icon="i-lucide-arrow-right-left"
          trailing-icon="i-lucide-chevron-down"
          color="neutral"
          :variant="variant"
          class="min-h-11 min-w-0 flex-1 basis-[8rem] justify-start whitespace-normal text-left"
        />
      </UDropdownMenu>
    </div>
    <div v-if="copies.length || remove" class="flex flex-wrap gap-1">
      <UDropdownMenu
        v-if="copies.length"
        :items="copies"
        :content="{ align: 'start' }"
        :ui="{
          content:
            'w-[max(12rem,var(--reka-dropdown-menu-trigger-width))] max-w-[calc(100vw-2rem)]',
          itemLabel: 'whitespace-normal wrap-anywhere',
        }"
      >
        <UButton
          label="Set Copies"
          :ui="{
            label: 'whitespace-normal wrap-anywhere',
            trailingIcon: 'ml-auto',
          }"
          icon="i-lucide-hash"
          trailing-icon="i-lucide-chevron-down"
          color="neutral"
          :variant="variant"
          class="min-h-11 min-w-0 flex-1 basis-[8rem] justify-start whitespace-normal text-left"
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
        class="min-h-11 min-w-0 flex-1 basis-[8rem] justify-start whitespace-normal text-left"
        :ui="{ label: 'whitespace-normal wrap-anywhere' }"
        @click="emit('select', remove)"
      />
    </div>
  </div>
</template>
