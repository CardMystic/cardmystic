import { useMediaQuery } from '@vueuse/core';

export function useDeckSuggestionGrid() {
  const mobile = useMediaQuery('(max-width: 39.999rem)');
  const { rowCapacity } = useDeckCardGrid();
  const previewCount = computed(() => (mobile.value ? 7 : rowCapacity.value));
  const expandThreshold = computed(() =>
    mobile.value ? 2 : rowCapacity.value,
  );
  return { previewCount, expandThreshold };
}
