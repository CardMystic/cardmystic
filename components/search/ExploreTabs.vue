<template>
  <SearchTypeChips
    :items="items"
    :active-value="cardActive ? 'card' : statsType"
    @select="onTabClick"
  />
</template>

<script lang="ts" setup>
import type { SearchTypeChip } from './SearchTypeChips.vue';

export type ExploreTabType =
  | 'popular-cards'
  | 'popular-commanders'
  | 'popular-by-commander'
  | 'popular-by-card';

defineProps<{
  statsType: ExploreTabType;
  cardActive?: boolean;
}>();

const { lastCard, cardRoute } = useLastOpenedCard();
const route = useRoute();
const modes = [
  {
    value: 'popular-cards',
    label: 'Popular Commander Cards',
    icon: 'i-lucide-chart-no-axes-combined',
  },
  {
    value: 'popular-commanders',
    label: 'Popular Commanders',
    icon: 'i-mdi-crown',
  },
  {
    value: 'popular-by-commander',
    label: 'Cards by Commander',
    icon: 'i-lucide-flame',
  },
  {
    value: 'popular-by-card',
    label: 'Commanders by Card',
    icon: 'i-lucide-crown',
  },
];
const items = computed<SearchTypeChip[]>(() => [
  ...modes.map((mode) => ({
    ...mode,
    href: `/${mode.value}/${route.params.platform || 'all'}`,
  })),
  ...(lastCard.value && cardRoute.value
    ? [
        {
          value: 'card',
          label: lastCard.value.name,
          icon: 'i-heroicons-rectangle-stack',
          to: cardRoute.value,
          card: true,
        },
      ]
    : []),
]);

const emit = defineEmits<{
  (e: 'select', type: ExploreTabType): void;
}>();

function onTabClick(type: string) {
  if (
    type === 'popular-cards' ||
    type === 'popular-commanders' ||
    type === 'popular-by-commander' ||
    type === 'popular-by-card'
  ) {
    emit('select', type);
  }
}
</script>
