import type { FetchContext, FetchResponse } from 'ofetch';
import { getGatewayRequestHeaders } from '~/utils/backendRequestHeaders';

export default defineNuxtPlugin({
  name: 'rate-limit-feedback',
  enforce: 'pre',
  setup() {
    const toast = useToast();
    const backend = new URL(
      useRuntimeConfig().public.backendPath,
      window.location.origin,
    );
    const message = '429 Too Many Requests, Try again in 60 seconds';
    let lastNotification = -Infinity;
    const notify = () => {
      if (Date.now() - lastNotification < 60_000) return;
      lastNotification = Date.now();
      toast.add({
        id: 'rate-limit',
        title: '429 Too Many Requests',
        description: 'Try again in 60 seconds',
        color: 'error',
        duration: 60_000,
      });
    };

    const originalFetch = globalThis.fetch.bind(globalThis);
    // $fetch captures its own fetch reference. Throwing here stops its
    // automatic retry and gives callers the same message as native fetch.
    globalThis.$fetch = globalThis.$fetch.create({
      onRequest({ request, options }: FetchContext) {
        const headers = getGatewayRequestHeaders(
          request,
          options.headers,
          backend,
        );
        if (headers) options.headers = headers;
      },
      onResponseError({
        response,
      }: FetchContext & { response: FetchResponse<unknown> }) {
        if (response.status === 429) {
          notify();
          throw new Error(message);
        }
      },
    });
    globalThis.fetch = async (input, init) => {
      const headers = getGatewayRequestHeaders(input, init?.headers, backend);
      const response = await originalFetch(
        input,
        headers ? { ...init, headers } : init,
      );
      if (response.status === 429) {
        notify();
        const url = new URL(
          typeof input === 'string' || input instanceof URL ? input : input.url,
          backend,
        );
        // Preserve Supabase's HTTP response so it does not retry an auth
        // rejection as a network failure.
        if (url.origin === backend.origin) throw new Error(message);
      }
      return response;
    };
  },
});
