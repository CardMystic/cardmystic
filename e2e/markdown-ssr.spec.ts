import { expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { FAKE_USER, fakeJwt, waitForHydration } from './utils/mocks';

// Browser routing cannot intercept requests made by Nitro during SSR. Run the
// production build against a real local fixture backend on isolated ports.
test.describe.configure({ mode: 'default' });

const ARTICLE_ID = '10000000-0000-4000-8000-000000000911';
const LIST_ID = '10000000-0000-4000-8000-000000000912';
const FAILURE_ID = '10000000-0000-4000-8000-000000000913';
const DRAFT_ID = '10000000-0000-4000-8000-000000000914';
const PRIVATE_ID = '10000000-0000-4000-8000-000000000915';
const BOLT_ID = '4457ed35-7c10-48c8-9776-456485fdf070';
const ORACLE_ID = '1de1b591-a73f-4974-b507-8c63e07a0868';
const OWNER_TOKEN = fakeJwt(FAKE_USER.id);
const PRIVATE_TEXT =
  'Private owner primer body must never enter anonymous HTML.';
const DRAFT_TEXT = 'Unpublished draft body must never enter anonymous HTML.';

const content = [
  '# SSR body visible before JavaScript',
  '@[search](https://cardmystic.com/search/all/smart?searchType=smart&query=draw%20cards&limit=12)',
  '[draw cards](https://cardmystic.com/search/all/smart?searchType=smart&query=draw%20cards&limit=12)',
  "[[Lightning Bolt]] and [[Thassa's Oracle]].",
  'Repeated mention: [[Lightning Bolt]].',
  '((Lightning Bolt))',
  '[[Unknown Card]] and [[Invalid ID Card]].',
  '[[<img src=x onerror="window.__markdownInjected=1">]]',
  '((<img src=x onerror="window.__markdownInjected=1">))',
  '<img src="/missing-fixture-image" onerror="window.__markdownInjected=1">',
  '<script>window.__markdownInjected=1</script>',
  '<a href="javascript:window.__markdownInjected=1">Unsafe link</a>',
  '<iframe src="javascript:window.__markdownInjected=1"></iframe>',
  'Mana symbol: {R}.',
  '## [Colored heading]{color=#dc2626}',
  'Normal text and [blue text]{color=#2563eb}.',
  '<details open><summary>Strategy details</summary><p>Keep a useful opening hand.</p></details>',
  '| Card | Count |\n| --- | --- |\n| Lightning Bolt | 1 |',
  '- [x] Read the primer',
  '@[youtube](dQw4w9WgXcQ)',
  'https://cardmystic.com/articles/%',
  'https://cardmystic.com/search/all/keyword/%E0%A4%A',
].join('\n\n');

const cards = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    oracle_id: BOLT_ID,
    name: 'Lightning Bolt',
    image_uris: { normal: '/ugin.webp' },
    mana_cost: '{R}',
    type_line: 'Instant',
    oracle_text: 'Lightning Bolt deals 3 damage to any target.',
    legalities: {},
    color_identity: ['R'],
    colors: ['R'],
    prices: { usd: '1.00' },
    set_name: 'Test set',
    rarity: 'common',
    games: ['paper'],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    oracle_id: ORACLE_ID,
    name: "Thassa's Oracle",
    image_uris: { normal: '/kaalia.webp' },
    prices: { usd: '1.00' },
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    oracle_id: 'invalid-oracle-id',
    name: 'Invalid ID Card',
    image_uris: { normal: '/ugin.webp' },
  },
];

function article(id: string) {
  return {
    id,
    title: 'Production SSR article fixture',
    description: 'Public markdown integration fixture.',
    content:
      id === DRAFT_ID
        ? DRAFT_TEXT
        : id === FAILURE_ID
          ? '# Lookup failure stays readable\n\n[[Unavailable Card]] and ((Unavailable Card)).'
          : content,
    image_url: null,
    is_published: id !== DRAFT_ID,
    published_at: '2026-01-15T12:00:00Z',
    created_at: '2026-01-10T12:00:00Z',
    updated_at: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    user_id: FAKE_USER.id,
    username: 'fixture-writer',
    avatar_card_name: null,
  };
}

