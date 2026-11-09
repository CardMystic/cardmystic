<template>
  <!-- Search chips: mobile expands only the selected mode. -->
  <div
    class="desktop-search-tabs flex gap-3 mb-4 justify-center flex-wrap"
    :class="{ compact }"
  >
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'smart' },
      ]"
      :aria-label="'Smart Search'"
      @click="onTabClick('smart')"
    >
      <UIcon name="i-lucide-brain" class="icon" size="18" />
      <span class="tab-label">Smart Search</span>
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'similarity' },
      ]"
      :aria-label="'Similarity Search'"
      @click="onTabClick('similarity')"
    >
      <UIcon name="i-mdi-cards-outline" class="icon" size="18" />
      <span class="tab-label">Similarity Search</span>
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'commander' },
      ]"
      :aria-label="'Commander Search'"
      @click="onTabClick('commander')"
    >
      <UIcon name="i-mdi-crown" class="icon" size="18" />
      <span class="tab-label">Commander Search</span>
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'keyword' },
      ]"
      :aria-label="'Keyword Search'"
      @click="onTabClick('keyword')"
    >
      <UIcon name="i-lucide-whole-word" class="icon" size="18" />
      <span class="tab-label">Keyword Search</span>
    </button>
    <button
      type="button"
      :class="[
        'search-tab-button-new',
        { active: !cardActive && searchType === 'recommend' },
      ]"
      :aria-label="'Deck Recommender'"
      @click="onTabClick('recommend')"
      class="relative"
    >
      <UIcon name="i-lucide-box" class="icon" size="18" />
      <span class="tab-label">Deck Recommender</span>
    </button>
    <NuxtLink
      v-if="lastCard"
      :to="cardRoute!"
      :class="['search-tab-button-new card-tab', { active: cardActive }]"
    >
      <UIcon name="i-heroicons-rectangle-stack" class="icon" size="18" />
      <span class="tab-label max-w-32 truncate">{{ lastCard.name }}</span>
    </NuxtLink>
  </div>
</template>

<script lang="ts" setup>
export type SearchTabType =
  'smart' | 'similarity' | 'commander' | 'keyword' | 'recommend';

defineProps<{
  cardActive?: boolean;
  compact?: boolean;
}>();

const { searchType } = useSearchType();
const { lastCard, cardRoute } = useLastOpenedCard();

const emit = defineEmits<{
  (e: 'select', type: SearchTabType): void;
}>();

function onTabClick(type: SearchTabType) {
  emit('select', type);
}
</script>

<style scoped>
@media (min-width: 1024px) {
  .compact {
    flex-wrap: nowrap;
    gap: 0.5rem;
    justify-content: center;
  }
  .desktop-search-tabs.compact .search-tab-button-new {
    min-height: 44px;
    padding: 7px 10px;
    gap: 0;
    flex: 0 1 auto;
    min-width: 44px;
  }
  .compact .icon {
    flex-shrink: 0;
  }
  .compact .tab-label {
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transition:
      max-width 0.3s ease,
      opacity 0.3s ease,
      margin 0.3s ease;
  }
  .compact .active .tab-label,
  .compact .search-tab-button-new:hover .tab-label,
  .compact .search-tab-button-new:focus-visible .tab-label {
    max-width: 12rem;
    opacity: 1;
    margin-left: 7px;
  }
  .compact .search-tab-button-new:focus-visible {
    outline: 2px solid var(--ui-primary);
    outline-offset: 2px;
  }
  .compact .tab-label {
    text-overflow: ellipsis;
  }
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
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.13),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  border: 1.2px solid rgba(147, 114, 255, 0.22);
  backdrop-filter: blur(10px) saturate(160%);
  transition:
    background 0.18s,
    color 0.18s,
    box-shadow 0.18s,
    border 0.18s;
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
}

.search-tab-button-new:hover:not(.active),
.search-tab-button-new:focus-visible:not(.active) {
  background: #3d375a;
  color: #fff;
  border-color: #a37aff;
  box-shadow:
    0 6px 20px rgba(147, 114, 255, 0.13),
    0 2px 8px rgba(0, 0, 0, 0.13);
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
}

.search-tab-button-new.card-tab.active {
  background: #1e3a5f;
  border-color: #38bdf8;
  color: #fff;
  box-shadow:
    0 6px 24px 0 rgba(56, 189, 248, 0.22),
    0 2px 8px rgba(0, 0, 0, 0.18);
}

@media (max-width: 1023px) {
  .desktop-search-tabs {
    flex-wrap: nowrap;
    justify-content: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    padding: 4px 2px;
  }
  .desktop-search-tabs .search-tab-button-new {
    min-height: 44px;
    min-width: 44px;
    padding: 7px 8px;
    gap: 0;
    font-size: 0.75rem;
    flex: 0 0 auto;
  }
  .desktop-search-tabs .active {
    flex: 0 1 auto;
    min-width: 44px;
  }
  .desktop-search-tabs .icon {
    flex-shrink: 0;
  }
  .desktop-search-tabs .tab-label {
    min-width: 0;
    max-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    transition:
      max-width 0.3s ease,
      opacity 0.3s ease,
      margin 0.3s ease;
  }
  .desktop-search-tabs .active .tab-label {
    max-width: 12rem;
    margin-left: 6px;
    opacity: 1;
  }
}
</style>
