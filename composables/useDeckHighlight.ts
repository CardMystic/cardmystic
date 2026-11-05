import type { Ref, ComputedRef } from 'vue';
import type { ScryfallCard } from '~/models/cardModel';
import { cardHighlight, type DeckHighlightMode } from '~/utils/deckHighlight';
export function useDeckHighlight(card: () => ScryfallCard) {
  const context = inject<{
    mode: Ref<DeckHighlightMode>;
    target: Ref<string>;
    quantities: Ref<Record<string, number> | null>;
    required: ComputedRef<Record<string, number>>;
  }>('deckHighlight', undefined);
  const highlight = computed(() => {
    const mode = context?.mode.value ?? 'none';
    if (mode !== 'owned')
      return cardHighlight(card(), mode, context?.target.value ?? '');
    if (!context?.quantities.value) return { status: null, classes: '' };
    const owned = context.quantities.value[card().oracle_id] ?? 0;
    const needed = context.required.value[card().oracle_id] ?? 1;
    return owned >= needed
      ? {
          status: 'Owned',
          classes: 'bg-success/25 ring-2 ring-inset ring-success',
        }
      : owned > 0
        ? {
            status: `Own ${owned} of ${needed}`,
            classes: 'bg-warning/25 ring-2 ring-inset ring-warning',
          }
        : {
            status: 'Not owned',
            classes: 'bg-error/25 ring-2 ring-inset ring-error',
          };
  });
  return {
    status: computed(() => highlight.value.status),
    classes: computed(() => highlight.value.classes),
  };
}