function decklist(id: string) {
  return {
    id,
    name: 'Production SSR primer fixture',
    description: '',
    format: 'commander',
    avatar_card_name: null,
    commanders: [],
    color_ratios: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 0 },
    updated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    visibility: id === PRIVATE_ID ? 'private' : 'public',
    user_id: FAKE_USER.id,
    username: 'fixture-writer',
    like_count: 0,
    save_count: 0,
    comment_count: 0,
    view_count: 0,
  };
}

const batches: string[][] = [];
const fixtureRequests: {
  path: string;
  authorized: boolean;
  clientIp?: string;
  origin?: string;
  fetchSite?: string;
  fetchMode?: string;
  fetchDest?: string;
}[] = [];
const gatewayRequests: {
  body: string;
  cookie?: string;
  authorized: boolean;
  clientIp?: string;
}[] = [];
let backend: Server;
let preview: ChildProcess;
let previewUrl = '';
let backendUrl = '';
let previewLogs = '';

function json(response: ServerResponse, body: unknown, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function handleFixture(
  request: IncomingMessage,
  response: ServerResponse,
) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Headers',
    request.headers['access-control-request-headers'] ??
      'authorization, content-type',
  );
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const path = new URL(request.url!, 'http://fixture.test').pathname;
  if (path === '/external-card-link') {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(
      `<a href="${previewUrl}/card/${BOLT_ID}">View Lightning Bolt</a>`,
    );
    return;
  }
  if (
    !path.startsWith('/supabase-auth/') &&
    request.headers['x-api-key'] !==
      'fixture-backend-key-at-least-32-characters'
  ) {
    json(response, { message: 'API key required' }, 401);
    return;
  }
  const authorized = request.headers.authorization === 'Bearer ' + OWNER_TOKEN;
  const clientIp = request.headers['x-cardmystic-client-ip'] as
    string | undefined;
  fixtureRequests.push({
    path,
    authorized,
    clientIp,
    origin: request.headers.origin,
    fetchSite: request.headers['sec-fetch-site'] as string | undefined,
    fetchMode: request.headers['sec-fetch-mode'] as string | undefined,
    fetchDest: request.headers['sec-fetch-dest'] as string | undefined,
  });
  if (path === '/cards/with-llm/' + BOLT_ID) {
    json(response, {
      card: { ...cards[0], cmc: 1, layout: 'normal' },
      llm: null,
    });
    return;
  }
  if (path === '/search/keyword') {
    let body = '';
    for await (const chunk of request) body += chunk.toString();
    gatewayRequests.push({
      body,
      authorized,
      clientIp,
      cookie: request.headers.cookie,
    });
    response.setHeader('Retry-After', '9');
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.setHeader('X-API-Key', 'never-expose-service-headers');
    response.setHeader('Set-Cookie', 'unexpected=private');
    json(response, { message: 'Too many requests' }, 429);
    return;
  }
  if (path === '/cards/cards-by-names') {
    let raw = '';
    for await (const chunk of request) raw += chunk.toString();
    const names = (JSON.parse(raw) as { cardNames: string[] }).cardNames;
    batches.push(names);
    if (names.includes('Unavailable Card')) {
      json(response, { message: 'Fixture lookup unavailable' }, 503);
    } else {
      json(
        response,
        cards.filter((card) => names.includes(card.name)),
      );
    }
    return;
  }
  if (path.startsWith('/articles/view/')) {
    const id = path.split('/').pop()!;
    if (id === DRAFT_ID && !authorized) {
      json(response, { message: 'Not found' }, 404);
    } else {
      json(response, request.method === 'POST' ? {} : { article: article(id) });
    }
    return;
  }
  if (path.startsWith('/articles/comments/')) {
    json(response, { comments: [], nextCursor: null });
    return;
  }
  if (path.startsWith('/supabase/card-lists/primer/')) {
    const id = path.split('/').pop()!;
    if (id === PRIVATE_ID && !authorized) {
      json(response, { message: 'Private primer' }, 401);
    } else {
      json(response, {
        listId: id,
        text: id === PRIVATE_ID ? PRIVATE_TEXT : content,
      });
    }
    return;
  }
  if (path.startsWith('/supabase/card-lists/view/')) {
    const id = path.split('/').pop()!;
    if (id === PRIVATE_ID) {
      json(response, { message: 'Not found' }, 404);
    } else {
      json(response, {
        decklist: decklist(id),
        items: [],
        owner: {
          id: FAKE_USER.id,
          username: 'fixture-writer',
          avatar_card_name: null,
          is_featured: false,
        },
      });
    }
    return;
  }
  if (path.startsWith('/supabase/card-lists/mine/')) {
    json(
      response,
      { decklist: decklist(path.split('/').pop()!) },
      authorized ? 200 : 401,
    );
    return;
  }
  if (path === '/supabase-auth/auth/v1/user') {
    json(response, FAKE_USER);
    return;
  }
  if (path === '/supabase-auth/rest/v1/profiles') {
    json(response, {
      id: FAKE_USER.id,
      username: 'fixture-writer',
      avatar_card_name: null,
    });
    return;
  }
  if (path === '/bulkdata/partner-commanders') {
    json(response, {
      partner: [],
      chooseABackground: [],
      background: [],
      doctorsCompanion: [],
      timeLordDoctor: [],
    });
    return;
  }
  json(response, []);
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  return (server.address() as AddressInfo).port;
}

