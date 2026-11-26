import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, shallowRef, type Ref } from 'vue';
import type { DecklistSummary } from '~/models/cardListModel';
import { useLatestCommanderDeck } from '~/composables/useLatestCommanderDeck';

const userId = ref<string | null>(null);
const authLoading = ref(true);
const commander = ref<string | undefined>("Atraxa, Praetors' Voice");
const lists = {
  decklists: shallowRef<DecklistSummary[]>([]),
  isLoading: ref(false),
  isFetching: ref(false),
  isSuccess: ref(false),
  isPlaceholderData: ref(false),
  resolvedPage: ref<number>(),
  totalPages: ref(1),
  error: shallowRef<Error | null>(null),
};
let page: Ref<number>;
let enabled: Ref<boolean>;
let scope: ReturnType<typeof effectScope>;
const useLists = vi.fn();
const cardDeck = (id: string, names = ["Atraxa, Praetors' Voice"]) =>
  ({ id, commanders: names, user_id: userId.value }) as DecklistSummary;
function start() {
  return scope.run(() => useLatestCommanderDeck(commander))!;
}
async function resolvePage(
  index: number,
  decks: DecklistSummary[],
  totalPages = 1,
) {
  lists.decklists.value = decks;
  lists.resolvedPage.value = index;
  lists.totalPages.value = totalPages;
  lists.isSuccess.value = true;
  lists.isPlaceholderData.value =
    lists.isFetching.value =
    lists.isLoading.value =
      false;
  await nextTick();
}

beforeEach(() => {
  userId.value = null;
  authLoading.value = true;
  commander.value = "Atraxa, Praetors' Voice";
  lists.decklists.value = [];
  lists.isLoading.value =
    lists.isFetching.value =
    lists.isSuccess.value =
    lists.isPlaceholderData.value =
      false;
  lists.resolvedPage.value = undefined;
  lists.totalPages.value = 1;
  lists.error.value = null;
  useLists
    .mockReset()
    .mockImplementation((currentPage, size, options, active) => {
      page = currentPage;
      enabled = active;
      expect(size).toBe(50);
      expect(options.value).toEqual({
        kind: 'deck',
        folder: '',
        sort: 'updated_at',
        direction: 'desc',
      });
      return lists;
    });
  vi.stubGlobal('useUserProfile', () => ({ userId, loading: authLoading }));
  vi.stubGlobal('useMyDecklists', useLists);
  scope = effectScope();
});
afterEach(() => {
  scope.stop();
  vi.unstubAllGlobals();
});

it('waits for auth and the first successful query instead of treating idle data as an empty result', async () => {
  const selection = start();
  expect(selection.pending.value).toBe(true);
  expect(enabled.value).toBe(false);
  userId.value = 'owner';
  await nextTick();
  expect(enabled.value).toBe(false);
  authLoading.value = false;
  await nextTick();
  expect(enabled.value).toBe(true);
  expect(selection.pending.value).toBe(true);
  const newest = cardDeck('newest', ['Partner', " ATRAXA, PRAETORS' VOICE "]);
  await resolvePage(
    1,
    [cardDeck('unrelated', ['Another commander']), newest, cardDeck('older')],
    4,
  );
  expect(selection.deck.value).toEqual(newest);
  expect(page.value).toBe(1);
  expect(enabled.value).toBe(false);
  expect(selection.pending.value).toBe(false);
});

it('scans each page in order and ignores previous-page placeholders until the next page arrives', async () => {
  userId.value = 'owner';
  authLoading.value = false;
  const selection = start();
  await resolvePage(1, [cardDeck('unrelated', ['Other'])], 3);
  expect(page.value).toBe(2);
  lists.decklists.value = [cardDeck('stale')];
  lists.isPlaceholderData.value = true;
  await nextTick();
  expect(selection.deck.value).toBeNull();
  expect(page.value).toBe(2);
  lists.isPlaceholderData.value = false;
  await nextTick();
  expect(selection.deck.value).toBeNull();
  await resolvePage(2, [], 3);
  expect(page.value).toBe(3);
  const match = cardDeck('page-three');
  await resolvePage(3, [match], 4);
  expect(selection.deck.value).toEqual(match);
  expect(page.value).toBe(3);
  expect(selection.pending.value).toBe(false);
});

it('falls back only after the last successful page, a query failure, or resolved signed-out auth', async () => {
  const selection = start();
  authLoading.value = false;
  await nextTick();
  expect(selection.pending.value).toBe(false);
  expect(enabled.value).toBe(false);
  userId.value = 'owner';
  await nextTick();
  await resolvePage(1, [], 2);
  expect(selection.pending.value).toBe(true);
  await resolvePage(2, [], 2);
  expect(selection.pending.value).toBe(false);
  expect(selection.deck.value).toBeNull();
  commander.value = 'Other';
  lists.isSuccess.value = false;
  lists.error.value = new Error('offline');
  await nextTick();
  expect(selection.pending.value).toBe(false);
  expect(selection.deck.value).toBeNull();
});

it('clears selected decks synchronously on account or commander changes and restarts at page one', async () => {
  userId.value = 'first';
  authLoading.value = false;
  const selection = start();
  await resolvePage(1, [], 2);
  await resolvePage(2, [cardDeck('old-account')], 2);
  expect(selection.deck.value?.id).toBe('old-account');
  // Model the query observer invalidating its result when its account key changes.
  lists.isSuccess.value = false;
  lists.isFetching.value = true;
  userId.value = 'second';
  expect(selection.deck.value).toBeNull();
  expect(page.value).toBe(1);
  await nextTick();
  expect(selection.pending.value).toBe(true);
  await resolvePage(1, [cardDeck('new-account')]);
  expect(selection.deck.value?.id).toBe('new-account');
  commander.value = 'Different commander';
  expect(selection.deck.value).toBeNull();
  await nextTick();
  expect(selection.pending.value).toBe(false);
  expect(selection.deck.value).toBeNull();
  userId.value = null;
  expect(selection.deck.value).toBeNull();
});

it('does not scan or remain pending for an empty commander', () => {
  commander.value = '  ';
  userId.value = 'owner';
  const selection = start();
  expect(enabled.value).toBe(false);
  expect(selection.pending.value).toBe(false);
});
