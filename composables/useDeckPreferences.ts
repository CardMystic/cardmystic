import {
  computed,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import {
  DeckPreferencesSchema,
  defaultDeckPreferences,
  type DeckPreferences,
} from '~/models/preferencesModel';

export const DECK_PREFERENCES_STORAGE_PREFIX = 'cm.deck-preferences.v1:';

export function useDeckPreferences(deckId: MaybeRefOrGetter<string>) {
  const id = computed(() => toValue(deckId));
  const preferences = ref<DeckPreferences>({ ...defaultDeckPreferences });
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  function restorePreferences() {
    preferences.value = { ...defaultDeckPreferences };
    error.value = null;
    if (isLoading.value || !id.value) return;

    let saved: string | null;
    try {
      saved = localStorage.getItem(DECK_PREFERENCES_STORAGE_PREFIX + id.value);
    } catch {
      error.value =
        'Saved display settings could not be loaded. Changes will apply to this visit.';
      return;
    }
    if (!saved) return;
    try {
      const stored: unknown = JSON.parse(saved);
      // The former simple view is now Card Grid; keep the deck's other choices.
      if (
        stored &&
        typeof stored === 'object' &&
        'deck_view' in stored &&
        stored.deck_view === 'simple'
      ) {
        stored.deck_view = 'grid';
      }
      const parsed = DeckPreferencesSchema.safeParse(stored);
      if (parsed.success) preferences.value = parsed.data;
    } catch {
      // Corrupt browser data must not prevent viewing or changing a deck.
    }
  }

  // Read browser settings after hydration so the server and initial client agree.
  onMounted(() => {
    isLoading.value = false;
    restorePreferences();
  });
  watch(id, restorePreferences, { flush: 'sync' });

  function updatePreferences(patch: Partial<DeckPreferences>) {
    if (isLoading.value || !id.value) return;
    preferences.value = {
      ...preferences.value,
      ...DeckPreferencesSchema.partial().parse(patch),
    };
    try {
      const key = DECK_PREFERENCES_STORAGE_PREFIX + id.value;
      const isDefault = Object.entries(defaultDeckPreferences).every(
        ([setting, value]) =>
          preferences.value[setting as keyof DeckPreferences] === value,
      );
      if (isDefault) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(preferences.value));
      }
      error.value = null;
    } catch {
      error.value =
        'Display settings could not be saved in this browser. Changes will apply to this visit.';
    }
  }

  return { preferences, isLoading, error, updatePreferences };
}
