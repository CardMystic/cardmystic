import { parseDecklist } from '~/utils/decklist';

export const useDeckbuilder = () => {
  const decklist = useState<string>('deckbuilder-decklist', () => '');
  const showSaveAllModal = useState<boolean>(
    'deckbuilder-showSaveAllModal',
    () => false,
  );

  const cardNames = computed(() => {
    if (!decklist.value.trim()) return new Set<string>();
    return new Set(parseDecklist(decklist.value));
  });

  function addCard(cardName: string) {
    const current = decklist.value.trim();
    decklist.value = current ? `${current}\n${cardName}` : cardName;
  }

  function hasCard(cardName: string) {
    return cardNames.value.has(cardName);
  }

  return { decklist, cardNames, addCard, hasCard, showSaveAllModal };
};
