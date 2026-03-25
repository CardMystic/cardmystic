import { parseDecklist } from '~/utils/decklist';

const decklist = ref('');
const showSaveAllModal = ref(false);

const cardNames = computed(() => {
  if (!decklist.value.trim()) return new Set<string>();
  return new Set(parseDecklist(decklist.value));
});

export const useDeckbuilder = () => {
  function addCard(cardName: string) {
    const current = decklist.value.trim();
    decklist.value = current ? `${current}\n${cardName}` : cardName;
  }

  function hasCard(cardName: string) {
    return cardNames.value.has(cardName);
  }

  return { decklist, cardNames, addCard, hasCard, showSaveAllModal };
};
