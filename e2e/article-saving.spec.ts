import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import {
  BACKEND,
  SUPABASE as SUPABASE_URL,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

const sanitizeHtml = createRequire(import.meta.url)('sanitize-html');

const initial = {
  id: '10000000-0000-4000-8000-000000000001',
  user_id: FAKE_USER.id,
  title: 'Initial title',
  description: 'Initial description',
  content: '# Initial content',
  image_url: null,
  is_published: false,
  published_at: null,
  created_at: '2026-01-01',
  updated_at: null,
  username: 'writer',
  avatar_card_name: null,
  like_count: 0,
  comment_count: 0,
  view_count: 0,
};
const endpoint = `${BACKEND}/articles/${initial.id}`;
test.beforeEach(async ({ page }) => {
  await mockSupabaseAuth(page);
  await page.route(`${SUPABASE_URL}/rest/v1/profiles**`, (route) =>
    route.fulfill({
      json: {
        id: FAKE_USER.id,
        username: 'writer',
        is_author: true,
        avatar_card_name: null,
      },
    }),
  );
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    {
      key: `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`,
      session: {
        access_token: fakeJwt(),
        refresh_token: 'fake-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: FAKE_USER,
      },
    },
  );
  await page.route(`${BACKEND}/articles/view/${initial.id}`, (route) =>
    route.fulfill({ json: { article: initial } }),
  );
  // Enter via client navigation so no live server request is needed for the article.
  await gotoHydrated(page, '/about');
  // Nuxt navigation preserves the mocked client auth without an SSR article read.
  await page.evaluate((href) => {
    const app = (
      document.getElementById('__nuxt') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: {
              $router: { push: (url: string) => Promise<unknown> };
            };
          };
        };
      }
    ).__vue_app__;
    return app.config.globalProperties.$router.push(href);
  }, `/articles/${initial.id}/edit`);
  await expect(page.getByPlaceholder('Article title')).toHaveValue(
    initial.title,
  );
});

test('one button saves details and content, preserves failed edits, and works in full preview', async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  let fail = true;
  await page.route(endpoint, (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    return route.fulfill(
      fail
        ? { status: 500, json: { message: 'Database temporarily unavailable' } }
        : {
            json: {
              article: {
                ...initial,
                ...body,
                image_url: body.imageUrl,
                is_published: body.isPublished,
              },
            },
          },
    );
  });
  await page.getByPlaceholder('Article title').fill('Updated title');
  await page
    .getByPlaceholder('What is this article about?')
    .fill('Updated description');
  await page
    .getByRole('textbox', { name: 'Markdown editor', exact: true })
    .fill('# Updated content');
  await page.getByRole('switch').click();
  const save = page.getByRole('button', { name: 'Save Article', exact: true });
  await expect(save).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Save Details' })).toHaveCount(
    0,
  );
  await save.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Article could not be saved' }),
  ).toContainText('Database temporarily unavailable (500)');
  await expect(
    page.getByRole('textbox', { name: 'Markdown editor', exact: true }),
  ).toHaveText('# Updated content');
  expect(requests).toEqual([
    {
      title: 'Updated title',
      description: 'Updated description',
      content: '# Updated content',
      imageUrl: null,
      isPublished: true,
    },
  ]);
  fail = false;
  await save.click();
  await expect(
    page.getByRole('button', { name: 'Saved', exact: true }),
  ).toBeDisabled();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
  await page.getByPlaceholder('Article title').fill('Details only');
  await page.getByRole('link', { name: 'Back to Article' }).click();
  await expect(
    page.getByText('You have unsaved changes. Are you sure you want to leave?'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Stay', exact: true }).click();
  await page.getByRole('button', { name: 'View Preview' }).click();
  await save.click();
  await expect(
    page.getByRole('button', { name: 'Saved', exact: true }),
  ).toBeDisabled();
  expect(requests[2]).toMatchObject({
    title: 'Details only',
    content: '# Updated content',
  });
});

