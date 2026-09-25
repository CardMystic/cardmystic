import { gatewayClientIp } from '../utils/clientIp';

// useRequestFetch carries this server-owned context into internal SSR calls.
// A browser header cannot supply or replace it.
export default defineEventHandler((event) => {
  if (event.context.backendClientIp !== undefined) return;
  event.context.backendClientIp =
    gatewayClientIp(
      getRequestHeader(event, 'x-forwarded-for'),
      getRequestIP(event),
      getRequestHeader(event, 'client-ip'),
    ) ?? null;
  // Nitro preserves _platform across local fetches; arbitrary context keys are
  // not copied by its Azure/Node adapters. This is in-process data, never a header.
  event.context._platform = {
    ...event.context._platform,
    backendClientIp: event.context.backendClientIp,
  };
});
