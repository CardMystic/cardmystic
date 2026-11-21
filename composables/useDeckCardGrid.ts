import { useMediaQuery } from '@vueuse/core';

export const deckCardGridClasses = 'card-grid grid gap-2';

export function useDeckCardGrid() {
  const { size } = useCardSize();
  const desktop = useMediaQuery('(min-width: 80rem)');
  const large = useMediaQuery('(min-width: 64rem)');
  const small = useMediaQuery('(min-width: 40rem)');
  const rowCapacity = computed(
    () =>
      (desktop.value ? 7 : large.value ? 4 : small.value ? 3 : 2) +
      (size.value === 'small' ? 1 : size.value === 'large' ? -1 : 0),
  );
  return { rowCapacity, gridClasses: deckCardGridClasses };
}
