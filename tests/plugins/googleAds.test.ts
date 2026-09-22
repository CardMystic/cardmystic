import { ref, watch } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import type { CookieConsent } from '~/utils/cookieConsent';

afterEach(() => vi.unstubAllGlobals());

it('loads Google Ads only after Advertising consent and gates existing conversion calls', async () => {
  const consent = ref<CookieConsent | null>(null);
  const scripts: { src?: string }[] = [];
  vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
  vi.stubGlobal('useCookieConsent', () => ({ consent }));
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('window', { location: { hostname: 'cardmystic.com' } });
  vi.stubGlobal('document', {
    createElement: () => ({}),
    head: { appendChild: (script: { src: string }) => scripts.push(script) },
  });
  const { default: imported } = await import('~/plugins/google-ads.client');
  (imported as unknown as { setup: () => void }).setup();
  expect(scripts).toHaveLength(0);
  expect(window.gtag).toBeUndefined();
  consent.value = {
    analytics: true,
    advertising: false,
    updatedAt: Date.now(),
  };
  expect(scripts).toHaveLength(0);
  consent.value.advertising = true;
  expect(scripts).toHaveLength(1);
  expect(scripts[0].src).toContain('googletagmanager.com/gtag/js');
  const entries = () =>
    (window.dataLayer ?? []).map((entry) =>
      Array.from(entry as ArrayLike<unknown>),
    );
  expect(entries()[0]).toEqual([
    'consent',
    'default',
    expect.objectContaining({ ad_storage: 'denied' }),
  ]);
  window.gtag?.('event', 'conversion', { send_to: 'test-conversion' });
  expect(entries().at(-1)).toEqual([
    'event',
    'conversion',
    { send_to: 'test-conversion' },
  ]);
  consent.value.advertising = false;
  const count = entries().length;
  window.gtag?.('event', 'conversion', { send_to: 'must-not-send' });
  expect(entries()).toHaveLength(count);
  expect(entries().at(-1)).toEqual([
    'consent',
    'update',
    expect.objectContaining({ ad_storage: 'denied' }),
  ]);
  consent.value.advertising = true;
  expect(scripts).toHaveLength(1);
  expect(entries().at(-1)).toEqual([
    'consent',
    'update',
    expect.objectContaining({ ad_storage: 'granted' }),
  ]);
});
