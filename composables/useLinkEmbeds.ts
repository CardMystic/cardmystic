import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import {
  GetPublicDecklistResponseSchema,
  type GetPublicDecklistResponse,
} from '~/models/cardListModel';
import {
  ArticleResponseSchema,
  type ArticleResponse,
} from '~/models/articleModel';
import {
  GetUserProfileResponseSchema,
  type GetUserProfileResponse,
} from '~/models/userModel';
import type { LinkEmbedTarget } from '~/utils/linkEmbeds';
import { getSeoEntry } from '~/utils/seoQueries';
import { scryfallArtCropUrl } from '~/utils/scryfall';

/** Resolved metadata used to render a single unfurl card. */
export interface LinkEmbedData {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string | null;
  meta: string;
}

const STALE_TIME_MS = 1000 * 60 * 5;

/**
 * Fetches unfurl metadata for every embed target in `targets` and exposes a
 * `url → LinkEmbedData` lookup keyed by the original URL string as it
 * appeared in the source. One query per resource type (decklists, articles,
 * users) fans out to `Promise.all` internally so the network cost scales with
 * the number of unique IDs referenced in a single primer.
 */
export function useLinkEmbeds(targets: Ref<LinkEmbedTarget[]>) {
  const config = useRuntimeConfig();

  const decklistIds = computed(() =>
    dedupeIds(targets.value, 'decklist').sort(),
  );
  const articleIds = computed(() => dedupeIds(targets.value, 'article').sort());
  const userIds = computed(() => dedupeIds(targets.value, 'user').sort());

  const decklistQuery = useQuery({
    queryKey: computed(() => ['embed', 'decklists', decklistIds.value]),
    queryFn: async () => {
      const map = new Map<string, GetPublicDecklistResponse>();
      const results = await Promise.all(
        decklistIds.value.map(async (id) => {
          try {
            const res = await fetch(
              `${config.public.backendUrl}/supabase/card-lists/view/${encodeURIComponent(id)}`,
            );
            if (!res.ok) return null;
            return [
              id,
              GetPublicDecklistResponseSchema.parse(await res.json()),
            ] as const;
          } catch {
            return null;
          }
        }),
      );
      for (const r of results) if (r) map.set(r[0], r[1]);
      return map;
    },
    enabled: computed(() => import.meta.client && decklistIds.value.length > 0),
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const articleQuery = useQuery({
    queryKey: computed(() => ['embed', 'articles', articleIds.value]),
    queryFn: async () => {
      const map = new Map<string, ArticleResponse>();
      const results = await Promise.all(
        articleIds.value.map(async (id) => {
          try {
            const res = await fetch(
              `${config.public.backendUrl}/articles/view/${encodeURIComponent(id)}`,
            );
            if (!res.ok) return null;
            return [id, ArticleResponseSchema.parse(await res.json())] as const;
          } catch {
            return null;
          }
        }),
      );
      for (const r of results) if (r) map.set(r[0], r[1]);
      return map;
    },
    enabled: computed(() => import.meta.client && articleIds.value.length > 0),
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const userQuery = useQuery({
    queryKey: computed(() => ['embed', 'users', userIds.value]),
    queryFn: async () => {
      const map = new Map<string, GetUserProfileResponse>();
      const results = await Promise.all(
        userIds.value.map(async (id) => {
          try {
            const res = await fetch(
              `${config.public.backendUrl}/user/profile/${encodeURIComponent(id)}`,
            );
            if (!res.ok) return null;
            return [
              id,
              GetUserProfileResponseSchema.parse(await res.json()),
            ] as const;
          } catch {
            return null;
          }
        }),
      );
      for (const r of results) if (r) map.set(r[0], r[1]);
      return map;
    },
    enabled: computed(() => import.meta.client && userIds.value.length > 0),
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const isLoading = computed(
    () =>
      decklistQuery.isFetching.value ||
      articleQuery.isFetching.value ||
      userQuery.isFetching.value,
  );

  const embedMap = computed(() => {
    const map = new Map<string, LinkEmbedData>();
    for (const target of targets.value) {
      const data = resolveEmbed(target, {
        decklists: decklistQuery.data.value,
        articles: articleQuery.data.value,
        users: userQuery.data.value,
      });
      if (data) map.set(target.url, data);
    }
    return map;
  });

  return { embedMap, isLoading };
}

function dedupeIds(
  targets: LinkEmbedTarget[],
  type: LinkEmbedTarget['type'],
): string[] {
  const seen = new Set<string>();
  for (const t of targets) if (t.type === type && t.id) seen.add(t.id);
  return [...seen];
}

interface Caches {
  decklists: Map<string, GetPublicDecklistResponse> | undefined;
  articles: Map<string, ArticleResponse> | undefined;
  users: Map<string, GetUserProfileResponse> | undefined;
}

function resolveEmbed(
  target: LinkEmbedTarget,
  caches: Caches,
): LinkEmbedData | null {
  switch (target.type) {
    case 'decklist':
      return resolveDecklist(target, caches.decklists);
    case 'article':
      return resolveArticle(target, caches.articles);
    case 'user':
      return resolveUser(target, caches.users);
    case 'search':
    case 'popular':
      return resolveSearch(target);
  }
}

function resolveDecklist(
  target: LinkEmbedTarget,
  cache: Map<string, GetPublicDecklistResponse> | undefined,
): LinkEmbedData | null {
  if (!target.id || !cache) return null;
  const payload = cache.get(target.id);
  if (!payload) return null;
  const { decklist, owner } = payload;
  const imageUrl = decklist.avatar_card_name
    ? scryfallArtCropUrl(decklist.avatar_card_name)
    : decklist.commanders[0]
      ? scryfallArtCropUrl(decklist.commanders[0])
      : null;
  const parts: string[] = [];
  if (decklist.format) parts.push(prettyFormat(decklist.format));
  if (owner.username) parts.push(`by ${owner.username}`);
  return {
    href: target.href,
    eyebrow: 'Decklist',
    title: decklist.name?.trim() || 'Untitled Decklist',
    description: decklist.description?.trim() || '',
    imageUrl,
    meta: parts.join(' • '),
  };
}

function resolveArticle(
  target: LinkEmbedTarget,
  cache: Map<string, ArticleResponse> | undefined,
): LinkEmbedData | null {
  if (!target.id || !cache) return null;
  const payload = cache.get(target.id);
  if (!payload) return null;
  const { article } = payload;
  const imageUrl =
    article.image_url ||
    (article.avatar_card_name
      ? scryfallArtCropUrl(article.avatar_card_name)
      : null);
  const parts: string[] = [];
  if (article.username) parts.push(`by ${article.username}`);
  if (article.published_at)
    parts.push(new Date(article.published_at).toLocaleDateString());
  return {
    href: target.href,
    eyebrow: 'Article',
    title: article.title,
    description: article.description || '',
    imageUrl,
    meta: parts.join(' • '),
  };
}

function resolveUser(
  target: LinkEmbedTarget,
  cache: Map<string, GetUserProfileResponse> | undefined,
): LinkEmbedData | null {
  if (!target.id || !cache) return null;
  const payload = cache.get(target.id);
  if (!payload) return null;
  const { profile } = payload;
  const imageUrl = profile.avatar_card_name
    ? scryfallArtCropUrl(profile.avatar_card_name)
    : null;
  const followerLabel =
    profile.follower_count === 1
      ? '1 follower'
      : `${profile.follower_count.toLocaleString()} followers`;
  return {
    href: target.href,
    eyebrow: 'User',
    title: profile.username || 'CardMystic user',
    description: '',
    imageUrl,
    meta: profile.is_featured ? `Featured • ${followerLabel}` : followerLabel,
  };
}

function resolveSearch(target: LinkEmbedTarget): LinkEmbedData | null {
  if (!target.search) return null;
  const { platform, searchType, slug } = target.search;

  const seoEntry = slug
    ? getSeoEntry(
        platform as Parameters<typeof getSeoEntry>[0],
        searchType as Parameters<typeof getSeoEntry>[1],
        slug,
      )
    : undefined;

  const platformLabel = prettyPlatform(platform);
  const typeLabel = prettySearchType(searchType);
  const eyebrow = `${platformLabel} ${typeLabel}`;
  const title =
    seoEntry?.title || (slug ? deslug(slug) : `${typeLabel} search`);
  const description =
    seoEntry?.description || (slug ? `Explore ${title} on CardMystic.` : '');
  return {
    href: target.href,
    eyebrow,
    title,
    description,
    imageUrl: null,
    meta: '',
  };
}

function prettyFormat(format: string): string {
  if (!format) return '';
  return format.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyPlatform(platform: string): string {
  switch (platform) {
    case 'all':
      return 'CardMystic';
    case 'arena':
      return 'Arena';
    case 'mtgo':
      return 'MTGO';
    case 'modern':
      return 'Modern';
    case 'paper':
      return 'Paper';
    default:
      return platform.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function prettySearchType(searchType: string): string {
  switch (searchType) {
    case 'smart':
      return 'Smart Search';
    case 'similarity':
      return 'Similarity';
    case 'keyword':
      return 'Keyword Search';
    case 'commander':
      return 'Commander Search';
    case 'deckbuilder':
      return 'Deck Recommender';
    case 'popular-cards':
      return 'Popular Cards';
    case 'popular-commanders':
      return 'Popular Commanders';
    case 'popular-by-commander':
      return 'Popular by Commander';
    default:
      return searchType.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function deslug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
