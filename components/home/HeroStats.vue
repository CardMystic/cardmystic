<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
const config = useRuntimeConfig();
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const { data } = useQuery({
  queryKey: ['siteStats'],
  enabled: mounted,
  queryFn: () =>
    $fetch<{ totalQueries: number; totalUsers: number; totalDecks: number }>(
      `${config.public.backendPath}/metrics/site_stats`,
    ),
  staleTime: 5 * 60_000,
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
const stats = computed(() => [
  {
    label: 'searches',
    count: data.value?.totalQueries,
    icon: 'i-lucide-search',
  },
  { label: 'users', count: data.value?.totalUsers, icon: 'i-lucide-users' },
  { label: 'decks', count: data.value?.totalDecks, icon: 'i-lucide-layers' },
]);
</script>

<template>
  <div
    class="flex w-full min-h-8 flex-wrap justify-center gap-2"
    aria-label="CardMystic community statistics"
  >
    <template v-for="stat in stats" :key="stat.label">
      <span
        v-if="typeof stat.count === 'number' && Number.isFinite(stat.count)"
        class="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 text-purple-200 px-3 py-1 text-xs sm:text-sm"
      >
        <UIcon :name="stat.icon" class="size-4" aria-hidden="true" />
        <strong>{{ stat.count.toLocaleString('en-US') }}</strong>
        {{ stat.label }}
      </span>
    </template>
  </div>
</template>
