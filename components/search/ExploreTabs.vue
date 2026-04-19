<template>
  <!-- Desktop tabs -->
  <div class="flex gap-3 max-md:hidden mb-4 justify-center flex-nowrap">
    <button type="button" :class="['search-tab-button-new', { active: statsType === 'popular-cards' }]"
      @click="onTabClick('popular-cards')">
      <UIcon name="i-lucide-chart-no-axes-combined" class="icon" size="18" />
      Popular Commander Cards
    </button>
    <button type="button" :class="['search-tab-button-new', { active: statsType === 'popular-commanders' }]"
      @click="onTabClick('popular-commanders')">
      <UIcon name="i-mdi-crown" class="icon" size="18" />
      Popular Commanders
    </button>
    <button type="button" :class="['search-tab-button-new', { active: statsType === 'popular-by-commander' }]"
      @click="onTabClick('popular-by-commander')">
      <UIcon name="i-lucide-flame" class="icon" size="18" />
      Cards by Commander
    </button>
    <NuxtLink v-if="lastCard" :to="cardRoute!" :class="['search-tab-button-new card-tab', { active: cardActive }]">
      <UIcon name="i-heroicons-rectangle-stack" class="icon" size="18" />
      <span class="max-w-32 truncate">{{ lastCard.name }}</span>
    </NuxtLink>
  </div>

  <!-- Mobile dropdown -->
  <div class="mb-2 md:hidden flex flex-col justify-center items-center">
    <p class="text-sm text-gray-400 mb-1 text-center">Select Explore Type</p>
    <USelect label="select" class="w-50" :modelValue="mobileValue" placeholder="Select type" :icon="mobileIcon"
      variant="outline" @update:modelValue="onMobileSelect" :items="mobileItems" />
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'

export type ExploreTabType = 'popular-cards' | 'popular-commanders' | 'popular-by-commander';

const props = defineProps<{
  statsType: ExploreTabType;
  cardActive?: boolean;
}>();

const { lastCard, cardRoute } = useLastOpenedCard();
const router = useRouter();

const emit = defineEmits<{
  (e: 'select', type: ExploreTabType): void;
}>();

function onTabClick(type: ExploreTabType) {
  emit('select', type);
}

const statsIcon = computed(() => {
  if (props.statsType === 'popular-cards') return 'i-lucide-chart-no-axes-combined';
  if (props.statsType === 'popular-by-commander') return 'i-lucide-flame';
  return 'i-mdi-crown';
});

const items = ref<SelectItem[]>([
  { label: 'Popular Commander Cards', value: 'popular-cards', icon: 'i-lucide-chart-no-axes-combined' },
  { label: 'Popular Commanders', value: 'popular-commanders', icon: 'i-mdi-crown' },
  { label: 'Cards by Commander', value: 'popular-by-commander', icon: 'i-lucide-flame' },
]);

const mobileItems = computed(() => {
  const base = [...items.value] as SelectItem[];
  if (lastCard.value) {
    base.push({ type: 'separator' } as SelectItem);
    base.push({ label: lastCard.value.name, value: '_card', icon: 'i-heroicons-rectangle-stack' } as SelectItem);
  }
  return base;
});

const mobileValue = computed(() => props.cardActive ? '_card' : props.statsType);

const mobileIcon = computed(() => {
  if (props.cardActive) return 'i-heroicons-rectangle-stack';
  return statsIcon.value;
});

function onMobileSelect(val: unknown) {
  if (typeof val !== 'string') return;
  if (val === '_card' && cardRoute.value) {
    router.push(cardRoute.value);
  } else {
    onTabClick(val as ExploreTabType);
  }
}
</script>

<style scoped>
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
  text-decoration: none;
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

.search-tab-button-new.card-tab {
  background: #1a2a3a;
  border-color: rgba(56, 189, 248, 0.35);
  color: #7dd3fc;
  text-decoration: none;
}

.search-tab-button-new.card-tab:hover:not(.active) {
  background: #1e3a5f;
  border-color: #38bdf8;
  color: #fff;
  transform: translateY(-1px) scale(1.03);
}

.search-tab-button-new.card-tab.active {
  background: #1e3a5f;
  border-color: #38bdf8;
  color: #fff;
  box-shadow: 0 6px 24px 0 rgba(56, 189, 248, 0.22), 0 2px 8px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.07);
}

@media (max-width: 768px) {
  .search-tab-button-new {
    padding: 6px 10px;
    font-size: 0.92rem;
    min-width: unset;
    flex: 0 0 auto;
  }
}
</style>
