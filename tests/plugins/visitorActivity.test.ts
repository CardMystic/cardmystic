import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('counts a visible browser once per UTC day without cookies or authentication', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-21T23:59:00Z'));
  const hooks: Record<string, () => void> = {};
  const events: Record<string, () => void> = {};
  let visible = 'hidden';
  const send = vi.fn(async () => ({ ok: true }));
  vi.stubGlobal('fetch', send);
  vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { backendUrl: 'https://api.cardmystic.com' },
  }));
  vi.stubGlobal('window', {
    location: { hostname: 'cardmystic.com' },
    setTimeout,
    addEventListener: (name: string, callback: () => void) => {
      events[name] = callback;
    },
  });
  vi.stubGlobal('document', {
    get visibilityState() {
      return visible;
    },
    hasFocus: () => true,
    addEventListener: (name: string, callback: () => void) => {
      events[name] = callback;
    },
  });
  vi.stubGlobal('navigator', { webdriver: false });
  const { default: imported } =
    await import('~/plugins/visitor-activity.client');
  (imported as unknown as (app: unknown) => void)({
    hook: (name: string, callback: () => void) => {
      hooks[name] = callback;
    },
  });
  hooks['app:mounted']();
  await vi.advanceTimersByTimeAsync(2000);
  expect(send).not.toHaveBeenCalled();
  visible = 'visible';
  await events.visibilitychange();
  expect(send).toHaveBeenCalledExactlyOnceWith(
    'https://api.cardmystic.com/metrics/visit',
    { method: 'POST', credentials: 'omit' },
  );
  await events.focus();
  hooks['page:finish']();
  expect(send).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date('2026-09-22T00:01:00Z'));
  await events.focus();
  expect(send).toHaveBeenCalledTimes(2);
});
