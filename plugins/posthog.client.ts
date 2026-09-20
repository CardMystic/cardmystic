import posthog from 'posthog-js';

export default defineNuxtPlugin({
  name: 'posthog',
  // Auth removes OAuth tokens from the URL before analytics can capture it.
  enforce: 'post',
  setup() {
    const config = useRuntimeConfig().public;
    const hostname = window.location.hostname;
    const isLocalhost =
      ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname) ||
      hostname.endsWith('.localhost');

    // Keep development, local previews, and disabled deployments out of analytics.
    if (
      import.meta.dev ||
      isLocalhost ||
      String(config.posthogEnabled) !== 'true' ||
      !config.posthogKey
    ) {
      return;
    }

    posthog.init(config.posthogKey, {
      api_host: config.posthogHost,
      defaults: '2026-05-30',
      person_profiles: 'identified_only',
      // Includes the initial page and subsequent Nuxt router navigations.
      capture_pageview: 'history_change',
      // Keep production and next.cardmystic.com sessions separate.
      cross_subdomain_cookie: false,
      // Account identification and session replay are outside this integration.
      disable_session_recording: true,
    });
  },
});
