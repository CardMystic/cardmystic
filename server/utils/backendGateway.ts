const routeFamilies =
  /^(?:cards|search|als|deck-stats|articles|user|supabase\/card-lists)(?:\/|$)/;
const publicEndpoints = new Set([
  '/cache/top',
  '/metrics/query_count',
  '/metrics/visit',
  '/metrics/dislike',
  '/recaptcha/verify',
  '/patreon/status',
  '/patreon/connect',
  '/patreon/connect/start',
  '/bulkdata/card-names.min.json',
  '/bulkdata/commanders.min.json',
  '/bulkdata/card-name-to-oracle-id.min.json',
  '/bulkdata/card-oracle-ids.min.json',
  '/bulkdata/partner-commanders',
]);

/** Fixed upstream and app routes only; never expose diagnostics or an open proxy. */
export function backendTarget(
  base: string,
  requestPath: string,
): string | null {
  const [path] = requestPath.split('?');
  if (!path.startsWith('/api/backend/')) return null;
  const suffix = path.slice('/api/backend'.length);
  let decoded: string;
  try {
    decoded = decodeURIComponent(suffix);
  } catch {
    return null;
  }
  if (
    /[\\%?#\x00-\x1f]/.test(decoded) ||
    decoded.split('/').some((part) => part === '.' || part === '..') ||
    decoded.includes('//') ||
    (!routeFamilies.test(decoded.slice(1)) && !publicEndpoints.has(decoded))
  )
    return null;
  const upstream = new URL(base);
  if (
    !['http:', 'https:'].includes(upstream.protocol) ||
    upstream.username ||
    upstream.password ||
    upstream.search ||
    upstream.hash ||
    (upstream.pathname !== '/' && upstream.pathname !== '')
  )
    throw new Error('Invalid backend URL');
  return upstream.origin + requestPath.slice('/api/backend'.length);
}

export function isSameOriginRequest(
  headers: Record<string, string | undefined>,
  requestOrigin: string,
  configuredOrigin?: string,
): boolean {
  const site = headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = headers.origin;
  if (origin === undefined) return true; // SSR and non-browser requests still use the gateway.
  return (
    origin === requestOrigin ||
    (!!configuredOrigin && origin === configuredOrigin)
  );
}

export function backendHeaders(
  incoming: Record<string, string | undefined>,
  key: string,
  clientIp?: string,
  internalRequest = false,
): Record<string, string> {
  const headers: Record<string, string> = { 'x-api-key': key };
  for (const name of [
    'authorization',
    'content-type',
    'accept',
    'user-agent',
    'origin',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
    'x-cardmystic-test',
  ]) {
    // Navigation metadata describes the browser's page request, not a child
    // server-side fetch. Keep user authorization and the verified visitor IP.
    if (internalRequest && (name === 'origin' || name.startsWith('sec-fetch-')))
      continue;
    if (incoming[name]) headers[name] = incoming[name]!;
  }
  if (clientIp) headers['x-cardmystic-client-ip'] = clientIp;
  return headers;
}
