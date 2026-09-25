import { isLocalBrowser } from '~/utils/cookieConsent';

export default defineNuxtPlugin((nuxtApp) => {
  if (
    import.meta.dev ||
    isLocalBrowser() ||
    !['cardmystic.com', 'www.cardmystic.com'].includes(window.location.hostname)
  )
    return;
  const config = useRuntimeConfig();
  let mounted = false;
  let recordedDay = '';
  let pending = false;
  let lastAttempt = 0;
  async function recordVisit() {
    const day = new Date().toISOString().slice(0, 10);
    if (
      !mounted ||
      document.visibilityState !== 'visible' ||
      !document.hasFocus() ||
      navigator.webdriver ||
      pending ||
      recordedDay === day ||
      Date.now() - lastAttempt < 60_000
    )
      return;
    pending = true;
    lastAttempt = Date.now();
    try {
      const response = await fetch(
        `${config.public.backendPath}/metrics/visit`,
        { method: 'POST', credentials: 'omit' },
      );
      if (response.ok) recordedDay = day;
    } catch {
      /* Best-effort aggregate measurement must never interrupt browsing. */
    } finally {
      pending = false;
    }
  }
  nuxtApp.hook('app:mounted', () => {
    mounted = true;
    window.setTimeout(recordVisit, 2000);
    window.addEventListener('focus', recordVisit);
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (event.isTrusted) void recordVisit();
      },
      { passive: true },
    );
    document.addEventListener('keydown', (event) => {
      if (event.isTrusted) void recordVisit();
    });
    document.addEventListener('visibilitychange', recordVisit);
  });
  nuxtApp.hook('page:finish', () => {
    void recordVisit();
  });
});
