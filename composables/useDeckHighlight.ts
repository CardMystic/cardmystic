import type { Ref, ComputedRef, InjectionKey } from 'vue';
import type { ScryfallCard } from '~/models/cardModel';
import {
  cardHighlight,
  type DeckHighlightMode,
  type DeckCardLabels,
  type VisibleLabelGroup,
} from '~/utils/deckHighlight';
export const deckCardLabelsKey: InjectionKey<{
  showMetadata: ComputedRef<boolean>;
  labels: ComputedRef<Record<string, DeckCardLabels>>;
  visible: ComputedRef<VisibleLabelGroup[]>;
  loading: ComputedRef<VisibleLabelGroup[]>;
}> = Symbol('deckCardLabels');

// Keep the card that launched a dialog mounted while its tags change groups.
export const deckTagDialogCountKey: InjectionKey<Ref<number>> =
  Symbol('deckTagDialogs');
export function useHoldTagGrouping(open: () => boolean) {
  const count = inject(deckTagDialogCountKey, null);
  if (count)
    watch(
      open,
      (isOpen, _, onCleanup) => {
        if (!isOpen) return;
        count.value++;
        onCleanup(() => {
          count.value--;
        });
      },
      { immediate: true },
    );
}
export function useDeckHighlight(card: () => ScryfallCard) {
  const metadata = inject(deckCardLabelsKey, undefined);
  const context = inject<{
    mode: Ref<DeckHighlightMode>;
    target: Ref<string>;
    quantities: Ref<Record<string, number> | null>;
    required: ComputedRef<Record<string, number>>;
  }>('deckHighlight', undefined);
  const highlight = computed(() => {
    const mode = context?.mode.value ?? 'none';
    if (mode !== 'owned')
      return cardHighlight(
        card(),
        mode,
        context?.target.value ?? '',
        metadata?.labels.value[card().oracle_id],
      );
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
