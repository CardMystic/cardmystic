import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import type { CardGroup } from '~/utils/sort';

export function cardGroupKey(group: CardGroup): string {
  return group.key ?? group.label;
}

/** Preserve section choices across refreshed cards, counts, and sorting. */
export function useCardGroupExpansion(
  groups: MaybeRefOrGetter<readonly CardGroup[] | null | undefined>,
) {
  const defaultExpanded = ref(true);
  const overrides = ref<Record<string, boolean>>({});
  const keys = computed(() =>
    (toValue(groups) ?? []).filter((group) => group.label).map(cardGroupKey),
  );

  const openValues = computed({
    get: () =>
      keys.value.filter((key) => overrides.value[key] ?? defaultExpanded.value),
    set: (open: string[]) => {
      const selected = new Set(open);
      for (const key of keys.value) overrides.value[key] = selected.has(key);
    },
  });

  function setAll(expanded: boolean) {
    // The explicit global choice also applies to groups introduced by later edits.
    defaultExpanded.value = expanded;
    overrides.value = {};
  }

  return {
    openValues,
    expandAll: () => setAll(true),
    collapseAll: () => setAll(false),
  };
}
