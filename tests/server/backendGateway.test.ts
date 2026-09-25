import { describe, expect, it } from 'vitest';
import {
  backendHeaders,
  backendTarget,
  isSameOriginRequest,
} from '~/server/utils/backendGateway';

describe('private backend gateway', () => {
  it('keeps the fixed upstream, encoded resource ids and query strings', () => {
    expect(
      backendTarget(
        'https://api.example.com/',
        '/api/backend/cards/name/Urza%20Lord?limit=40',
      ),
    ).toBe('https://api.example.com/cards/name/Urza%20Lord?limit=40');
    expect(
      backendTarget(
        'https://api.example.com',
        '/api/backend/bulkdata/card-names.min.json',
      ),
    ).toBe('https://api.example.com/bulkdata/card-names.min.json');
  });
  it.each([
    '/documentation',
    '/cache/stats',
    '/metrics/dislikes',
    '/metrics/query_counts',
    '/patreon/webhook',
    '/patreon/callback',
    '//evil.example/search',
    '/cards/../documentation',
    '/cards/%2e%2e/documentation',
    '/cards/%252e%252e/documentation',
    '/cards/%5c..%5cdocumentation',
    '/cards/%00',
    '/cards/%',
    '/cards/%3fredirect=evil',
  ])('does not expose internal or malformed paths: %s', (path) => {
    expect(
      backendTarget('https://api.example.com', '/api/backend' + path),
    ).toBeNull();
  });
  it.each([
    'file:///etc/passwd',
    'https://user:password@api.example.com',
    'https://api.example.com/path',
  ])('rejects invalid upstream configuration: %s', (base) => {
    expect(() => backendTarget(base, '/api/backend/search/colbert')).toThrow();
  });
  it('rejects foreign browser origins and cross-site fetch metadata', () => {
    expect(
      isSameOriginRequest(
        { origin: 'https://evil.example' },
        'https://cardmystic.com',
      ),
    ).toBe(false);
    for (const site of ['cross-site', 'same-site']) {
      expect(
        isSameOriginRequest(
          { origin: 'https://cardmystic.com', 'sec-fetch-site': site },
          'https://cardmystic.com',
        ),
      ).toBe(false);
    }
    expect(isSameOriginRequest({ origin: '' }, 'https://cardmystic.com')).toBe(
      false,
    );
    expect(
      isSameOriginRequest({ origin: 'null' }, 'https://cardmystic.com'),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        { origin: 'https://cardmystic.com', 'sec-fetch-site': 'same-origin' },
        'https://cardmystic.com',
      ),
    ).toBe(true);
    expect(isSameOriginRequest({}, 'http://localhost')).toBe(true);
  });
  it('overwrites service credentials and forwarding headers while preserving the user JWT', () => {
    expect(
      backendHeaders(
        {
          'x-api-key': 'attacker',
          authorization: 'Bearer user-session',
          cookie: 'private-cookie',
          host: 'evil.example',
          'x-cardmystic-client-ip': '6.6.6.6',
          'x-forwarded-for': '6.6.6.6',
          'content-type': 'application/json',
          'user-agent': 'browser',
        },
        'server-key',
        '192.0.2.10',
      ),
    ).toEqual({
      'x-api-key': 'server-key',
      authorization: 'Bearer user-session',
      'content-type': 'application/json',
      'user-agent': 'browser',
      'x-cardmystic-client-ip': '192.0.2.10',
    });
  });
});
