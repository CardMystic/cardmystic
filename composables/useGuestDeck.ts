import {
  emptyGuestDecks,
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

  onMounted(() => {
    if (ready.value) return;
    try {
      drafts.value = loadGuestDecks(
        localStorage.getItem(GUEST_DECK_KEY),
        localStorage.getItem(LEGACY_GUEST_DECK_KEY),
      );
    } catch {
      storageError.value =
        'Your browser draft could not be loaded. Browser storage may be unavailable. Export your deck before leaving this page.';
    }
    ready.value = true;
  });

  function storeDrafts() {
    try {
      localStorage.setItem(GUEST_DECK_KEY, JSON.stringify(drafts.value));
      localStorage.removeItem(LEGACY_GUEST_DECK_KEY);
      storageError.value = '';
    } catch {
      storageError.value =
        'This draft could not be saved in your browser. Export it before leaving this page.';
    }
  }
  const activeIndex = computed({
    get: () => drafts.value.activeIndex,
    set: (index: number) => {
      if (
        !ready.value ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= drafts.value.decks.length
      )
        return;
      drafts.value.activeIndex = index;
      storeDrafts();
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
    if (!ready.value)
      throw new Error('Your draft is still loading. Please try again.');
    // Vue state is reactive; copy its plain data before applying the edit.
    persist(editGuestDeck(JSON.parse(JSON.stringify(draft.value)), change));
  }
  function addNames(names: string[]) {
    edit((next) => {
      for (const name of names) {
        const current = next.cards.find(
          (card) => card.name === name && card.board === 'Mainboard',
        );
        if (next.commanders.includes(name)) continue;
        setGuestCopies(next, name, 'Mainboard', (current?.quantity ?? 0) + 1);
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
  };
}