async function close(server: Server) {
  await new Promise<void>((done, reject) =>
    server.close((error) => (error ? reject(error) : done())),
  );
}

test.beforeAll(async () => {
  test.setTimeout(60_000);
  backend = createServer((request, response) => {
    void handleFixture(request, response).catch((error) =>
      json(response, { message: String(error) }, 500),
    );
  });
  backendUrl = 'http://127.0.0.1:' + (await listen(backend));
  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  previewUrl = 'http://127.0.0.1:' + port;
  preview = spawn(process.execPath, [resolve('.output/server/index.mjs')], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: String(port),
      NUXT_BACKEND_URL: backendUrl,
      NUXT_BACKEND_API_KEY: 'fixture-backend-key-at-least-32-characters',
      NUXT_FRONTEND_URL: previewUrl,
      NUXT_PUBLIC_SUPABASE_URL: backendUrl + '/supabase-auth',
      NUXT_PUBLIC_SUPABASE_KEY: 'test-anon-key',
      NUXT_PUBLIC_MAINTENANCE_MODE: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const capture = (chunk: Buffer) => {
    previewLogs = (previewLogs + chunk.toString()).slice(-12_000);
  };
  preview.stdout?.on('data', capture);
  preview.stderr?.on('data', capture);
  preview.on('error', (error) => {
    previewLogs += String(error);
  });
  await expect
    .poll(
      async () => {
        if (preview.exitCode !== null || preview.signalCode !== null) {
          throw new Error('Isolated Nitro preview exited:\n' + previewLogs);
        }
        try {
          return (await fetch(previewUrl + '/favicon.ico')).status;
        } catch {
          return 0;
        }
      },
      {
        timeout: 30_000,
        message: 'Wait for the isolated production Nitro preview',
      },
    )
    .toBe(200);
});

test.afterAll(async () => {
  if (preview && preview.exitCode === null && preview.signalCode === null) {
    const exited = once(preview, 'exit');
    preview.kill('SIGTERM');
    const timeout = setTimeout(() => preview.kill('SIGKILL'), 5000);
    try {
      await exited;
    } finally {
      clearTimeout(timeout);
    }
  }
  if (backend?.listening) await close(backend);
});

test.beforeEach(() => {
  batches.length = 0;
  fixtureRequests.length = 0;
  gatewayRequests.length = 0;
});

for (const [kind, path] of [
  ['article', '/articles/' + ARTICLE_ID],
  ['primer', '/lists/' + LIST_ID + '/primer'],
]) {
  test(
    kind +
      ' sends readable, safe markdown and canonical card links without JavaScript',
    async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.route('https://**', (route) => route.abort());
      try {
        const response = await page.goto(previewUrl + path);
        expect(response?.status()).toBe(200);
        const html = await response!.text();
        expect(html).toContain('SSR body visible before JavaScript');
        expect(html).not.toContain(
          'fixture-backend-key-at-least-32-characters',
        );
        const ssrRequests = fixtureRequests.filter(
          (entry) =>
            entry.path.startsWith('/cards/') ||
            entry.path.startsWith('/articles/') ||
            entry.path.startsWith('/supabase/card-lists/'),
        );
        expect(ssrRequests.length).toBeGreaterThan(0);
        expect(
          ssrRequests.every(
            (entry) =>
              entry.clientIp === '127.0.0.1' ||
              entry.clientIp === '::ffff:127.0.0.1',
          ),
          JSON.stringify(ssrRequests),
        ).toBe(true);
        expect(html).toContain('/card/' + BOLT_ID);
        const body = page.locator('.primer-preview');
        await expect(
          body.getByRole('heading', {
            name: 'SSR body visible before JavaScript',
          }),
        ).toHaveCount(1);
        await expect(
          body
            .getByRole('heading', { name: 'Colored heading' })
            .locator('span'),
        ).toHaveCSS('color', 'rgb(220, 38, 38)');
        await expect(body.getByText('blue text', { exact: true })).toHaveCSS(
          'color',
          'rgb(37, 99, 235)',
        );
        await expect(body.getByText('blue text', { exact: true })).toHaveCSS(
          'position',
          'static',
        );
        const links = body.locator('a.card-inline-link');
        await expect(links).toHaveCount(3);
        await expect(links.nth(0)).toHaveAttribute('href', '/card/' + BOLT_ID);
        await expect(links.nth(1)).toHaveAttribute(
          'href',
          '/card/' + ORACLE_ID,
        );
        await expect(links.nth(2)).toHaveAttribute('href', '/card/' + BOLT_ID);
        await expect(body.locator('a.card-inline-img-link')).toHaveAttribute(
          'href',
          '/card/' + BOLT_ID,
        );
        await expect(
          body.locator('.card-unknown').filter({ hasText: 'Unknown Card' }),
        ).toHaveCount(1);
        await expect(
          body.locator('.card-unknown').filter({ hasText: 'Invalid ID Card' }),
        ).toHaveCount(1);
        await expect(
          body.locator(
            '.card-unknown img, script, [onerror], a[href^="javascript:"]',
          ),
        ).toHaveCount(0);
        await expect(body.locator('iframe')).toHaveCount(1);
        await expect(body.locator('.youtube-embed iframe')).toHaveAttribute(
          'src',
          'https://www.youtube.com/embed/dQw4w9WgXcQ',
        );
        await expect(body.locator('.ms-r')).toHaveCount(1);
        await expect(body.locator('details summary')).toHaveText(
          'Strategy details',
        );
        await expect(body.locator('table td').first()).toHaveText(
          'Lightning Bolt',
        );
        await expect(body.locator('input[type="checkbox"]')).toBeChecked();
        expect(batches).toHaveLength(1);
        expect(
          batches[0].filter((name) => name === 'Lightning Bolt'),
        ).toHaveLength(1);
        expect(new Set(batches[0]).size).toBe(batches[0].length);
        expect(fixtureRequests.every((request) => !request.authorized)).toBe(
          true,
        );
        const searchEmbed = body.locator('.search-embed');
        await expect(
          searchEmbed.getByRole('link', {
            name: 'Smart Search: draw cards',
            exact: true,
          }),
        ).toHaveAttribute(
          'href',
          '/search/all/smart?searchType=smart&query=draw%20cards&limit=12',
        );
        await expect(searchEmbed.getByRole('searchbox')).toHaveValue(
          'draw cards',
        );
        await expect(
          body.getByRole('link', { name: 'draw cards', exact: true }),
        ).toHaveAttribute(
          'href',
          'https://cardmystic.com/search/all/smart?searchType=smart&query=draw%20cards&limit=12',
        );
        // JavaScript is disabled: the rendered GET form must still navigate.
        await page.route('**/search/all/smart?**', (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: '<p>Search destination</p>',
          }),
        );
        await searchEmbed.getByRole('searchbox').fill('draw more cards');
        await searchEmbed.getByRole('button', { name: 'TRY ME' }).click();
        await expect(page).toHaveURL(/\/search\/all\/smart\?/);
        expect(new URL(page.url()).searchParams.get('query')).toBe(
          'draw more cards',
        );
        expect(new URL(page.url()).searchParams.get('limit')).toBe('12');
      } finally {
        await context.close();
      }
    },
  );
}

