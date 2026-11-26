<script setup lang="ts">
import {
  cardPageAction,
  type CardAction,
  type CardActionMenu,
} from '~/utils/card-actions';

const props = defineProps<{
  oracleId: string;
  actions: CardActionMenu;
  preview?: boolean;
  printingEnabled?: boolean;
}>();
const emit = defineEmits<{
  select: [action: CardAction];
  viewCard: [];
  changePrinting: [];
}>();
const variant = computed(() => (props.preview ? 'outline' : 'ghost'));
const groups = computed(() =>
  [
    { name: 'list', items: [props.actions.commander, props.actions.cut] },
    {
      name: 'general',
      items: [
        props.actions.marketplace,
        props.actions.addToDeck,
        props.actions.recommendations,
        props.actions.popular,
        props.actions.similar,
        props.actions.flip,
      ],
    },
    {
      name: 'search',
      items: [props.actions.feedback, props.actions.addToSearch],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item): item is CardAction => !!item),
    }))
    .filter(
      (group) =>
        group.items.length ||
        (group.name === 'list' &&
          (props.actions.list?.length || props.printingEnabled)),
    ),
);
</script>

<template>
  <UButton
    v-bind="cardPageAction"
    :ui="{ label: 'whitespace-normal wrap-anywhere' }"
    :to="`/card/${oracleId}`"
    no-prefetch
    class="min-h-11 w-full justify-start text-left"
    @click="emit('viewCard')"
  />
  <div
    v-for="(group, index) in groups"
    :key="group.name"
    :data-card-action-group="group.name"
    class="grid gap-1"
    :class="[
      preview && 'gap-2',
      index > 0 && 'border-t border-default mt-2',
      index > 0 && (preview ? 'pt-4' : 'pt-3'),
    ]"
  >
    <CardListActionControls
      v-if="group.name === 'list' && (actions.list?.length || printingEnabled)"
      :actions="actions.list ?? []"
      :printing-enabled="printingEnabled"
      :variant="variant"
      @change-printing="emit('changePrinting')"
      @select="emit('select', $event)"
    />
    <UButton
      v-for="action in group.items"
      :key="action.label"
      :ui="{ label: 'whitespace-normal wrap-anywhere' }"
      :label="action.label"
      :icon="action.icon"
      :to="action.to"
      :target="action.target"
      :rel="action.rel"
      :disabled="action.disabled"
      :color="action.color ?? 'neutral'"
      :variant="
        preview && action === actions.marketplace
          ? 'solid'
          : (action.variant ?? variant)
      "
      class="min-h-11 w-full justify-start whitespace-normal text-left"
      @click="emit('select', action)"
    />
  </div>
</template>
