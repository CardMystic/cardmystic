import posthog from 'posthog-js';
import { isLocalBrowser } from '~/utils/cookieConsent';

export default defineNuxtPlugin({
  name: 'posthog',
  enforce: 'post',
  dependsOn: ['cookie-consent'],
  setup() {
    const config = useRuntimeConfig().public;
    if (
      import.meta.dev ||
      isLocalBrowser() ||
      String(config.posthogEnabled) !== 'true' ||
      !config.posthogKey
    )
      return;
    const { consent } = useCookieConsent();
    let initialized = false;
    watch(
      () => consent.value?.analytics === true,
      (allowed) => {
        if (!allowed) {
          if (initialized) posthog.opt_out_capturing();
          return;
        }
        if (!initialized) {
          posthog.init(config.posthogKey, {
            api_host: config.posthogHost,
            defaults: '2026-05-30',
            person_profiles: 'identified_only',
            capture_pageview: 'history_change',
            cross_subdomain_cookie: false,
            disable_session_recording: true,
            opt_out_capturing_by_default: true,
            opt_out_persistence_by_default: true,
          });
          initialized = true;
        }
        posthog.opt_in_capturing({ captureEventName: false });
        posthog.capture('$pageview');
      },
      { immediate: true, flush: 'sync' },
    );
  },
});
