import { isLocalBrowser } from '~/utils/cookieConsent';

export default defineNuxtPlugin({
  name: 'google-ads',
  enforce: 'post',
  dependsOn: ['cookie-consent'],
  setup() {
    if (import.meta.dev || isLocalBrowser()) return;
    const { consent } = useCookieConsent();
    let loaded = false;
    const enqueue: (...args: unknown[]) => void = function () {
      // Google expects the standard gtag arguments queue.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    watch(
      () => consent.value?.advertising === true,
      (allowed) => {
        if (!allowed) {
          if (loaded)
            enqueue('consent', 'update', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
            });
          return;
        }
        if (loaded) {
          enqueue('consent', 'update', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'denied',
          });
          return;
        }
        loaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args: unknown[]) => {
          if (consent.value?.advertising) enqueue(...args);
        };
        enqueue('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
        enqueue('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'denied',
        });
        enqueue('js', new Date());
        enqueue('config', 'AW-17812762149', {
          allow_ad_personalization_signals: false,
        });
        const script = document.createElement('script');
        script.async = true;
        script.src =
          'https://www.googletagmanager.com/gtag/js?id=AW-17812762149';
        document.head.appendChild(script);
      },
      { immediate: true, flush: 'sync' },
    );
  },
});
