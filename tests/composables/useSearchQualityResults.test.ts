import { describe, expect, it } from 'vitest';
import { ref, shallowRef } from 'vue';
import { useSearchQualityResults } from '~/composables/useSearchQualityResults';

type Result = { name: string; ai_normalized_score?: number };
const sample = (): Result[] => [
  { name: 'best', ai_normalized_score: 1 },
  { name: 'close', ai_normalized_score: 0.9 },
  { name: 'tail', ai_normalized_score: 0.2 },
];

describe('search quality result state', () => {
  it('reveals the cached tail in original order without modifying cards', () => {
    const cards = sample().map((card) => Object.freeze(card));
    const raw = shallowRef(cards);
    const state = useSearchQualityResults(raw, ['smart', 'draw'], {
      mode: 'smart',
    });
    expect(state.results.value).toEqual(cards.slice(0, 2));
    expect(state.hiddenResultCount.value).toBe(1);

    state.loadMoreResults();
    expect(state.results.value).toEqual(cards);
    expect(state.results.value?.[2]).toBe(cards[2]);
    expect(state.hiddenResultCount.value).toBe(0);
    expect(raw.value).toBe(cards);
    state.loadMoreResults();
    expect(state.results.value).toEqual(cards);
  });

  it('resets synchronously for changed filters without showing an expanded new query', () => {
    const raw = shallowRef(sample());
    const filters = ref({ color: 'blue' });
    const state = useSearchQualityResults(
      raw,
      () => ['smart', 'draw', filters.value],
      { mode: 'smart' },
    );
    state.loadMoreResults();
    expect(state.results.value).toHaveLength(3);

    filters.value.color = 'red';
    // No nextTick: the new query must already be back to its initial cutoff.
    expect(state.results.value).toHaveLength(2);
    expect(state.hiddenResultCount.value).toBe(1);
  });

  it('starts with the cutoff again when returning to previously expanded cached results', () => {
    const query = ref('first');
    const firstCards = sample();
    const secondCards = [{ name: 'different', ai_normalized_score: 0.8 }];
    const raw = shallowRef(firstCards);
    const state = useSearchQualityResults(raw, () => ['smart', query.value], {
      mode: 'smart',
    });
    state.loadMoreResults();
    query.value = 'second';
    raw.value = secondCards;
    expect(state.results.value).toEqual(secondCards);

    query.value = 'first';
    raw.value = firstCards;
    expect(state.results.value).toEqual(firstCards.slice(0, 2));
    expect(state.hiddenResultCount.value).toBe(1);
  });

  it('keeps the current query expanded through refreshes and equivalent query objects', () => {
    const query = ref({
      query: 'draw',
      filters: { color: 'blue', format: 'Any' },
    });
    const raw = shallowRef<Result[] | undefined>(sample());
    const state = useSearchQualityResults(raw, () => ['smart', query.value], {
      mode: 'smart',
    });
    state.loadMoreResults();
    query.value = { filters: { format: 'Any', color: 'blue' }, query: 'draw' };
    raw.value = undefined;
    expect(state.results.value).toBeUndefined();
    expect(state.hiddenResultCount.value).toBe(0);

    raw.value = [...sample(), { name: 'new tail', ai_normalized_score: 0.1 }];
    expect(state.results.value).toEqual(raw.value);
    expect(state.hiddenResultCount.value).toBe(0);
  });
});
