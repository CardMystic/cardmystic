/** Forward the E2E bypass only for an already authenticated test request. */
export function getBackendRequestHeaders(
  requestHeaders: Record<string, string | undefined>,
  bypassToken: string | undefined,
): Record<string, string> | undefined {
  const requestToken = requestHeaders['x-cardmystic-test'];
  if (!bypassToken || requestToken !== bypassToken) return undefined;
  return { 'x-cardmystic-test': requestToken };
}
