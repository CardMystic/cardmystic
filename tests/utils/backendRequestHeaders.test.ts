import { describe, expect, it } from 'vitest';
import {
  getBackendRequestHeaders,
  getGatewayRequestHeaders,
} from '~/utils/backendRequestHeaders';

describe('backend SSR request headers', () => {
  it('forwards only a matching test token', () => {
    expect(
      getBackendRequestHeaders(
        {
          'x-cardmystic-test': 'test-token',
          authorization: 'Bearer private-session',
          cookie: 'session=private-session',
          host: 'frontend.example.com',
        },
        'test-token',
      ),
    ).toEqual({ 'x-cardmystic-test': 'test-token' });
  });

  it.each([undefined, '', 'wrong-token'])(
    'does not add the server token when the incoming token is %s',
    (token) => {
      expect(
        getBackendRequestHeaders({ 'x-cardmystic-test': token }, 'test-token'),
      ).toBeUndefined();
    },
  );

  it.each([undefined, ''])(
    'does not forward a test header when bypass is disabled (%s)',
    (token) => {
      expect(
        getBackendRequestHeaders({ 'x-cardmystic-test': 'test-token' }, token),
      ).toBeUndefined();
    },
  );
});

describe('Azure-safe browser gateway authorization', () => {
  const gateway = new URL('https://cardmystic.com/api/backend');

  it('moves only backend user authorization and retains other request headers', () => {
    const original = new Headers({
      Authorization: 'Bearer user-jwt',
      'Content-Type': 'application/json',
    });
    const headers = getGatewayRequestHeaders(
      '/api/backend/user/account-stats',
      original,
      gateway,
    );
    expect(headers?.get('x-cardmystic-authorization')).toBe('Bearer user-jwt');
    expect(headers?.get('authorization')).toBeNull();
    expect(headers?.get('content-type')).toBe('application/json');
    expect(original.get('authorization')).toBe('Bearer user-jwt');
  });

  it.each([
    'https://example.supabase.co/auth/v1/user',
    '/api/backend-other',
    'https://other.example/api/backend/user',
  ])('leaves non-gateway requests untouched: %s', (url) => {
    expect(
      getGatewayRequestHeaders(
        url,
        { Authorization: 'Bearer user-jwt' },
        gateway,
      ),
    ).toBeUndefined();
  });

  it('uses Request headers and respects explicit fetch header overrides', () => {
    const request = new Request(
      new URL('/api/backend/user/account-stats', gateway),
      {
        headers: { Authorization: 'Bearer original-jwt' },
      },
    );
    expect(
      getGatewayRequestHeaders(request, undefined, gateway)?.get(
        'x-cardmystic-authorization',
      ),
    ).toBe('Bearer original-jwt');
    expect(
      getGatewayRequestHeaders(
        request,
        { Authorization: 'Bearer new-jwt' },
        gateway,
      )?.get('x-cardmystic-authorization'),
    ).toBe('Bearer new-jwt');
    expect(
      getGatewayRequestHeaders(request, {}, gateway)?.get(
        'x-cardmystic-authorization',
      ),
    ).toBeNull();
  });
});
