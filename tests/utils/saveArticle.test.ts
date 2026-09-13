import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { saveArticle } from '~/utils/saveArticle';

const updates = {
  title: 'Title',
  description: 'Description',
  content: '# Body',
  imageUrl: null,
  isPublished: true,
};
const article = {
  id: '10000000-0000-4000-8000-000000000001',
  user_id: '10000000-0000-4000-8000-000000000002',
  ...updates,
  image_url: null,
  is_published: true,
  published_at: null,
  created_at: '2026-01-01',
  updated_at: null,
  username: null,
  avatar_card_name: null,
  like_count: 0,
  comment_count: 0,
  view_count: 0,
};
function client() {
  const auth = {
    getSession: vi
      .fn()
      .mockResolvedValue({
        data: { session: { access_token: 'old' } },
        error: null,
      }),
    refreshSession: vi
      .fn()
      .mockResolvedValue({
        data: { session: { access_token: 'new' } },
        error: null,
      }),
  };
  return { auth, supabase: { auth } as unknown as SupabaseClient };
}
afterEach(() => vi.unstubAllGlobals());
describe('article saving', () => {
  it('refreshes a rejected token once and resends the exact combined snapshot', async () => {
    const { auth, supabase } = client();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(Response.json({ article }));
    vi.stubGlobal('fetch', fetchMock);
    expect(
      (await saveArticle(supabase, '/articles/id', updates)).article.content,
    ).toBe('# Body');
    expect(auth.refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(updates));
    expect(fetchMock.mock.calls[1][1]).toEqual({
      ...fetchMock.mock.calls[0][1],
      headers: {
        Authorization: 'Bearer new',
        'Content-Type': 'application/json',
      },
    });
  });
  it.each([400, 403, 429, 500])(
    'surfaces the server explanation for %s without repeating a write',
    async (status) => {
      const { auth, supabase } = client();
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          Response.json({ message: 'Specific failure' }, { status }),
        );
      vi.stubGlobal('fetch', fetchMock);
      await expect(
        saveArticle(supabase, '/articles/id', updates),
      ).rejects.toThrow(`Specific failure (${status})`);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(auth.refreshSession).not.toHaveBeenCalled();
    },
  );
  it('stops after a second 401', async () => {
    const { auth, supabase } = client();
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response('{}', { status: 401 })),
      );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      saveArticle(supabase, '/articles/id', updates),
    ).rejects.toThrow('sign in again');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(auth.refreshSession).toHaveBeenCalledOnce();
  });
  it('does not send a write when the session cannot be read', async () => {
    const { auth, supabase } = client();
    auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('offline'),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      saveArticle(supabase, '/articles/id', updates),
    ).rejects.toThrow('check your session');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('explains a network failure without an automatic repeat', async () => {
    const { supabase } = client();
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      saveArticle(supabase, '/articles/id', updates),
    ).rejects.toThrow('check your connection');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
