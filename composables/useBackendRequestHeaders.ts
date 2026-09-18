import { getBackendRequestHeaders } from '~/utils/backendRequestHeaders';

/** Capture request headers during setup, before asynchronous SSR fetches. */
export function useBackendRequestHeaders() {
  if (import.meta.server) {
    return getBackendRequestHeaders(
      useRequestHeaders(['x-cardmystic-test']),
      process.env.E2E_BYPASS_TOKEN,
    );
  }
  // Playwright sends its own browser headers; keep the server token private.
  return undefined;
}
