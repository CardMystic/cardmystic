<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
const emit = defineEmits<{ ready: [] }>();
const config = useRuntimeConfig();
const route = useRoute();
const startedPath = route.fullPath;
const attempts = useState('search-recovery-attempts', () => ({
  path: startedPath,
  count: 0,
}));
if (attempts.value.path !== startedPath)
  attempts.value = { path: startedPath, count: 0 };
const stopped = ref(attempts.value.count >= 3);
let polls = 0;
const status = useQuery({
  queryKey: ['search-readiness', startedPath],
  queryFn: async ({ signal }) => {
    polls++;
    const response = await fetch(`${config.public.backendPath}/search/status`, {
      signal,
    });
    if (!response.ok) throw new Error('Could not check search readiness.');
    return response.json() as Promise<{
      state: 'ready' | 'warming_up' | 'unavailable';
      retryAfterSeconds: number;
    }>;
  },
  enabled: computed(
    () =>
      import.meta.client && !stopped.value && route.fullPath === startedPath,
  ),
  retry: false,
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  refetchInterval: () => (!stopped.value && polls < 12 ? 15_000 : false),
});
watch(status.data, (data) => {
  if (
    data?.state === 'ready' &&
    !stopped.value &&
    route.fullPath === startedPath
  ) {
    stopped.value = true;
    attempts.value.count++;
    emit('ready');
  }
});
const message = computed(() =>
  attempts.value.count >= 3
    ? 'Automatic retries have stopped. Please retry manually in a few minutes.'
    : status.error.value
      ? 'Could not check search readiness. You can retry manually.'
      : polls >= 12
        ? 'Search is taking longer than expected. Please retry in a few minutes.'
        : status.data.value?.state === 'warming_up'
          ? 'The search service is loading. Checking again shortly…'
          : status.data.value?.state === 'unavailable'
            ? 'The search service is unavailable. Checking again shortly…'
            : 'Checking whether search is ready…',
);
</script>
<template>
  <p class="mt-2 text-sm text-muted" role="status">{{ message }}</p>
</template>
