const STORAGE_KEY = 'last_opened_card';

export type CardOrigin = 'search' | 'explore';

interface LastOpenedCard {
  oracleId: string;
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
          const parsed = JSON.parse(stored);
          // Skip pre-cutover entries (which used `id` for the printing id).
          if (parsed && typeof parsed.oracleId === 'string') {
            lastCard.value = parsed;
          }
        }
      } catch {
        /* ignore */
      }
    }
  });

  function setLastOpenedCard(
    oracleId: string,
    name: string,
    origin: CardOrigin,
  ) {
    lastCard.value = { oracleId, name, origin };
    if (import.meta.client) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ oracleId, name, origin }),
        );
      } catch {
        /* ignore */
      }
    }
  }

  const cardRoute = computed(() =>
    lastCard.value ? `/card/${lastCard.value.oracleId}` : undefined,
  );

  return {
    lastCard: readonly(lastCard),
    setLastOpenedCard,
    cardRoute,
  };
}