for (const site of ['cross-site', 'same-site']) {
  test(`${site} navigation keeps card, article, and primer SSR data`, async ({
    request,
  }) => {
    const headers = {
      'sec-fetch-site': site,
      'sec-fetch-mode': 'navigate',
      'sec-fetch-dest': 'document',
      origin: 'https://external.example',
    };
    for (const [path, expectedText] of [
      ['/card/' + BOLT_ID, 'Lightning Bolt (MTG) - CardMystic'],
      ['/articles/' + ARTICLE_ID, 'SSR body visible before JavaScript'],
      ['/lists/' + LIST_ID + '/primer', 'SSR body visible before JavaScript'],
    ]) {
      const response = await request.get(previewUrl + path, { headers });
      expect(response.status(), path).toBe(200);
      expect(await response.text(), path).toContain(expectedText);
    }
    expect(fixtureRequests.length).toBeGreaterThan(0);
    for (const upstream of fixtureRequests) {
      expect(['127.0.0.1', '::ffff:127.0.0.1']).toContain(upstream.clientIp);
      expect(upstream.origin).toBeUndefined();
      expect(upstream.fetchSite).toBeUndefined();
      // Node fetch may add its own cors mode after navigation headers are removed.
      expect(upstream.fetchMode).not.toBe('navigate');
      expect(upstream.fetchDest).toBeUndefined();
    }

    // Browser-supplied headers must never impersonate inherited Nitro context.
    fixtureRequests.length = 0;
    const direct = await request.get(
      previewUrl + '/api/backend/cards/with-llm/' + BOLT_ID,
      {
        headers: {
          ...headers,
          origin: previewUrl,
          backendInternalRequest: 'true',
          'x-backend-internal-request': 'true',
        },
      },
    );
    expect(direct.status()).toBe(403);
    expect(fixtureRequests).toHaveLength(0);
  });
}

