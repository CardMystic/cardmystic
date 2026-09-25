import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gatewayClientIp } from '~/server/utils/clientIp';

const azure = '169.254.130.3';
const cloudflare = '172.64.0.10';

beforeEach(() => vi.stubEnv('WEBSITE_INSTANCE_ID', ''));
afterEach(() => vi.unstubAllEnvs());

describe('gateway client IPs use the backend proxy allowlist', () => {
  it.each([
    ['203.0.113.10', '192.0.2.99, 172.64.0.10', '203.0.113.10'],
    [azure, '192.0.2.99, 203.0.113.10, 172.64.0.10', '203.0.113.10'],
    [azure, '192.0.2.99, 203.0.113.10:54321', '203.0.113.10'],
    [azure, '203.0.113.10, 172.64.0.10, 173.245.48.10', '203.0.113.10'],
    [cloudflare, '192.0.2.99, 203.0.113.10', '203.0.113.10'],
    [azure, '2001:db8::10, [2606:4700::1111]:54321', '2001:db8::10'],
    [
      '::ffff:169.254.130.3',
      '203.0.113.10, ::ffff:172.64.0.10',
      '203.0.113.10',
    ],
    ['127.0.0.1', '192.0.2.99', '127.0.0.1'],
    ['10.0.0.12', '192.0.2.99', '10.0.0.12'],
    [azure, '192.0.2.99, 169.254.130.3, 172.64.0.10', azure],
    [azure, '192.0.2.99, 10.0.0.12, 172.64.0.10', '10.0.0.12'],
    [azure, '192.0.2.99, unknown, 172.64.0.10', cloudflare],
    [azure, '192.0.2.99, , 172.64.0.10', cloudflare],
    ['[2001:db8::10]:54321', undefined, '2001:db8::10'],
  ])('resolves peer %s and chain %s to %s', (peer, chain, expected) => {
    expect(gatewayClientIp(chain, peer)).toBe(expected);
  });

  it('does not trust forwarded or client-ip headers without a connection peer', () => {
    expect(
      gatewayClientIp('192.0.2.99, 172.64.0.10', undefined, '10.0.0.12'),
    ).toBeUndefined();
  });

  it('keeps different visitors distinct with and without Cloudflare', () => {
    for (const visitor of ['203.0.113.10', '198.51.100.20']) {
      expect(gatewayClientIp(visitor + ', ' + cloudflare, azure)).toBe(visitor);
      expect(gatewayClientIp('192.0.2.99, ' + visitor, azure)).toBe(visitor);
    }
  });
});

describe('Azure Functions without a socket', () => {
  beforeEach(() => vi.stubEnv('WEBSITE_INSTANCE_ID', 'test-azure-instance'));

  it.each([
    [
      '10.0.0.12:54321',
      '192.0.2.99, 203.0.113.10, 172.64.0.10',
      '203.0.113.10',
    ],
    [
      '10.0.0.12:54321',
      '203.0.113.10, 172.64.0.10, 10.0.0.12:54321',
      '203.0.113.10',
    ],
    [
      '10.0.0.12:54321',
      '192.0.2.99, 203.0.113.10:1234, 10.0.0.12:54321',
      '203.0.113.10',
    ],
    [
      '::ffff:10.0.0.12',
      '203.0.113.10, 172.64.0.10, 10.0.0.12',
      '203.0.113.10',
    ],
    ['172.64.0.10:54321', '192.0.2.99, 203.0.113.10', '203.0.113.10'],
    ['203.0.113.10:54321', '192.0.2.99, 172.64.0.10', '203.0.113.10'],
    ['10.0.0.12', '192.0.2.99, 10.0.0.99, 172.64.0.10', '10.0.0.99'],
    ['10.0.0.12', '192.0.2.99, 10.0.0.99, 10.0.0.12', '10.0.0.99'],
    ['10.0.0.12', '192.0.2.99, invalid, 10.0.0.12', '10.0.0.12'],
    ['10.0.0.12', undefined, '10.0.0.12'],
  ])(
    'resolves platform peer %s and chain %s to %s',
    (peer, chain, expected) => {
      expect(gatewayClientIp(chain, undefined, peer)).toBe(expected);
    },
  );

  it('prefers a real socket over the platform header', () => {
    expect(
      gatewayClientIp('192.0.2.99, 172.64.0.10', '203.0.113.10', '10.0.0.12'),
    ).toBe('203.0.113.10');
  });

  it.each([undefined, '', 'invalid', '10.0.0.12, 192.0.2.99'])(
    'does not trust a forwarded chain when the platform peer is missing or invalid: %s',
    (peer) => {
      expect(
        gatewayClientIp('192.0.2.99, 172.64.0.10', undefined, peer),
      ).toBeUndefined();
    },
  );
});
