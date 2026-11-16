<script setup lang="ts">
import { collectionPath, collectionSlug } from '~/utils/card-collections';
const props = defineProps<{
  counts?: Record<string, number> | null;
  loading?: boolean;
  gameChangers?: number;
}>();
const optionalRoles = defineModel<string[]>('optionalRoles');
const fixedRoles = [
  'Removal',
  'Ramp',
  'Board Wipe',
  'Card Draw',
  'Game Changers',
];
const trackedRoles = computed(() => [
  ...new Set([...fixedRoles, ...(optionalRoles.value ?? [])]),
]);
const countsByName = computed(
  () =>
    new Map(
      Object.entries(props.counts ?? {}).map(([name, count]) => [
        name.toLowerCase(),
        count,
      ]),
    ),
);
const availableRoles = computed(() => {
  const tracked = new Set(trackedRoles.value.map((name) => name.toLowerCase()));
  return Object.keys(props.counts ?? {})
    .filter((name) => !tracked.has(name.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
});
function addRole(name: string | undefined) {
  if (name && availableRoles.value.includes(name))
    optionalRoles.value = [...(optionalRoles.value ?? []), name];
}
function removeRole(name: string) {
  const remaining = (optionalRoles.value ?? []).filter((role) => role !== name);
  optionalRoles.value = remaining.length ? remaining : undefined;
}
</script>

<template>
  <section aria-labelledby="deck-role-counts-title" class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 id="deck-role-counts-title" class="text-lg font-semibold">
        <NuxtLink to="/roles" class="hover:underline">Cards by Role</NuxtLink>
      </h3>
      <UInputMenu
        v-if="availableRoles.length"
        :items="availableRoles"
        :model-value="undefined"
        aria-label="Add a role"
        placeholder="Add a role"
        open-on-click
        class="w-full sm:w-56"
        @update:model-value="addRole"
      />
    </div>
    <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div
        v-for="name in trackedRoles"
        :key="name"
        class="relative rounded-lg border border-default p-3"
      >
        <dt
          class="text-sm text-muted"
          :class="{ 'pr-6': !fixedRoles.includes(name) }"
        >
          <NuxtLink
            :to="collectionPath('roles', collectionSlug(name, 'roles'))"
            class="text-primary hover:underline"
            >{{ name }}</NuxtLink
          >
        </dt>
        <dd class="text-2xl font-semibold tabular-nums">
          <USkeleton
            v-if="loading && name !== 'Game Changers'"
            aria-hidden="true"
            class="my-1 h-6 w-8"
          />
          <template v-else>{{
            name === 'Game Changers'
              ? (gameChangers ?? '—')
              : counts
                ? (countsByName.get(name.toLowerCase()) ?? 0)
                : '—'
          }}</template>
        </dd>
        <UButton
          v-if="!fixedRoles.includes(name)"
          icon="i-lucide-x"
          :aria-label="`Remove ${name}`"
          variant="ghost"
          color="neutral"
          size="xs"
          class="absolute top-1 right-1"
          @click="removeRole(name)"
        />
      </div>
    </dl>
  </section>
</template>
