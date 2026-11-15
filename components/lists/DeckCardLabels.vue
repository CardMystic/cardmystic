<script setup lang="ts">
import { deckCardLabelsKey } from '~/composables/useDeckHighlight';
import { cardLabelColors, cardLabelGroups } from '~/utils/deckHighlight';
import { collectionPath, collectionSlug } from '~/utils/card-collections';
const props = defineProps<{ oracleId: string }>();
const context = inject(deckCardLabelsKey, undefined);
const groups = computed(() =>
  (context?.visible.value ?? [])
    .map((kind) => ({
      kind,
      names: context?.labels.value[props.oracleId]?.[kind] ?? [],
      loading: context?.loading.value.includes(kind),
    }))
    .filter(
      (group) => group.kind === 'tags' || group.names.length || group.loading,
    ),
);
</script>
<template>
  <dl
    v-if="groups.length"
    aria-label="Card labels"
    class="my-1 space-y-1 text-xs"
  >
    <div
      v-for="{ kind, names, loading } in groups"
      :key="kind"
      class="flex min-w-0 flex-wrap items-baseline gap-1"
    >
      <dt class="text-muted">
        <NuxtLink
          v-if="kind !== 'tags'"
          :to="collectionPath(kind)"
          no-prefetch
          class="hover:underline"
          >{{ cardLabelGroups[kind] }}</NuxtLink
        ><template v-else
          >{{ cardLabelGroups[kind] }}
          <CardTagEditButton :oracle-id="oracleId" />
        </template>
      </dt>
      <dd
        v-if="loading && !names.length"
        aria-busy="true"
        :aria-label="`Loading ${kind}`"
      >
        <USkeleton class="h-5 w-16" />
      </dd>
      <dd v-for="name in names" :key="name" class="min-w-0 max-w-full">
        <UBadge
          :color="cardLabelColors[kind]"
          variant="subtle"
          size="sm"
          class="max-w-full whitespace-normal wrap-anywhere"
        >
          <NuxtLink
            v-if="kind !== 'tags'"
            :to="collectionPath(kind, collectionSlug(name, kind))"
            no-prefetch
            class="min-w-0 hover:underline"
            >{{ name }}</NuxtLink
          >
          <template v-else>{{ name }}</template>
        </UBadge>
      </dd>
    </div>
  </dl>
</template>
