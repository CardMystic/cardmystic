const STORAGE_KEY = 'last_opened_card';

export type CardOrigin = 'search' | 'explore';

interface LastOpenedCard {
  id: string;
  name: string;
  origin: CardOrigin;
}

export function useLastOpenedCard() {
  const lastCard = useState<LastOpenedCard | null>(
    'lastOpenedCard',
    () => null,
  );

  // Restore from sessionStorage after mount to avoid SSR hydration mismatch.
  // During SSR lastCard is null; the client must also start null, then update after mount.
  onMounted(() => {
    if (!lastCard.value) {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          lastCard.value = JSON.parse(stored);
        }
      } catch {
        /* ignore */
      }
    }
  });

  function setLastOpenedCard(id: string, name: string, origin: CardOrigin) {
    lastCard.value = { id, name, origin };
    if (import.meta.client) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ id, name, origin }),
        );
      } catch {
        /* ignore */
      }
    }
  }

  const cardRoute = computed(() =>
    lastCard.value ? `/card/${lastCard.value.id}` : undefined,
  );

  return {
    lastCard: readonly(lastCard),
    setLastOpenedCard,
    cardRoute,
  };
}
