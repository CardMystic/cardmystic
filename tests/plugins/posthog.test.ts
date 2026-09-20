import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { init } = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('posthog-js', () => ({ default: { init } }));

type Plugin = { name: string; enforce: string; setup: () => void };
let config: {
  public: {
    posthogKey: string;
    posthogHost: string;
    posthogEnabled: string | boolean;
  };
};

async function loadPlugin() {
  const { default: plugin } = await import('~/plugins/posthog.client');
  return plugin as Plugin;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  config = {
    public: {
      posthogKey: 'phc_test_project',
      posthogHost: 'https://us.i.posthog.com',
      posthogEnabled: 'true',
    },
  };
  vi.stubGlobal('defineNuxtPlugin', (plugin: Plugin) => plugin);
  vi.stubGlobal('useRuntimeConfig', () => config);
  vi.stubGlobal('window', { location: { hostname: 'cardmystic.com' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PostHog client integration', () => {
  it('runs after auth has stripped OAuth tokens from the URL', async () => {
    const plugin = await loadPlugin();

    expect(plugin.enforce).toBe('post');
  });

  it('initializes the configured project with SPA pageviews and replay disabled', async () => {
    const plugin = await loadPlugin();
    plugin.setup();

    expect(init).toHaveBeenCalledExactlyOnceWith('phc_test_project', {
      api_host: 'https://us.i.posthog.com',
      defaults: '2026-05-30',
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      cross_subdomain_cookie: false,
      disable_session_recording: true,
    });
  });

  it.each(['localhost', '127.0.0.1', '[::1]', '::1', 'preview.localhost'])(
    'does not collect analytics from local previews at %s',
    async (hostname) => {
      window.location.hostname = hostname;
      const plugin = await loadPlugin();
      plugin.setup();

      expect(init).not.toHaveBeenCalled();
    },
  );

  it.each([false, 'false', ''])(
    'honors the disabled runtime setting %s',
    async (enabled) => {
      config.public.posthogEnabled = enabled;
      const plugin = await loadPlugin();
      plugin.setup();

      expect(init).not.toHaveBeenCalled();
    },
  );

  it('does not initialize without a project key', async () => {
    config.public.posthogKey = '';
    const plugin = await loadPlugin();
    plugin.setup();

    expect(init).not.toHaveBeenCalled();
  });

  it('supports a boolean enabled setting and configured ingestion host', async () => {
    config.public.posthogEnabled = true;
    config.public.posthogHost = 'https://eu.i.posthog.com';
    const plugin = await loadPlugin();
    plugin.setup();

    expect(init).toHaveBeenCalledExactlyOnceWith(
      'phc_test_project',
      expect.objectContaining({ api_host: 'https://eu.i.posthog.com' }),
    );
  });
});
