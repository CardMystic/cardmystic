import {
  COOKIE_CONSENT_KEY,
  clearTrackingStorage,
  type CookieConsent,
} from '~/utils/cookieConsent';

export function useCookieConsent() {
  const consent = useState<CookieConsent | null>('cookie-consent', () => null);
  const ready = useState('cookie-consent-ready', () => false);
  const settingsOpen = useState('cookie-settings-open', () => false);
  const storageError = useState('cookie-consent-storage-error', () => false);

  function save(choices: Pick<CookieConsent, 'analytics' | 'advertising'>) {
    const previous = consent.value;
    const value = { ...choices, updatedAt: Date.now() };
    storageError.value = false;
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
    } catch {
      storageError.value = true;
    }
    consent.value = value;
    settingsOpen.value = false;
    if (!choices.analytics) clearTrackingStorage('analytics');
    if (!choices.advertising) clearTrackingStorage('advertising');
    // Reload to completely unload SDKs after withdrawing an existing permission.
    if (
      !storageError.value &&
      ((previous?.analytics && !choices.analytics) ||
        (previous?.advertising && !choices.advertising))
    ) {
      window.location.reload();
    }
  }

  return { consent, ready, settingsOpen, storageError, save };
}
