import {
  COOKIE_CONSENT_KEY,
  clearTrackingStorage,
  readCookieConsent,
} from '~/utils/cookieConsent';

export default defineNuxtPlugin({
  name: 'cookie-consent',
  setup() {
    const { consent, ready } = useCookieConsent();
    consent.value = readCookieConsent();
    if (!consent.value?.analytics) clearTrackingStorage('analytics');
    if (!consent.value?.advertising) clearTrackingStorage('advertising');
    ready.value = true;
    window.addEventListener('storage', (event) => {
      if (event.key === COOKIE_CONSENT_KEY || event.key === null)
        window.location.reload();
    });
  },
});
