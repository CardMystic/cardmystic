<script setup lang="ts">
import { shallowRef, watch } from 'vue';
import SetSymbol from '~/components/collections/SetSymbol.vue';
import type { SiteNavigationItem } from '~/utils/site-navigation';

withDefaults(
  defineProps<{
    items: SiteNavigationItem[];
    orientation?: 'horizontal' | 'vertical';
  }>(),
  { orientation: 'horizontal' },
);

const openMenu = shallowRef<string>();
const expandedItems = shallowRef<string[]>([]);
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    openMenu.value = undefined;
    expandedItems.value = [];
  },
);

function closeOnNavigation(event: MouseEvent) {
  if ((event.target as Element).closest('a[href]')) openMenu.value = undefined;
}

function updateOpen(label: string | undefined, value: boolean) {
  if (value) openMenu.value = label;
  else if (openMenu.value === label) openMenu.value = undefined;
}
</script>

<template>
  <nav
    v-if="orientation === 'horizontal'"
    aria-label="Main navigation"
    class="flex items-center gap-0.5"
  >
    <UPopover
      v-for="item in items"
      :key="item.label"
      :open="openMenu === item.label"
      :portal="false"
      :content="{ side: 'bottom', align: 'start', sideOffset: 6 }"
      @update:open="updateOpen(item.label, $event)"
    >
      <UButton
        :label="item.label"
        :icon="item.icon"
        trailing-icon="i-lucide-chevron-down"
        color="neutral"
        variant="ghost"
        class="min-h-11 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary"
        :class="
          openMenu === item.label
            ? 'bg-elevated text-highlighted'
            : 'text-muted'
        "
      />
      <template #content>
        <UNavigationMenu
          :items="item.children"
          orientation="vertical"
          color="neutral"
          :aria-label="item.label === 'Sets' ? 'Recent sets' : item.label"
          class="w-72 max-w-[calc(100vw-2rem)] p-2"
          :ui="{
            link: 'min-h-11 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary',
            linkLabel: 'whitespace-normal',
          }"
          @click="closeOnNavigation"
        >
          <template #item-leading="{ item: child }">
            <SetSymbol
              v-if="child.setCode"
              :code="child.setCode"
              class="size-5 shrink-0"
            />
            <UIcon
              v-else-if="child.icon"
              :name="child.icon"
              class="size-5 shrink-0"
            />
          </template>
        </UNavigationMenu>
      </template>
    </UPopover>
  </nav>
  <UNavigationMenu
    v-else
    v-model="expandedItems"
    :items="items"
    orientation="vertical"
    color="neutral"
    aria-label="Main navigation"
    :ui="{
      link: 'min-h-11 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary',
      linkLabel: 'whitespace-normal',
      childLink:
        'min-h-11 items-center focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary',
      childLinkLabel: 'whitespace-normal',
    }"
  >
    <template #item-leading="{ item }">
      <SetSymbol
        v-if="item.setCode"
        :code="item.setCode"
        class="size-5 shrink-0"
      />
      <UIcon v-else-if="item.icon" :name="item.icon" class="size-5 shrink-0" />
    </template>
  </UNavigationMenu>
</template>
