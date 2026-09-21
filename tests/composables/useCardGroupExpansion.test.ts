import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { CardGroup } from '~/utils/sort';
import { useCardGroupExpansion } from '~/composables/useCardGroupExpansion';

const group = (key: string, label = key): CardGroup => ({
  key,
  label,
  cards: [],
});

describe('card group expansion', () => {
  it('keeps manual choices when a refresh changes counts or sorting', () => {
    const groups = ref([group('type:Creature'), group('type:Instant')]);
    const { openValues } = useCardGroupExpansion(groups);
    openValues.value = ['type:Instant'];

    groups.value = [
      group('type:Instant', 'Instants (3 cards) — $4.00'),
      group('type:Creature', 'Creatures (2 cards) — $6.00'),
    ];
    expect(openValues.value).toEqual(['type:Instant']);
  });

  it('restores a collapsed section after it temporarily disappears', () => {
    const groups = ref([group('color:Blue')]);
    const { openValues } = useCardGroupExpansion(groups);
    openValues.value = [];
    groups.value = [];
    expect(openValues.value).toEqual([]);
    groups.value = [group('color:Blue', 'Blue (2 cards)')];
    expect(openValues.value).toEqual([]);
  });

  it('keeps newly added sections closed after Collapse All', () => {
    const groups = ref([group('type:Creature')]);
    const { openValues, collapseAll } = useCardGroupExpansion(groups);
    collapseAll();
    groups.value = [group('type:Creature'), group('type:Instant')];
    expect(openValues.value).toEqual([]);

    // Reopening one section does not undo the policy for future sections.
    openValues.value = ['type:Instant'];
    groups.value.push(group('type:Land'));
    expect(openValues.value).toEqual(['type:Instant']);
  });

  it('Expand All clears previous exceptions and opens future sections', () => {
    const groups = ref([group('type:Creature'), group('type:Instant')]);
    const { openValues, expandAll, collapseAll } =
      useCardGroupExpansion(groups);
    collapseAll();
    openValues.value = ['type:Instant'];
    expandAll();
    groups.value.push(group('type:Land'));
    expect(openValues.value).toEqual([
      'type:Creature',
      'type:Instant',
      'type:Land',
    ]);
  });
});
