import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ArticleResponseSchema,
  type UpdateArticleRequest,
} from '~/models/articleModel';

/** Save one snapshot; only retry a rejected token, never an ambiguous write. */
export async function saveArticle(
  supabase: SupabaseClient,
  url: string,
  updates: UpdateArticleRequest,
) {
  const { data, error } = await supabase.auth.getSession();
  if (error)
    throw new Error(
      'Could not check your session. Your changes are still here; please try again.',
    );
  if (!data.session)
    throw new Error(
      'Please sign in again in another tab, then retry saving here.',
    );

  const body = JSON.stringify(updates);
  const send = (token: string) =>
    fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

  let response: Response;
  try {
    response = await send(data.session.access_token);
    if (response.status === 401) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) {
        throw new Error(
          'Please sign in again in another tab, then retry saving here.',
        );
      }
      response = await send(refreshed.data.session.access_token);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Could not reach the server. Your changes are still here; check your connection and retry saving.',
      );
    }
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Please sign in again in another tab, then retry saving here. (401)',
      );
    }
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.message === 'string'
        ? errorBody.message
        : 'Could not save the article. Please try again.';
    throw new Error(
      `${message} (${response.status}). Your changes are still here.`,
    );
  }
  return ArticleResponseSchema.parse(await response.json());
}