test('an external card link renders successfully before and after hydration', async ({
  page,
}) => {
  await page.route('https://**', (route) => route.abort());
  // localhost -> 127.0.0.1 produces a real cross-site browser navigation.
  await page.goto(
    backendUrl.replace('127.0.0.1', 'localhost') + '/external-card-link',
  );
  const navigation = page.waitForResponse(
    (response) => response.url() === previewUrl + '/card/' + BOLT_ID,
  );
  await page.getByRole('link', { name: 'View Lightning Bolt' }).click();
  const response = await navigation;
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('Lightning Bolt (MTG) - CardMystic');
  await waitForHydration(page);
  await expect(page.locator('.card-title-text')).toHaveText('Lightning Bolt');
  expect(
    fixtureRequests.filter(
      (entry) => entry.path === '/cards/with-llm/' + BOLT_ID,
    ),
  ).toHaveLength(1);
});

test('a failed card lookup leaves the server-rendered article readable', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://**', (route) => route.abort());
  try {
    const response = await page.goto(previewUrl + '/articles/' + FAILURE_ID);
    expect(response?.status()).toBe(200);
    await expect(page.locator('.primer-preview')).toContainText(
      'Lookup failure stays readable',
    );
    await expect(page.locator('.card-unknown')).toHaveCount(2);
    await expect(
      page.locator('.card-inline-link, .card-inline-img-link'),
    ).toHaveCount(0);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual(['Unavailable Card']);
  } finally {
    await context.close();
  }
});

test('anonymous SSR keeps draft and private text out of both HTML and payload', async ({
  request,
}) => {
  for (const [path, forbiddenText] of [
    ['/articles/' + DRAFT_ID, DRAFT_TEXT],
    ['/lists/' + PRIVATE_ID + '/primer', PRIVATE_TEXT],
  ]) {
    const response = await request.get(previewUrl + path);
    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toContain(forbiddenText);
  }
  expect(
    fixtureRequests.some(
      (request) => request.path === '/articles/view/' + DRAFT_ID,
    ),
  ).toBe(true);
  expect(
    fixtureRequests.some(
      (request) => request.path === '/supabase/card-lists/primer/' + PRIVATE_ID,
    ),
  ).toBe(true);
  expect(fixtureRequests.every((request) => !request.authorized)).toBe(true);
  expect(batches).toHaveLength(0);
});

