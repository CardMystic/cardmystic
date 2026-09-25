import { BlockList, isIP } from 'node:net';

// Keep this allowlist aligned with cardmystic-backend/src/common/utils/clientIp.ts.
// https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
const cloudflare = new BlockList();
for (const cidr of [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
]) {
  const [address, prefix] = cidr.split('/');
  cloudflare.addSubnet(
    address,
    Number(prefix),
    isIP(address) === 6 ? 'ipv6' : 'ipv4',
  );
}

const azureIngress = new BlockList();
azureIngress.addSubnet('169.254.0.0', 16, 'ipv4');

// Managed Azure Functions can report their private routing peer instead of a
// Node socket. These ranges apply ONLY to Azure's overwritten client-ip header,
// never to arbitrary intermediate entries in X-Forwarded-For.
const azureFunctionIngress = new BlockList();
for (const [address, prefix] of [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['169.254.0.0', 16],
] as const)
  azureFunctionIngress.addSubnet(address, prefix, 'ipv4');

function normalizeIp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  value = value.trim();
  if (isIP(value)) return value;
  const match = /^(?:\[([^\]]+)\]|([^:]+)):\d+$/.exec(value);
  const ip = match?.[1] ?? match?.[2];
  return ip && isIP(ip) ? ip : undefined;
}

function contains(list: BlockList, ip: string): boolean {
  return list.check(ip, isIP(ip) === 6 ? 'ipv6' : 'ipv4');
}

/**
 * Match the backend's proxy allowlist: start at the connection peer and stop
 * at the first untrusted address, regardless of the number of Cloudflare hops.
 * Azure's client-ip replaces a missing socket only in the Azure runtime.
 * Azure overwrites that header: https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/headers.md
 */
export function gatewayClientIp(
  forwardedFor: string | undefined,
  socketIp: string | undefined,
  azureClientIp?: string,
): string | undefined {
  const socket = normalizeIp(socketIp);
  const platformPeer =
    !socket && process.env.WEBSITE_INSTANCE_ID
      ? normalizeIp(azureClientIp)
      : undefined;
  let current = socket ?? platformPeer;
  if (!current) return undefined;

  const trustedAzurePeer = socket
    ? contains(azureIngress, socket)
    : !!platformPeer && contains(azureFunctionIngress, platformPeer);
  const forwarded = (forwardedFor ?? '').split(',').reverse().map(normalizeIp);

  // App Service may append the same platform peer to XFF as client-ip.
  // Remove only that verified duplicate, not arbitrary private addresses.
  if (platformPeer && trustedAzurePeer && forwarded[0]) {
    const peer = new BlockList();
    peer.addAddress(platformPeer, isIP(platformPeer) === 6 ? 'ipv6' : 'ipv4');
    if (contains(peer, forwarded[0])) forwarded.shift();
  }

  for (let index = 0; index < forwarded.length; index++) {
    if (!contains(cloudflare, current) && !(index === 0 && trustedAzurePeer))
      break;
    const next = forwarded[index];
    if (!next) break; // Never skip malformed entries to reach an untrusted claim.
    current = next;
  }
  return current;
}
