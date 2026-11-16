import { readGuestDefaultPrinting } from '~/utils/guestDefaultPrinting';
import {
  emptyGuestDecks,
  guestDecksSchema,
  editGuestDeck,
  loadGuestDecks,
  GUEST_DECK_KEY,
  LEGACY_GUEST_DECK_KEY,
  setGuestCopies,
  type GuestDeck,
} from '~/utils/guestDeck';

/** One browser draft, retaining any older saved drafts for recovery. */
export function useGuestDeck() {
  const drafts = useState('guest-decks', emptyGuestDecks);
  const draft = computed(() => drafts.value.decks[drafts.value.activeIndex]!);
  const ready = useState('guest-deck-ready', () => false);
  const storageError = useState('guest-deck-storage-error', () => '');

  const savedValue = useState<string | null>(
    'guest-deck-storage-value',
    () => null,
  );
  const unsaved = useState('guest-deck-unsaved', () => false);

  function refreshFromStorage() {
    const value = localStorage.getItem(GUEST_DECK_KEY);
    if (ready.value && value === savedValue.value) return;
    if (unsaved.value)
      throw new Error(
        'Another tab changed this draft. Export your unsaved edits before reloading.',
      );
    const previousIndex = drafts.value.activeIndex;
    const next =
      ready.value && value
        ? guestDecksSchema.parse(JSON.parse(value))
        : loadGuestDecks(value, localStorage.getItem(LEGACY_GUEST_DECK_KEY));
    if (ready.value)
      next.activeIndex = Math.min(previousIndex, next.decks.length - 1);
    drafts.value = next;
    savedValue.value = value;
  }
  function sync() {
    try {
      refreshFromStorage();
    } catch (error) {
      storageError.value =
        unsaved.value && error instanceof Error
          ? error.message
          : 'Your browser draft could not be loaded. Export your deck before leaving this page.';
    }
  }
  function storageChanged(event: StorageEvent) {
    if (event.key === GUEST_DECK_KEY || event.key === null) sync();
  }
  onMounted(() => {
    sync();
    ready.value = true;
    if (typeof window !== 'undefined')
      window.addEventListener('storage', storageChanged);
  });
  if (typeof window !== 'undefined')
    onBeforeUnmount(() =>
      window.removeEventListener('storage', storageChanged),
    );

  function storeDrafts() {
    try {
      const value = JSON.stringify(drafts.value);
      localStorage.setItem(GUEST_DECK_KEY, value);
      savedValue.value = value;
      unsaved.value = false;
      localStorage.removeItem(LEGACY_GUEST_DECK_KEY);
      storageError.value = '';
    } catch {
      unsaved.value = true;
      storageError.value =
        'This draft could not be saved in your browser. Export it before leaving this page.';
    }
  }

  async function withDraftLock<T>(action: () => T | Promise<T>): Promise<T> {
    const run = async () => {
      if (!ready.value)
        throw new Error('Your draft is still loading. Please try again.');
      // Read under the same lock as the write, even if the storage event is still queued.
      try {
        refreshFromStorage();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'SecurityError'))
          throw error;
      }
      return action();
    };
    return globalThis.navigator?.locks
      ? navigator.locks.request(GUEST_DECK_KEY, run)
      : run();
  }
  const activeIndex = computed({
    get: () => drafts.value.activeIndex,
    set: (index: number) => {
      void withDraftLock(() => {
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= drafts.value.decks.length
        )
          return;
        drafts.value.activeIndex = index;
        storeDrafts();
      }).catch((error: Error) => {
        storageError.value = error.message;
      });
    },
  });
  const draftOptions = computed(() =>
    drafts.value.decks.map((deck, index) => ({
      label: `${index + 1}. ${deck.name.trim() || 'Untitled deck'}`,
      value: index,
    })),
  );
  const hasDrafts = computed(() =>
    drafts.value.decks.some((deck) => deck.cards.length > 0),
  );
  function persist(next: GuestDeck) {
    drafts.value.decks[drafts.value.activeIndex] = next;
    storeDrafts();
  }
  function edit(change: (next: GuestDeck) => void) {
    return withDraftLock(() => {
      persist(editGuestDeck(JSON.parse(JSON.stringify(draft.value)), change));
    });
  }
  function addNames(names: string[]) {
    return edit((next) => {
      for (const name of names) {
        const current = next.cards.find(
          (card) => card.name === name && card.board === 'Mainboard',
        );
        if (next.commanders.includes(name)) continue;
        setGuestCopies(
          next,
          name,
          'Mainboard',
          (current?.quantity ?? 0) + 1,
          readGuestDefaultPrinting(name),
        );
      }
    });
  }
  return {
    draft,
    activeIndex,
    draftOptions,
    hasDrafts,
    ready,
    storageError,
    edit,
    addNames,
    persist,
    withDraftLock,
  };
}
