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
    let posthog: typeof import('posthog-js').default | undefined;
    let loading: Promise<typeof import('posthog-js')> | undefined;
    let initialized = false;
    let consentVersion = 0;
    watch(
      () => consent.value?.analytics === true,
      async (allowed) => {
        const version = ++consentVersion;
        if (!allowed) {
          if (initialized) posthog?.opt_out_capturing();
          return;
        }
        if (!posthog) {
          try {
            loading ??= import('posthog-js');
            const module = await loading;
            // Consent can change while the SDK downloads, including rapid toggles.
            if (version !== consentVersion || !consent.value?.analytics) return;
            posthog = module.default;
          } catch {
            loading = undefined;
            return;
          }
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
