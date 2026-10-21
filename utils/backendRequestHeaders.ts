/** Forward the E2E bypass only for an already authenticated test request. */
export function getBackendRequestHeaders(
  requestHeaders: Record<string, string | undefined>,
  bypassToken: string | undefined,
): Record<string, string> | undefined {
  const requestToken = requestHeaders['x-cardmystic-test'];
  if (!bypassToken || requestToken !== bypassToken) return undefined;
  return { 'x-cardmystic-test': requestToken };
}

export const BACKEND_USER_AUTH_HEADER = 'x-cardmystic-authorization';

/** Preserve user auth across Azure SWA, which replaces Authorization itself. */
export function getGatewayRequestHeaders(
  input: RequestInfo | URL,
  headers: HeadersInit | undefined,
  gateway: URL,
): Headers | undefined {
  const request = input instanceof Request ? input : undefined;
  const url = new URL(request ? request.url : String(input), gateway);
  if (
    url.origin !== gateway.origin ||
    (url.pathname !== gateway.pathname &&
      !url.pathname.startsWith(gateway.pathname + '/'))
  )
    return undefined;

  const forwarded = new Headers(headers ?? request?.headers);
  const authorization = forwarded.get('authorization');
  if (authorization) {
    forwarded.set(BACKEND_USER_AUTH_HEADER, authorization);
    forwarded.delete('authorization');
  }
  return forwarded;
}
