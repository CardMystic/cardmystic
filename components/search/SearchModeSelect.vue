<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const route = useRoute();
const router = useRouter();
const id = useId();
const { access, error, refresh } = useSearchAccess();
const mode = computed(() =>
  route.query.useRerank === 'false' ? 'normal' : 'enhanced',
);
const allowance = computed(() => {
  if (!access.value?.enabled || mode.value === 'normal') return '';
  const remaining = access.value.enhancedRemaining;
  const credits = access.value.enhancedTopUpRemaining;
  const period = access.value.tier === 'normal' ? 'today' : 'this month';
  return `${remaining} Enhanced ${remaining === 1 ? 'search' : 'searches'} left ${period}${credits ? ` + ${credits} purchased` : ''}.${access.value.authenticated ? '' : ' Guest allowance is shared on this network.'}`;
});
function select(value: unknown) {
  if (value !== 'normal' && value !== 'enhanced') return;
  return router.push({
    path: route.path,
    query: {
      ...route.query,
      useRerank: String(value === 'enhanced'),
      page: undefined,
    },
    hash: route.hash,
  });
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <label :for="id" class="text-sm font-medium">Search mode</label>
    <USelect
      :id="id"
      :model-value="mode"
      :items="[
        { label: 'Normal', value: 'normal' },
        { label: 'Enhanced', value: 'enhanced' },
      ]"
      :aria-describedby="`${id}-description`"
      aria-label="Search mode"
      class="search-mode w-36 min-h-11"
      :data-mode="mode"
      :ui="{ trailingIcon: 'text-current' }"
      size="sm"
      @update:model-value="select"
    />
    <span
      v-if="!compact || mode === 'normal'"
      :id="`${id}-description`"
      class="text-sm text-muted"
      >{{
        mode === 'normal'
          ? 'Original search matches.'
          : 'Reorders matches by relevance.'
      }}
      <NuxtLink
        v-if="mode === 'normal'"
        to="/memberships"
        class="underline underline-offset-2"
        >Get better results with our memberships</NuxtLink
      ></span
    >
    <p
      v-if="allowance"
      :id="compact ? `${id}-description` : undefined"
      class="text-sm text-muted"
      :class="compact ? 'min-w-0 flex-1 basis-64' : 'basis-full'"
    >
      {{ allowance }}
      <NuxtLink to="/memberships" class="underline underline-offset-2">{{
        compact ? 'See Memberships' : 'Memberships'
      }}</NuxtLink>
    </p>
    <p v-if="error" class="basis-full text-sm text-muted">
      Search allowance could not be checked.
      <button type="button" class="underline min-h-11" @click="refresh()">
        Retry allowance
      </button>
    </p>
  </div>
</template>

<style scoped>
:deep(.search-mode[data-mode='enhanced']) {
  color: #65419b;
  font-weight: 600;
  background-color: color-mix(in srgb, #c1a3ff 10%, var(--ui-bg));
  box-shadow:
    inset 0 0 0 1px #c1a3ff,
    0 0 16px #c1a3ff3d;
}
:global(.dark .search-mode[data-mode='enhanced']) {
  color: #c1a3ff;
}
</style>