test('edits made while saving stay unsaved and survive the response', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: Record<string, unknown>[] = [];
  await page.route(endpoint, async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    await gate;
    await route.fulfill({ json: { article: { ...initial, ...body } } });
  });
  await page
    .getByRole('textbox', { name: 'Markdown editor', exact: true })
    .fill('Submitted content');
  await page.getByPlaceholder('Article title').fill('Submitted title');
  const save = page.getByRole('button', { name: 'Save Article', exact: true });
  await save.click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(save).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Markdown editor', exact: true })
    .fill('Newer content');
  await page.getByPlaceholder('Article title').fill('Newer title');
  release();
  await expect(save).toBeEnabled();
  await expect(
    page.getByRole('textbox', { name: 'Markdown editor', exact: true }),
  ).toHaveText('Newer content');
  await expect(page.getByPlaceholder('Article title')).toHaveValue(
    'Newer title',
  );
  await save.click();
  await expect(
    page.getByRole('button', { name: 'Saved', exact: true }),
  ).toBeDisabled();
  expect(requests.map((request) => request.content)).toEqual([
    'Submitted content',
    'Newer content',
  ]);
});

test('a token refresh and failed background user lookup do not discard the draft', async ({
  page,
}) => {
  let attempts = 0;
  let failedUserChecks = 0;
  await page.route(`${SUPABASE_URL}/auth/v1/user**`, (route) => {
    failedUserChecks++;
    return route.fulfill({
      status: 503,
      json: { message: 'Auth temporarily unavailable' },
    });
  });
  await page.route(endpoint, (route) => {
    attempts++;
    return route.fulfill(
      attempts === 1
        ? { status: 401, json: { message: 'Unauthorized' } }
        : { status: 500, json: { message: 'Try later' } },
    );
  });
  await page
    .getByRole('textbox', { name: 'Markdown editor', exact: true })
    .fill('Keep this draft');
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Article could not be saved' }),
  ).toContainText('Try later (500)');
  await expect.poll(() => failedUserChecks).toBeGreaterThan(0);
  await expect(
    page.getByRole('textbox', { name: 'Markdown editor', exact: true }),
  ).toHaveText('Keep this draft');
  await expect(
    page.getByRole('button', { name: 'Save Article', exact: true }),
  ).toBeEnabled();
  expect(attempts).toBe(2);
});

