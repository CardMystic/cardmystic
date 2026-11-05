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
  if (pending.value || !ready.value) return 'Checking...';
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
  <div
    class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:flex sm:flex-wrap"
  >
    <USelect
      :id="id"
      :model-value="mode"
      :items="[
        { label: 'Normal', value: 'normal' },
        { label: 'Pro', value: 'enhanced', disabled: !signedIn },
      ]"
      :aria-describedby="`${id}-description`"
      aria-label="Search mode"
      class="search-mode w-32 min-h-11 sm:w-36"
      :data-mode="mode"
      :ui="{ trailingIcon: 'text-current' }"
      size="sm"
      @update:model-value="select"
    />
    <span
      :id="`${id}-description`"
      class="min-w-0 text-sm text-muted"
      aria-live="polite"
    >
      <NuxtLink
        v-if="mounted && ready && !userId"
        :to="{ path: '/user/login', query: { redirect: route.fullPath } }"
        class="underline underline-offset-2"
        >Sign in for<br class="sm:hidden" />
        Pro searches</NuxtLink
      >
      <template v-else-if="!mounted || pending || !ready">Checking...</template>
      <template v-else>
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
    </span>
  </div>
</template>

<style scoped>
:deep(.search-mode[data-mode='enhanced']) {
  color: var(--pro-accent);
  font-weight: 600;
  background-color: var(--pro-bg);
  box-shadow: inset 0 0 0 1px var(--pro-border);
}
</style>
