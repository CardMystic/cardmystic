export const COOKIE_CONSENT_KEY = 'cm.cookie-consent.v1';
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export type CookieConsent = {
  analytics: boolean;
  advertising: boolean;
  updatedAt: number;
};

export function readCookieConsent(): CookieConsent | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(COOKIE_CONSENT_KEY) ?? 'null',
    );
    if (
      typeof value?.analytics === 'boolean' &&
      typeof value?.advertising === 'boolean' &&
      typeof value?.updatedAt === 'number' &&
      value.updatedAt <= Date.now() &&
      Date.now() - value.updatedAt < CONSENT_MAX_AGE
    )
      return value;
  } catch {
    // Unavailable or invalid storage never grants consent.
  }
  return null;
}

export function isLocalBrowser(): boolean {
  const hostname = window.location.hostname;
  return (
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname) ||
    hostname.endsWith('.localhost')
  );
}

export function clearTrackingStorage(kind: 'analytics' | 'advertising') {
  const matches = (name: string) =>
    kind === 'analytics'
      ? name.startsWith('ph_') || name.startsWith('__ph_')
      : /^_gcl_|^_ga(?:_|$)/.test(name);
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      for (const key of Object.keys(storage))
        if (matches(key)) storage.removeItem(key);
    } catch {
      /* Storage may be unavailable. */
    }
  }
  const host = window.location.hostname.split('.');
  const domains = [
    '',
    ...host
      .map((_, i) => host.slice(i).join('.'))
      .filter((domain) => domain.includes('.')),
  ];
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=')[0];
    if (!matches(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ''}`;
    }
  }
}