test('cancelled navigation and an uncertain save never delete the draft cover image', async ({
  page,
}) => {
  let removals = 0;
  await page.route(
    `${SUPABASE_URL}/storage/v1/object/article-images**`,
    (route) => {
      if (route.request().method() === 'DELETE') removals++;
      return route.fulfill({ json: { Key: 'article-images/test-cover.png' } });
    },
  );
  await page.locator('input[type=file]').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVp0AAAAASUVORK5CYII=',
      'base64',
    ),
  });
  const cover = page.getByAltText('Cover image', { exact: true });
  await expect(cover).toBeVisible();
  const url = await cover.getAttribute('src');
  await page.getByRole('link', { name: 'Back to Article' }).click();
  await page.getByRole('button', { name: 'Stay', exact: true }).click();
  expect(removals).toBe(0);
  await expect(cover).toHaveAttribute('src', url!);
  await page.route(endpoint, (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Article could not be saved' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to Article' }).click();
  await page
    .getByRole('button', { name: 'Leave without saving', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/articles/${initial.id}$`));
  expect(removals).toBe(0);
});

test('an expired session keeps the editor open so the writer can sign in and retry', async ({
  page,
}) => {
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) =>
    route.fulfill({
      status: 400,
      json: {
        code: 'refresh_token_not_found',
        message: 'Refresh token not found',
      },
    }),
  );
  await page.getByPlaceholder('Article title').fill('Unsaved title');
  await page
    .getByRole('textbox', { name: 'Markdown editor', exact: true })
    .fill('Unsaved draft');
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Article could not be saved' }),
  ).toContainText('sign in again');
  await expect(page.getByPlaceholder('Article title')).toHaveValue(
    'Unsaved title',
  );
  await expect(
    page.getByRole('textbox', { name: 'Markdown editor', exact: true }),
  ).toHaveText('Unsaved draft');
});

test('429 preserves the draft and displays the wait message without replaying the save', async ({
  page,
}) => {
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    return route.fulfill({ status: 429, body: 'Rate limited' });
  });
  await page.getByPlaceholder('Article title').fill('Keep this title');
  await page
    .getByRole('textbox', { name: 'Markdown editor', exact: true })
    .fill('# Keep this draft');
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  const alert = page
    .getByRole('alert')
    .filter({ hasText: 'Article could not be saved' });
  await expect(alert).toContainText(
    '429 Too Many Requests, Try again in 60 seconds',
  );
  await expect(
    page.getByRole('textbox', { name: 'Markdown editor', exact: true }),
  ).toHaveText('# Keep this draft');
  await expect(page.getByPlaceholder('Article title')).toHaveValue(
    'Keep this title',
  );
  expect(requests).toBe(1);
});

test('formatting, selection and undo survive switching editor modes', async ({
  page,
}) => {
  const editor = page.getByRole('textbox', {
    name: 'Markdown editor',
    exact: true,
  });
  await editor.fill('Selected words');
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(editor).toHaveText('**Selected words**');
  await page
    .getByRole('button', { name: 'Split Preview', exact: true })
    .click();
  await expect(page.locator('.primer-preview strong')).toHaveText(
    'Selected words',
  );
  await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
  await page.getByRole('button', { name: 'View Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
  // The original selection is still selected, even after hiding the editor.
  await page.getByRole('button', { name: 'Italic', exact: true }).click();
  await expect(editor).toHaveText('**_Selected words_**');
  await editor.press('ControlOrMeta+z');
  await expect(editor).toHaveText('**Selected words**');
  await editor.press('ControlOrMeta+z');
  await expect(editor).toHaveText('Selected words');
  await editor.press('ControlOrMeta+Shift+Z');
  await expect(editor).toHaveText('**Selected words**');
});

test('custom syntax, hover images and symbol pickers work in the source editor', async ({
  page,
}) => {
  await page.route(`${BACKEND}/cards/cards-by-names`, (route) =>
    route.fulfill({
      json: [
        {
          name: 'Sol Ring',
          oracle_id: '00000000-0000-4000-8000-000000000001',
          image_uris: { normal: '/ugin.webp' },
        },
      ],
    }),
  );
  const editor = page.getByRole('textbox', {
    name: 'Markdown editor',
    exact: true,
  });
  await editor.fill('[[Sol Ring]] ((Sol Ring)) {R} :smile:');
  await expect(editor.locator('.cm-card-link')).toHaveText('[[Sol Ring]]');
  await expect(editor.locator('.cm-card-image')).toHaveText('((Sol Ring))');
  await expect(editor.locator('.cm-mana-symbol')).toHaveText('{R}');
  await expect(editor.locator('.cm-emoji')).toHaveText(':smile:');
  await expect
    .poll(async () => {
      await editor.locator('.cm-card-link').hover();
      return page.locator('img[src="/ugin.webp"]').count();
    })
    .toBeGreaterThan(0);
  await editor.press('ControlOrMeta+End');
  await page.getByRole('button', { name: 'Insert emoji', exact: true }).click();
  await page.getByTitle(':fire:', { exact: true }).click();
  await expect(editor).toContainText(':fire:');
  await page
    .getByRole('button', { name: 'Insert Magic symbol', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Insert White mana', exact: true })
    .click();
  await expect(editor).toContainText('{W}');
  await expect(editor.locator('.cm-mana-symbol').last()).toHaveText('{W}');
});

test('split preview waits for a typing pause while saving uses the latest draft', async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route(endpoint, (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    return route.fulfill({ json: { article: { ...initial, ...body } } });
  });
  const editor = page.getByRole('textbox', {
    name: 'Markdown editor',
    exact: true,
  });
  await page
    .getByRole('button', { name: 'Split Preview', exact: true })
    .click();
  const preview = page.locator('.primer-preview');
  await expect(preview).toContainText('Initial content');
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await editor.fill('# Fresh draft');
  await page.clock.runFor(100);
  await expect(editor).toHaveText('# Fresh draft');
  await expect(preview).toContainText('Initial content');
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect.poll(() => requests.at(-1)?.content).toBe('# Fresh draft');
  await page.clock.runFor(201);
  await expect(preview).toContainText('Fresh draft');

  await editor.fill('# Open immediately');
  await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
  await page.getByRole('button', { name: 'View Preview', exact: true }).click();
  await expect(preview).toContainText('Open immediately');
});

test('large drafts render only visible source lines and preserve the full saved text', async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route(endpoint, (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    return route.fulfill({ json: { article: { ...initial, ...body } } });
  });
  const editor = page.getByRole('textbox', {
    name: 'Markdown editor',
    exact: true,
  });
  const content = Array.from(
    { length: 1500 },
    (_, i) => `Paragraph ${i}: **Strategy** and _synergy_ with the deck.\n`,
  ).join('\n');
  await editor.fill(content);
  await editor.press('ControlOrMeta+End');
  await editor.pressSequentially('Latest ending');
  expect(await editor.locator('.cm-line').count()).toBeLessThan(200);
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect
    .poll(() => requests.at(-1)?.content)
    .toBe(content + 'Latest ending');
});

test('colors headings and paragraph selections, supports custom colors, and saves the formatting', async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route(endpoint, (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    const content = sanitizeHtml(body.content, {
      allowedTags: ['details', 'summary'],
      allowedAttributes: { details: ['open'] },
      disallowedTagsMode: 'discard',
    });
    return route.fulfill({
      json: { article: { ...initial, ...body, content } },
    });
  });
  const editor = page.getByRole('textbox', {
    name: 'Markdown editor',
    exact: true,
  });
  await editor.fill('# Colored heading\n\nNormal paragraph with emphasis.');
  await editor.press('ControlOrMeta+Home');
  await editor.press('Shift+End');
  await page.getByRole('button', { name: 'Text color', exact: true }).click();
  await page.getByRole('button', { name: 'Red', exact: true }).click();
  await page
    .getByRole('button', { name: 'Split Preview', exact: true })
    .click();
  const preview = page.locator('.primer-preview');
  const title = preview
    .getByRole('heading', { name: 'Colored heading' })
    .locator('span');
  await expect(title).toHaveCSS('color', 'rgb(220, 38, 38)');

  // The selected heading text stays selected so another color replaces it.
  await page.getByRole('button', { name: 'Text color', exact: true }).click();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await expect(title).toHaveCSS('color', 'rgb(37, 99, 235)');
  await editor.press('ControlOrMeta+z');
  await expect(title).toHaveCSS('color', 'rgb(220, 38, 38)');

  await editor.press('ControlOrMeta+End');
  await editor.press('ArrowLeft');
  for (let i = 0; i < 'emphasis'.length; i++)
    await editor.press('Shift+ArrowLeft');
  await page.getByRole('button', { name: 'Text color', exact: true }).click();
  await page.getByLabel('Custom text color', { exact: true }).fill('#123abc');
  await page.getByRole('button', { name: 'Apply color', exact: true }).click();
  await expect(preview.locator('p span')).toHaveText('emphasis');
  await expect(preview.locator('p span')).toHaveCSS(
    'color',
    'rgb(18, 58, 188)',
  );
  await expect(preview.locator('p')).toHaveText(
    'Normal paragraph with emphasis.',
  );

  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect
    .poll(() => requests.at(-1)?.content)
    .toBe(
      '# [Colored heading]{color=#dc2626}\n\nNormal paragraph with [emphasis]{color=#123abc}.',
    );
  await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
  await page.getByRole('button', { name: 'View Preview', exact: true }).click();
  await expect(title).toHaveCSS('color', 'rgb(220, 38, 38)');
  await expect(preview.locator('p span')).toHaveCSS(
    'color',
    'rgb(18, 58, 188)',
  );
});

test('the search embed toolbar inserts separate highlighted syntax and previews it', async ({
  page,
}) => {
  const editor = page.getByRole('textbox', {
    name: 'Markdown editor',
    exact: true,
  });
  await editor.fill('');
  const url =
    'https://cardmystic.com/search/all/smart?searchType=smart&query=draw%20cards';
  page.once('dialog', (dialog) => dialog.accept(url));
  await page
    .getByRole('button', { name: 'Embed a CardMystic search', exact: true })
    .click();
  await expect(editor.locator('.cm-search-embed')).toHaveText(
    '@[search](' + url + ')',
  );
  await page
    .getByRole('button', { name: 'Split Preview', exact: true })
    .click();
  const embed = page.locator('.primer-preview .search-embed');
  await expect(
    embed.getByRole('link', { name: 'Smart Search: draw cards', exact: true }),
  ).toBeVisible();
  await expect(
    embed.getByRole('searchbox', { name: 'Smart Search query' }),
  ).toHaveValue('draw cards');
  await expect(embed.getByRole('button', { name: 'TRY ME' })).toBeVisible();
});
