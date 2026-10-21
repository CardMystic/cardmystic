import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';

// Exercise the deployed Azure adapter: Node's HTTP server hides bad chunked
// headers by re-encoding the response, while Azure returns a buffered body.
const apiKey = 'azure-gateway-test-key-01234567890123456789';
const payload = { queries: [{ query: 'card draw', count: 100 }] };
const upstream = createServer((request, response) => {
  if (request.headers['x-api-key'] !== apiKey) {
    response.writeHead(403).end();
    return;
  }
  if (request.url === '/user/auth-check') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({ authorization: request.headers.authorization ?? null }),
    );
    return;
  }
  if (request.url === '/user/unauthorized') {
    response.writeHead(401, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }
  if (request.url === '/user/rate-limited') {
    response.writeHead(429, { 'retry-after': '60' });
    response.end('Too many requests');
    return;
  }
  const compressed = gzipSync(JSON.stringify(payload));
  response.writeHead(200, {
    'content-type': 'application/json',
    'content-encoding': 'gzip',
    connection: 'keep-alive, x-upstream-only',
    'x-upstream-only': 'private transport metadata',
    'x-request-id': 'gateway-regression',
    'set-cookie': 'upstream-session=private',
    'x-api-key': apiKey,
    'access-control-allow-origin': '*',
  });
  response.write(compressed.subarray(0, 10));
  response.end(compressed.subarray(10));
});

upstream.listen(0, '127.0.0.1');
await once(upstream, 'listening');
process.env.NUXT_BACKEND_URL = `http://127.0.0.1:${upstream.address().port}`;
process.env.NUXT_BACKEND_API_KEY = apiKey;
process.env.NUXT_FRONTEND_URL = 'http://localhost';
process.env.WEBSITE_INSTANCE_ID = 'azure-gateway-regression';

try {
  const { handle } = await import('../.output/server/functions/index.mjs');
  async function request(path, headers = {}) {
    const context = {};
    await handle(context, {
      method: 'GET',
      headers: {
        host: 'localhost',
        ...headers,
        'x-ms-original-url': `http://localhost/api/backend${path}`,
      },
    });
    return context.res;
  }

  await test('Azure returns decoded JSON without upstream transport or private headers', async () => {
    const response = await request('/cache/top');
    assert.equal(response.status, 200);
    assert.deepEqual(
      JSON.parse(Buffer.from(response.body).toString()),
      payload,
    );
    for (const header of [
      'transfer-encoding',
      'connection',
      'keep-alive',
      'content-encoding',
      'content-length',
      'x-upstream-only',
      'set-cookie',
      'x-api-key',
      'access-control-allow-origin',
    ]) {
      assert.equal(
        response.headers[header],
        undefined,
        `${header} leaked into Azure response`,
      );
    }
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.headers['x-request-id'], 'gateway-regression');
    assert.equal(response.headers['cache-control'], 'private, no-store');
  });

  await test('Azure restores the user token instead of its injected platform token', async () => {
    const response = await request('/user/auth-check', {
      authorization: 'Bearer azure-platform-token',
      'x-cardmystic-authorization': 'Bearer supabase-user-token',
    });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(Buffer.from(response.body).toString()), {
      authorization: 'Bearer supabase-user-token',
    });
  });

  await test('Azure anonymous requests do not forward the injected platform token', async () => {
    const response = await request('/user/auth-check', {
      authorization: 'Bearer azure-platform-token',
    });
    assert.deepEqual(JSON.parse(Buffer.from(response.body).toString()), {
      authorization: null,
    });
  });

  await test('Azure preserves upstream authentication failures', async () => {
    const response = await request('/user/unauthorized');
    assert.equal(response.status, 401);
    assert.deepEqual(JSON.parse(Buffer.from(response.body).toString()), {
      message: 'Unauthorized',
    });
  });

  await test('Azure preserves rate limits and retry timing', async () => {
    const response = await request('/user/rate-limited');
    assert.equal(response.status, 429);
    assert.equal(response.headers['retry-after'], '60');
  });
} finally {
  upstream.closeAllConnections();
  await new Promise((resolve) => upstream.close(resolve));
}
