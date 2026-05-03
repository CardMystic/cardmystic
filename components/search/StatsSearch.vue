<template>
  <div class="search-container">
    <!-- Stats search type tabs -->
    <ExploreTabs :stats-type="statsType" @select="switchType" />

    <div class="search-input-row">
      <PopularCardsSearch v-if="statsType === 'popular-cards'" :platform="platform" />
      <PopularCommandersSearch v-else-if="statsType === 'popular-commanders'" :platform="platform" />
      <PopularByCommanderSearch v-else-if="statsType === 'popular-by-commander'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import PopularCardsSearch from './PopularCardsSearch.vue';
import PopularCommandersSearch from './PopularCommandersSearch.vue';
import PopularByCommanderSearch from './PopularByCommanderSearch.vue';

export type StatsType = 'popular-cards' | 'popular-commanders' | 'popular-by-commander';

const props = defineProps<{
  defaultStatsType?: StatsType;
  platform?: 'arena' | 'mtgo' | 'paper';
}>();

const route = useRoute();
const router = useRouter();
const { restoreSearchQuery } = useSearchType();

const statsType = ref<StatsType>(props.defaultStatsType || 'popular-cards');

const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return 'all';
});

function switchType(type: StatsType) {
  statsType.value = type;
  const saved = restoreSearchQuery(type);
  const targetPath = `/${type}/${currentPlatform.value}`;
  if (route.path !== targetPath) {
    router.push({ path: targetPath, query: saved ?? undefined });
  }
}

// Restore query when arriving via navbar (no active query params)
onMounted(() => {
  const type = statsType.value;
  const hasQuery =
    (type === 'popular-by-commander' && route.query.commander) ||
    (type !== 'popular-by-commander' && (route.query.query || route.query.filters));
  if (!hasQuery) {
    const saved = restoreSearchQuery(type);
    if (saved) {
      router.replace({ path: route.path, query: saved });
    }
  }
});
</script>

<style scoped>
.search-container {
  width: 100%;
  margin: 0 auto;
}

.search-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

@media (max-width: 768px) {
  .search-input-row {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
}
</style>
