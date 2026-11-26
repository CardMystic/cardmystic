import { parseDecklist } from '~/utils/decklist';
import { hasInjectionContext, inject, provide, type InjectionKey } from 'vue';

const deckbuilderKey: InjectionKey<ReturnType<typeof createDeckbuilder>> =
  Symbol('deckbuilder');

export const useDeckbuilder = () => {
  const shared = hasInjectionContext() ? inject(deckbuilderKey, null) : null;
  return shared ?? createDeckbuilder();
};

// Share the parsed deck and query/mutation observers across all result cards.
export const provideDeckbuilder = () => {
  const deckbuilder = useDeckbuilder();
  provide(deckbuilderKey, deckbuilder);
  return deckbuilder;
};

const createDeckbuilder = () => {
  const decklist = useState<string>('deckbuilder-decklist', () => '');
  const showSaveAllModal = useState<boolean>(
    'deckbuilder-showSaveAllModal',
    () => false,
  );

  const cardNames = computed(() => {
    if (!decklist.value.trim()) return new Set<string>();
    return new Set(parseDecklist(decklist.value));
  });

  const selectedDeckId = useState<string>(
    'recommender-selected-deck',
    () => '',
  );
  const savedDeckReady = useState<boolean>(
    'recommender-deck-ready',
    () => false,
  );
  const pendingCards = useState<string[]>(
    'recommender-pending-cards',
    () => [],
  );
  const rerun = useState<number>('recommender-rerun', () => 0);
  const { addCardsByNameToListMutation } = useCardLists();
  const toast = useToast();

  async function addCard(cardName: string) {
    if (hasCard(cardName) || pendingCards.value.includes(cardName)) return;
    const target = selectedDeckId.value;
    if (target) {
      if (!savedDeckReady.value) return;
      pendingCards.value = [...pendingCards.value, cardName];
      try {
        const result = await addCardsByNameToListMutation.mutateAsync({
          listId: target,
          cardNames: [cardName],
          board: 'Mainboard',
        });
        if (result.invalidCardNames.length)
          throw new Error('Card could not be added.');
        if (selectedDeckId.value !== target) return;
      } catch {
        toast.add({
          title: 'Could not add card to deck',
          description: 'Please try again.',
          color: 'error',
        });
        return;
      } finally {
        pendingCards.value = pendingCards.value.filter(
          (name) => name !== cardName,
        );
      }
    }
    if (hasCard(cardName)) return;
    const current = decklist.value.trim();
    decklist.value = current ? `${current}\n${cardName}` : cardName;
  }

  function hasCard(cardName: string) {
    return cardNames.value.has(cardName);
  }

  return {
    decklist,
    cardNames,
    addCard,
    hasCard,
    showSaveAllModal,
    selectedDeckId,
    savedDeckReady,
    pendingCards,
    rerun,
  };
};
