<template>
  <div class="search-container">
    <!-- Stats search type tabs -->
    <div class="flex gap-3 max-md:hidden mb-4 justify-center">
      <button type="button" :class="['search-tab-button-new', { active: statsType === 'popular-cards' }]"
        @click="switchType('popular-cards')">
        <UIcon name="i-lucide-chart-no-axes-combined" class="icon" size="18" />
        Popular Cards
      </button>
      <button type="button" :class="['search-tab-button-new', { active: statsType === 'popular-commanders' }]"
        @click="switchType('popular-commanders')">
        <UIcon name="i-mdi-crown" class="icon" size="18" />
        Popular Commanders
      </button>
      <button type="button" :class="['search-tab-button-new', { active: statsType === 'popular-by-commander' }]"
        @click="switchType('popular-by-commander')">
        <UIcon name="i-lucide-crown" class="icon" size="18" />
        Cards by Commander
      </button>
    </div>

    <!-- Mobile dropdown -->
    <div class="mb-2 md:hidden flex flex-col justify-center items-center">
      <p class="text-sm text-gray-400 mb-1 text-center">Select Explore Type</p>
      <USelect label="select" class="w-50" :modelValue="statsType" placeholder="Select type" :icon="statsIcon"
        variant="outline" @update:modelValue="(val) => { if (typeof val === 'string') switchType(val as StatsType) }"
        :items="items" />
    </div>

    <div class="search-input-row">
      <PopularCardsSearch v-if="statsType === 'popular-cards'" :platform="platform" />
      <PopularCommandersSearch v-else-if="statsType === 'popular-commanders'" :platform="platform" />
      <PopularByCommanderSearch v-else-if="statsType === 'popular-by-commander'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
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

const statsIcon = computed(() => {
  if (statsType.value === 'popular-cards') return 'i-lucide-chart-no-axes-combined';
  if (statsType.value === 'popular-by-commander') return 'i-lucide-crown';
  return 'i-mdi-crown';
});

const items = ref<SelectItem[]>([
  {
    label: 'Popular Cards',
    value: 'popular-cards',
    icon: 'i-lucide-chart-no-axes-combined'
  },
  {
    label: 'Popular Commanders',
    value: 'popular-commanders',
    icon: 'i-mdi-crown'
  },
  {
    label: 'Cards by Commander',
    value: 'popular-by-commander',
    icon: 'i-lucide-crown'
  },
])

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

.search-tab-button-new {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 18px;
  border: none;
  border-radius: 18px;
  font-weight: 500;
  font-size: 0.98rem;
  cursor: pointer;
  white-space: nowrap;
  color: #e6e6fa;
  background: #23223a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
  border: 1.2px solid rgba(147, 114, 255, 0.22);
  backdrop-filter: blur(10px) saturate(160%);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, border 0.18s, transform 0.18s;
  position: relative;
  z-index: 1;
  outline: none;
  line-height: 1.2;
}

.search-tab-button-new.active {
  background: #a37aff;
  color: #fff;
  border-color: #a37aff;
  box-shadow: 0 6px 24px 0 rgba(147, 114, 255, 0.22), 0 2px 8px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.07);
}

.search-tab-button-new:hover:not(.active),
.search-tab-button-new:focus-visible:not(.active) {
  background: #3d375a;
  color: #fff;
  border-color: #a37aff;
  box-shadow: 0 6px 20px rgba(147, 114, 255, 0.13), 0 2px 8px rgba(0, 0, 0, 0.13);
  transform: translateY(-1px) scale(1.03);
}

@media (max-width: 768px) {
  .search-tab-button-new {
    padding: 6px 10px;
    font-size: 0.92rem;
    min-width: 120px;
    flex: 0 0 auto;
  }

  .search-input-row {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
}
</style>
