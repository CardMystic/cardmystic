<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const route = useRoute();
const router = useRouter();
const id = useId();
const { access, pending, error, refresh, userId, ready } = useSearchAccess();
// Auth can resolve before this component hydrates on an SSR search page.
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const signedIn = computed(() => mounted.value && !!userId.value);
const mode = computed(() =>
  !signedIn.value || route.query.useRerank === 'false' ? 'normal' : 'enhanced',
);
const allowance = computed(() => {
  if (mode.value === 'normal') return 'Unlimited';
  if (error.value) return 'Search allowance could not be checked.';
  if (pending.value) return 'Checking remaining searches…';
  if (!access.value?.enabled) return 'Search allowance is not enabled.';
  if (access.value.tier === 'enhanced') return 'Unlimited';
  const remaining = access.value.enhancedRemaining;
  const credits = access.value.enhancedTopUpRemaining;
  return `${(remaining ?? 0) + credits} Left`;
});
function select(value: unknown) {
  if (value !== 'normal' && value !== 'enhanced') return;
  if (value === 'enhanced' && !userId.value) return;
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
        { label: 'Enhanced', value: 'enhanced', disabled: !signedIn },
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
      :id="`${id}-description`"
      class="text-sm text-muted"
      aria-live="polite"
    >
      <NuxtLink
        v-if="mounted && ready && !userId"
        :to="{ path: '/user/login', query: { redirect: route.fullPath } }"
        class="underline underline-offset-2"
        >Sign in for enhanced searches</NuxtLink
      >
      <template v-else-if="mounted">
        {{ allowance }}
        <button
          v-if="error && mode === 'enhanced'"
          type="button"
          class="underline min-h-11"
          @click="refresh()"
        >
          Retry allowance
        </button>
        <template v-else>
          <span aria-hidden="true"> | </span>
          <NuxtLink to="/memberships" class="underline underline-offset-2"
            >Memberships</NuxtLink
          >
        </template>
      </template>
      <template v-else>Checking remaining searches…</template>
    </span>
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
