import { expect, test } from '@playwright/test';
import {
  BACKEND,
  SUPABASE as SUPABASE_URL,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

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
  await page.locator('textarea.editor-textarea').fill('# Updated content');
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
  await expect(page.locator('textarea.editor-textarea')).toHaveValue(
    '# Updated content',
  );
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
  await page.locator('textarea.editor-textarea').fill('Submitted content');
  await page.getByPlaceholder('Article title').fill('Submitted title');
  const save = page.getByRole('button', { name: 'Save Article', exact: true });
  await save.click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(save).toBeDisabled();
  await page.locator('textarea.editor-textarea').fill('Newer content');
  await page.getByPlaceholder('Article title').fill('Newer title');
  release();
  await expect(save).toBeEnabled();
  await expect(page.locator('textarea.editor-textarea')).toHaveValue(
    'Newer content',
  );
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
  await page.locator('textarea.editor-textarea').fill('Keep this draft');
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Article could not be saved' }),
  ).toContainText('Try later (500)');
  await expect.poll(() => failedUserChecks).toBeGreaterThan(0);
  await expect(page.locator('textarea.editor-textarea')).toHaveValue(
    'Keep this draft',
  );
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
  await page.locator('textarea.editor-textarea').fill('Unsaved draft');
  await page.getByRole('button', { name: 'Save Article', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Article could not be saved' }),
  ).toContainText('sign in again');
  await expect(page.getByPlaceholder('Article title')).toHaveValue(
    'Unsaved title',
  );
  await expect(page.locator('textarea.editor-textarea')).toHaveValue(
    'Unsaved draft',
  );
});