test('public article hydration preserves SSR links without repeating the card batch', async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (/hydration.*mismatch|mismatch.*hydration/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  await page.route('https://**', (route) => route.abort());
  await page.goto(previewUrl + '/articles/' + ARTICLE_ID);
  await waitForHydration(page);
  await expect(page.locator('a.card-inline-link')).toHaveCount(3);
  await page.locator('a.card-inline-link').first().hover();
  await expect(page.locator('.editor-card-preview img')).toHaveAttribute(
    'src',
    '/ugin.webp',
  );
  expect(batches).toHaveLength(1);
  expect(await page.evaluate(() => '__markdownInjected' in window)).toBe(false);
  expect(hydrationErrors).toEqual([]);
});

test('a private primer loads for its owner after anonymous SSR without leaking its body', async ({
  page,
}) => {
  await page.route('https://**', (route) => route.abort());
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem(
        'sb-127-auth-token',
        JSON.stringify({
          access_token: token,
          refresh_token: 'fixture-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user,
        }),
      );
    },
    { token: OWNER_TOKEN, user: FAKE_USER },
  );
  const response = await page.goto(
    previewUrl + '/lists/' + PRIVATE_ID + '/primer',
  );
  expect(response?.status()).toBe(200);
  expect(await response!.text()).not.toContain(PRIVATE_TEXT);
  await waitForHydration(page);
  await expect(
    page.getByRole('textbox', { name: 'Markdown editor', exact: true }),
  ).toHaveText(PRIVATE_TEXT);
  const primerRequests = fixtureRequests.filter(
    (request) => request.path === '/supabase/card-lists/primer/' + PRIVATE_ID,
  );
  expect(primerRequests[0].authorized).toBe(false);
  expect(primerRequests.some((request) => request.authorized)).toBe(true);
});

test('gateway authenticates upstream, preserves JWT/body/errors, and blocks foreign origins and private routes', async ({
  request,
}) => {
  const direct = await request.get(backendUrl + '/cards/cards-by-names');
  expect(direct.status()).toBe(401);
  const foreign = await request.post(
    previewUrl + '/api/backend/search/keyword',
    {
      headers: {
        origin: 'https://foreign.example',
        'sec-fetch-site': 'cross-site',
      },
      data: { query: 'blocked' },
    },
  );
  expect(foreign.status()).toBe(403);
  const diagnostics = await request.get(
    previewUrl + '/api/backend/cache/stats',
  );
  expect(diagnostics.status()).toBe(404);
  expect(gatewayRequests).toEqual([]);

  const response = await request.post(
    previewUrl + '/api/backend/search/keyword',
    {
      headers: {
        origin: previewUrl,
        'sec-fetch-site': 'same-origin',
        authorization: 'Bearer ' + OWNER_TOKEN,
        'x-api-key': 'attacker-key',
        'x-cardmystic-client-ip': '6.6.6.6',
        'x-forwarded-for': '6.6.6.6',
        cookie: 'should-not-reach-backend=1',
      },
      data: { query: 'card draw', limit: 40 },
    },
  );
  expect(response.status()).toBe(429);
  expect(await response.json()).toEqual({ message: 'Too many requests' });
  expect(response.headers()['retry-after']).toBe('9');
  expect(response.headers()['cache-control']).toBe('private, no-store');
  for (const header of [
    'x-api-key',
    'set-cookie',
    'access-control-allow-origin',
  ]) {
    expect(response.headers()[header]).toBeUndefined();
  }
  expect(gatewayRequests).toHaveLength(1);
  expect(JSON.parse(gatewayRequests[0].body)).toEqual({
    query: 'card draw',
    limit: 40,
  });
  expect(gatewayRequests[0].authorized).toBe(true);
  expect(gatewayRequests[0].cookie).toBeUndefined();
  expect(['127.0.0.1', '::ffff:127.0.0.1']).toContain(
    gatewayRequests[0].clientIp,
  );
});
