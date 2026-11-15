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
}>();
const emit = defineEmits<{ select: [action: CardAction]; viewCard: [] }>();
const variant = computed(() => (props.preview ? 'outline' : 'ghost'));
const groups = computed(() => {
  const actions = props.actions;
  return [
    {
      name: 'general',
      items: [
        actions.addToDeck,
        actions.recommendations,
        actions.popular,
        actions.similar,
        actions.flip,
      ],
    },
    { name: 'list', items: [actions.commander, actions.cut] },
    { name: 'search', items: [actions.feedback, actions.addToSearch] },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item): item is CardAction => !!item),
  }));
});
</script>

<template>
  <UButton
    v-bind="cardPageAction"
    :to="`/card/${oracleId}`"
    no-prefetch
    :block="preview"
    :class="!preview && 'min-h-11 justify-start'"
    @click="emit('viewCard')"
  />
  <UButton
    v-if="actions.marketplace"
    :label="actions.marketplace.label"
    :icon="actions.marketplace.icon"
    :color="actions.marketplace.color"
    :to="actions.marketplace.to"
    :target="actions.marketplace.target"
    :rel="actions.marketplace.rel"
    :variant="preview ? 'solid' : (actions.marketplace.variant ?? 'ghost')"
    :block="preview"
    :class="!preview && 'min-h-11 justify-start'"
    @click="emit('select', actions.marketplace)"
  />
  <template v-for="group in groups" :key="group.name">
    <div
      v-if="
        group.items.length || (group.name === 'list' && actions.list?.length)
      "
      class="grid"
      :class="[
        preview ? 'gap-2' : 'gap-1',
        group.name !== 'general' && 'border-t border-default pt-3',
      ]"
    >
      <p
        v-if="preview && group.name === 'search'"
        class="text-xs font-bold uppercase tracking-wide text-muted"
      >
        Search Actions
      </p>
      <CardListActionControls
        v-if="group.name === 'list' && actions.list?.length"
        :actions="actions.list"
        :variant="variant"
        @select="emit('select', $event)"
      />
      <UButton
        v-for="action in group.items"
        :key="action.label"
        :label="action.label"
        :icon="action.icon"
        :to="action.to"
        :target="action.target"
        :rel="action.rel"
        :disabled="action.disabled"
        :color="action.color ?? 'neutral'"
        :variant="action.variant ?? variant"
        :block="preview"
        :class="
          !preview && 'min-h-11 justify-start whitespace-normal text-left'
        "
        @click="emit('select', action)"
      />
    </div>
  </template>
</template>
