<template>
  <!-- Desktop tabs -->
  <div class="flex gap-3 max-lg:hidden mb-4 justify-center flex-nowrap">
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'ai' },
      ]"
      @click="onTabClick('ai')"
    >
      <UIcon name="i-lucide-brain" class="icon" size="18" />
      AI Search
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'similarity' },
      ]"
      @click="onTabClick('similarity')"
    >
      <UIcon name="i-mdi-cards-outline" class="icon" size="18" />
      Similarity Search
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'commander' },
      ]"
      @click="onTabClick('commander')"
    >
      <UIcon name="i-mdi-crown" class="icon" size="18" />
      Commander Search
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'keyword' },
      ]"
      @click="onTabClick('keyword')"
    >
      <UIcon name="i-lucide-whole-word" class="icon" size="18" />
      Keyword Search
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'recommend' },
      ]"
      @click="onTabClick('recommend')"
      class="relative"
    >
      <span
        class="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full px-1.5 py-0.5 border border-gray-200 dark:border-gray-600"
        ><span class="animate-rainbow">NEW</span> (Beta)</span
      >
      <UIcon name="i-lucide-box" class="icon" size="18" />
      Deck Recommender
    </button>
    <NuxtLink
      v-if="lastCard"
      :to="cardRoute!"
      :class="['search-tab-button-new card-tab', { active: cardActive }]"
    >
      <UIcon name="i-heroicons-rectangle-stack" class="icon" size="18" />
      <span class="max-w-32 truncate">{{ lastCard.name }}</span>
    </NuxtLink>
  </div>

  <!-- Mobile dropdown -->
  <div class="mb-2 lg:hidden flex flex-col justify-center items-center">
    <USelect
      label="select"
      class="w-50"
      :modelValue="mobileValue"
      placeholder="Select status"
      :icon="mobileIcon"
      variant="outline"
      @update:modelValue="onMobileSelect"
      :items="mobileItems"
    />
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui';

export type SearchTabType =
  | 'ai'
  | 'similarity'
  | 'commander'
  | 'keyword'
  | 'recommend';

const props = defineProps<{
  cardActive?: boolean;
}>();

const { searchType } = useSearchType();
const { lastCard, cardRoute } = useLastOpenedCard();
const router = useRouter();

const emit = defineEmits<{
  (e: 'select', type: SearchTabType): void;
}>();

function onTabClick(type: SearchTabType) {
  emit('select', type);
}

const searchIcon = computed(() => {
  const iconMap: Record<string, string> = {
    ai: 'i-lucide-search',
    similarity: 'i-mdi-cards-outline',
    commander: 'i-mdi-crown',
    keyword: 'i-lucide-whole-word',
    recommend: 'i-lucide-box',
  };
  return iconMap[searchType.value] || 'i-lucide-search';
});

const items = ref<SelectItem[]>([
  { label: 'AI Search', value: 'ai', icon: 'i-lucide-search' },
  {
    label: 'Similarity Search',
    value: 'similarity',
    icon: 'i-mdi-cards-outline',
  },
  { label: 'Commander Search', value: 'commander', icon: 'i-mdi-crown' },
  { label: 'Keyword Search', value: 'keyword', icon: 'i-lucide-whole-word' },
  { label: 'Deck Recommender', value: 'recommend', icon: 'i-lucide-box' },
]);

const mobileItems = computed(() => {
  const base = [...items.value] as SelectItem[];
  if (lastCard.value) {
    base.push({ type: 'separator' } as SelectItem);
    base.push({
      label: lastCard.value.name,
      value: '_card',
      icon: 'i-heroicons-rectangle-stack',
    } as SelectItem);
  }
  return base;
});

const mobileValue = computed(() =>
  props.cardActive ? '_card' : searchType.value,
);

const mobileIcon = computed(() => {
  if (props.cardActive) return 'i-heroicons-rectangle-stack';
  return searchIcon.value;
});

function onMobileSelect(val: unknown) {
  if (typeof val !== 'string') return;
  if (val === '_card' && cardRoute.value) {
    router.push(cardRoute.value);
  } else {
    onTabClick(val as SearchTabType);
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
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.13),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  border: 1.2px solid rgba(147, 114, 255, 0.22);
  backdrop-filter: blur(10px) saturate(160%);
  transition:
    background 0.18s,
    color 0.18s,
    box-shadow 0.18s,
    border 0.18s,
    transform 0.18s;
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
  box-shadow:
    0 6px 24px 0 rgba(147, 114, 255, 0.22),
    0 2px 8px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.07);
}

.search-tab-button-new:hover:not(.active),
.search-tab-button-new:focus-visible:not(.active) {
  background: #3d375a;
  color: #fff;
  border-color: #a37aff;
  box-shadow:
    0 6px 20px rgba(147, 114, 255, 0.13),
    0 2px 8px rgba(0, 0, 0, 0.13);
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
  box-shadow:
    0 6px 24px 0 rgba(56, 189, 248, 0.22),
    0 2px 8px rgba(0, 0, 0, 0.18);
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

@keyframes rainbow {
  0% {
    color: #dc2626;
  }

  25% {
    color: #ea580c;
  }

  50% {
    color: #16a34a;
  }

  75% {
    color: #2563eb;
  }

  100% {
    color: #dc2626;
  }
}

.animate-rainbow {
  animation: rainbow 3s ease-in-out infinite;
}
</style>
