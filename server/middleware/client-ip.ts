import { gatewayClientIp } from '../utils/clientIp';

// useRequestFetch carries this server-owned context into internal SSR calls.
// A browser header cannot supply or replace it.
export default defineEventHandler((event) => {
  // Mark only the context forwarded to child local fetches. Nitro copies these
  // properties into the child's top-level context before its middleware runs.
  // The current external request must not acquire that top-level marker.
  event.context._platform = {
    ...event.context._platform,
    backendInternalRequest: true,
  };
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
