import { z } from 'zod';

// Link to CardMystic's Patreon membership page — shown when a user isn't subscribed to a tier.
export const PATREON_MEMBERSHIP_URL =
  'https://www.patreon.com/c/thecardmystic/membership';

export const PatreonTierNameSchema = z.enum(['supporter', 'featured']);
export type PatreonTierName = z.infer<typeof PatreonTierNameSchema>;

export const PatreonPatronStatusSchema = z.enum([
  'active_patron',
  'declined_patron',
  'former_patron',
]);
export type PatreonPatronStatus = z.infer<typeof PatreonPatronStatusSchema>;

export const GetPatreonStatusResponseSchema = z.object({
  connected: z
    .boolean()
    .describe('Whether the user has linked a Patreon account'),
  tier: PatreonTierNameSchema.nullable().describe(
    'The CardMystic tier currently entitled to, if any',
  ),
  patronStatus: PatreonPatronStatusSchema.nullable().describe(
    "Patreon's patron status for the linked membership (null if never pledged)",
  ),
  isFeatured: z
    .boolean()
    .describe(
      'Whether this account counts as featured (manual flag OR active Featured tier membership)',
    ),
  membershipUrl: z
    .literal(PATREON_MEMBERSHIP_URL)
    .describe('Link to the CardMystic Patreon membership page'),
});
export type GetPatreonStatusResponse = z.infer<
  typeof GetPatreonStatusResponseSchema
>;

export const StartPatreonConnectResponseSchema = z.object({
  authorizeUrl: z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        url.hostname === 'www.patreon.com' &&
        url.pathname === '/oauth2/authorize'
      );
    }, 'Expected a Patreon OAuth authorization URL')
    .describe('Patreon OAuth authorize URL — redirect the browser here to connect'),
});
export type StartPatreonConnectResponse = z.infer<
  typeof StartPatreonConnectResponseSchema
>;

export const DisconnectPatreonResponseSchema = z.object({
  message: z.string(),
});
export type DisconnectPatreonResponse = z.infer<
  typeof DisconnectPatreonResponseSchema
>;
