import { useBreakpoints } from '@vueuse/core';

export const deckCardGridClasses =
  'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2';

export function useDeckCardGrid() {
  const breakpoints = useBreakpoints({ sm: 640, lg: 1024, xl: 1280 });
  const desktop = breakpoints.greaterOrEqual('xl');
  const large = breakpoints.greaterOrEqual('lg');
  const small = breakpoints.greaterOrEqual('sm');
  const rowCapacity = computed(() =>
    desktop.value ? 7 : large.value ? 4 : small.value ? 3 : 2,
  );
  return { rowCapacity, gridClasses: deckCardGridClasses };
}
