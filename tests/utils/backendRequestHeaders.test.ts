import { describe, expect, it } from 'vitest';
import { getBackendRequestHeaders } from '~/utils/backendRequestHeaders';

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
