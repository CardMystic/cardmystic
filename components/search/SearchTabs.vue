<template>
  <SearchTypeChips
    :items="items"
    :active-value="cardActive ? 'card' : searchType"
    @select="onTabClick"
  />
</template>

<script lang="ts" setup>
import type { SearchTypeChip } from './SearchTypeChips.vue';
export type SearchTabType =
  'smart' | 'similarity' | 'commander' | 'keyword' | 'recommend';

defineProps<{
  cardActive?: boolean;
}>();
const { searchType, getPath } = useSearchType();
const route = useRoute();
const { lastCard, cardRoute } = useLastOpenedCard();
const modes: { value: SearchTabType; label: string; icon: string }[] = [
  { value: 'smart', label: 'Smart Search', icon: 'i-lucide-brain' },
  {
    value: 'similarity',
    label: 'Similarity Search',
    icon: 'i-mdi-cards-outline',
  },
  { value: 'commander', label: 'Commander Search', icon: 'i-mdi-crown' },
  { value: 'keyword', label: 'Keyword Search', icon: 'i-lucide-whole-word' },
  { value: 'recommend', label: 'Deck Recommender', icon: 'i-lucide-box' },
];
const items = computed<SearchTypeChip[]>(() => [
  ...modes.map((mode) => ({
    ...mode,
    href: route.path === '/' ? undefined : getPath(mode.value),
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
  (e: 'select', type: SearchTabType): void;
}>();
function onTabClick(type: string) {
  if (
    type === 'smart' ||
    type === 'similarity' ||
    type === 'commander' ||
    type === 'keyword' ||
    type === 'recommend'
  ) {
    emit('select', type);
  }
}
</script>
