<script setup lang="ts">
import { collectionSlug } from '~/utils/card-collections';
import type { DeckLabelGroup } from '~/utils/deckHighlight';
const props = defineProps<{
  group: DeckLabelGroup;
  names: string[];
  loading: boolean;
}>();
const target = defineModel<string>({ required: true });
const catalog = props.group === 'sets' ? useCardCollections() : undefined;
const label = computed(
  () =>
    ({ roles: 'role', sets: 'set', tags: 'tag', themes: 'theme' })[props.group],
);
const options = computed(() => {
  const kind = props.group;
  const entries = new Map(
    (catalog?.data.value?.sets ?? []).map((entry) => [entry.slug, entry.name]),
  );
  return props.names
    .map((name) => {
      const value =
        kind === 'roles' || kind === 'themes'
          ? collectionSlug(name, kind)
          : name;
      return {
        value,
        label:
          kind === 'sets' && entries.has(value)
            ? `${entries.get(value)} (${value.toUpperCase()})`
            : name,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
});
</script>
<template>
  <UFormField :label="label.charAt(0).toUpperCase() + label.slice(1)">
    <UInputMenu
      v-model="target"
      :items="options"
      :loading="loading"
      value-key="value"
      :aria-label="`Highlight ${label}`"
      :placeholder="`Choose a ${label}`"
      open-on-click
      class="w-full"
    />
  </UFormField>
</template>
