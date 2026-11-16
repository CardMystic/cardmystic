<script setup lang="ts">
import { NuxtLink } from '#components';
export interface SearchTypeChip {
  value: string;
  label: string;
  icon: string;
  to?: string;
  href?: string;
  card?: boolean;
}
defineProps<{
  items: SearchTypeChip[];
  activeValue?: string;
}>();
const emit = defineEmits<{ select: [value: string] }>();
function selectLink(event: MouseEvent, value: string) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  emit('select', value);
}
</script>

<template>
  <div class="desktop-search-tabs flex gap-3 mb-4 justify-center flex-wrap">
    <template v-for="item in items" :key="item.value">
      <component
        :is="item.to ? NuxtLink : 'a'"
        v-if="item.to || item.href"
        :to="item.to"
        :href="item.href"
        @click="item.href && selectLink($event, item.value)"
        :class="[
          'search-tab-button-new',
          { active: activeValue === item.value, 'card-tab': item.card },
        ]"
        :aria-label="item.label"
      >
        <UIcon :name="item.icon" class="icon" size="18" />
        <span class="tab-label" :class="{ 'max-w-32 truncate': item.card }">{{
          item.label
        }}</span>
      </component>
      <button
        v-else
        type="button"
        :class="[
          'search-tab-button-new',
          { active: activeValue === item.value },
        ]"
        :aria-label="item.label"
        :aria-pressed="activeValue === item.value"
        @click="$emit('select', item.value)"
      >
        <UIcon :name="item.icon" class="icon" size="18" />
        <span class="tab-label">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .desktop-search-tabs {
    flex-wrap: nowrap;
    gap: 0.5rem;
    justify-content: center;
  }
  .desktop-search-tabs .search-tab-button-new {
    min-height: 44px;
    padding: 7px 10px;
    gap: 0;
    flex: 0 1 auto;
    min-width: 44px;
  }
  .desktop-search-tabs .icon {
    flex-shrink: 0;
  }
  .desktop-search-tabs .tab-label {
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transition:
      max-width 0.3s ease,
      opacity 0.3s ease,
      margin 0.3s ease;
  }
  .desktop-search-tabs .active .tab-label,
  .desktop-search-tabs .search-tab-button-new:hover .tab-label,
  .desktop-search-tabs .search-tab-button-new:focus-visible .tab-label {
    max-width: 24rem;
    opacity: 1;
    margin-left: 7px;
  }
  .desktop-search-tabs .search-tab-button-new:focus-visible {
    outline: 2px solid var(--ui-primary);
    outline-offset: 2px;
  }
  .desktop-search-tabs .tab-label {
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
  color: #211730;
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
    transition: none;
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
    transition: none;
  }
  .desktop-search-tabs .active .tab-label {
    max-width: 12rem;
    margin-left: 6px;
    opacity: 1;
  }
}
</style>
