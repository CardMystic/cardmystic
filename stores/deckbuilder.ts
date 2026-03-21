import { parseDecklist } from '~/utils/decklist';

export const useDeckbuilderStore = defineStore('deckbuilder', () => {
  const decklist = ref('');

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

  return { decklist, cardNames, addCard, hasCard };
});
