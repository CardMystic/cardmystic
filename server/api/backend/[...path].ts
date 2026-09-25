import {
  backendHeaders,
  backendTarget,
  isSameOriginRequest,
} from '../../utils/backendGateway';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'private, no-store');
  const config = useRuntimeConfig(event);
  const incoming = getRequestHeaders(event);
  const requestUrl = getRequestURL(event, { xForwardedHost: false });
  // useRequestFetch inherits the navigation's browser headers, including
  // cross-site metadata when the visitor followed a link from another site.
  // Only a child local fetch inherits this server-owned top-level marker.
  const internalRequest = event.context.backendInternalRequest === true;
  if (
    !internalRequest &&
    !isSameOriginRequest(incoming, requestUrl.origin, config.frontendUrl)
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
  if (
    !['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)
  ) {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' });
  }
  if (!/^[!-~]{32,}$/.test(config.backendApiKey)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'API gateway is not configured',
    });
  }
  let target: string | null;
  try {
    target = backendTarget(config.backendUrl, event.path);
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'API gateway is not configured',
    });
  }
  if (!target)
    throw createError({ statusCode: 404, statusMessage: 'Not Found' });

  const headers = backendHeaders(
    incoming,
    config.backendApiKey,
    event.context.backendClientIp ?? undefined,
    internalRequest,
  );
  // Explicit headers prevent client-supplied keys, cookies, Host, and forwarding
  // headers from reaching the backend. Bearer JWTs retain per-user authorization.
  const body = ['GET', 'HEAD'].includes(event.method)
    ? undefined
    : getRequestWebStream(event);
  return sendProxy(event, target, {
    headers,
    fetchOptions: {
      method: event.method,
      body,
      duplex: body ? 'half' : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(25_000),
    },
    onResponse: (responseEvent) => {
      setResponseHeader(responseEvent, 'cache-control', 'private, no-store');
      for (const name of [
        'set-cookie',
        'x-api-key',
        'access-control-allow-origin',
        'access-control-allow-credentials',
      ])
        removeResponseHeader(responseEvent, name);
    },
  });
});
