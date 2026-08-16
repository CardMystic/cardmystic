import type { Article } from '~/models/articleModel';
import type { DecklistSummary } from '~/models/cardListModel';
import type { PublicProfile } from '~/models/userModel';
import { scryfallArtCropUrl } from '~/utils/scryfall';

export const FALLBACK_OG_IMAGE = 'https://cardmystic.com/cardmystic_cards.png';

export interface SeoMeta {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  robots: string;
}

/**
 * Strip common Markdown syntax and return a plain-text excerpt suitable for
 * `<meta name="description">`. Truncates with an ellipsis at `max` chars.
 */
export function excerptFromMarkdown(md: string, max = 200): string {
  const plain = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trimEnd()}…`;
}

export function buildArticleSeo(article: Article | null): SeoMeta {
  if (!article) {
    return {
      title: 'Article | CardMystic',
      description: 'Read Magic: The Gathering articles on CardMystic.',
      image: FALLBACK_OG_IMAGE,
      imageAlt: 'CardMystic article',
      robots: 'noindex, nofollow',
    };
  }

  const desc = article.description?.trim();
  const excerpt = desc || excerptFromMarkdown(article.content ?? '');
  const description =
    excerpt ||
    `Read "${article.title}" on CardMystic — Magic: The Gathering articles by the community.`;

  return {
    title: `${article.title} | CardMystic`,
    description,
    image: article.image_url || FALLBACK_OG_IMAGE,
    imageAlt: article.title,
    robots: article.is_published ? 'index, follow' : 'noindex, nofollow',
  };
}

export function buildDecklistSeo(
  list: DecklistSummary | null,
  ownerUsername?: string | null,
): SeoMeta {
  if (!list) {
    return {
      title: 'Decklist | CardMystic',
      description:
        'Explore Magic: The Gathering decklists shared by the CardMystic community.',
      image: FALLBACK_OG_IMAGE,
      imageAlt: 'CardMystic decklist',
      robots: 'noindex, nofollow',
    };
  }

  const name = list.name || 'Untitled deck';
  const commanders = list.commanders ?? [];

  let description = list.description?.trim() ?? '';
  if (!description) {
    const parts: string[] = [];
    if (list.format) parts.push(list.format);
    if (commanders.length) parts.push(`led by ${commanders.join(' & ')}`);
    const owner = list.username || ownerUsername;
    if (owner) parts.push(`built by ${owner}`);
    const prefix = list.name || 'MTG decklist';
    description = parts.length
      ? `${prefix} — ${parts.join(', ')}. View the full decklist on CardMystic.`
      : `${prefix}. View the full decklist on CardMystic.`;
  }

  // Prefer the owner-chosen avatar, fall back to the first commander so
  // link unfurls still show a themed card image.
  let image = FALLBACK_OG_IMAGE;
  if (list.avatar_card_name) image = scryfallArtCropUrl(list.avatar_card_name);
  else if (commanders[0]) image = scryfallArtCropUrl(commanders[0]);

  return {
    title: `${name} | MTG Decklist | CardMystic`,
    description,
    image,
    imageAlt: `Art for ${name}`,
    robots:
      list.visibility === 'public' ? 'index, follow' : 'noindex, nofollow',
  };
}

export function buildUserProfileSeo(
  profile: PublicProfile | null,
  deckCount: number,
): SeoMeta {
  if (!profile) {
    return {
      title: 'User Profile | CardMystic',
      description:
        'Explore Magic: The Gathering decklists shared by the CardMystic community.',
      image: FALLBACK_OG_IMAGE,
      imageAlt: 'CardMystic user profile',
      robots: 'noindex, follow',
    };
  }

  const name = profile.username || 'This user';
  const followerCount = profile.follower_count ?? 0;
  const deckPart =
    deckCount > 0
      ? `${deckCount} public MTG decklist${deckCount === 1 ? '' : 's'}`
      : 'Magic: The Gathering community member';
  const followerPart =
    followerCount > 0
      ? `${followerCount} follower${followerCount === 1 ? '' : 's'}.`
      : '';
  const description =
    `${name} on CardMystic — ${deckPart}. ${followerPart}`.trim();

  const image = profile.avatar_card_name
    ? scryfallArtCropUrl(profile.avatar_card_name)
    : FALLBACK_OG_IMAGE;

  return {
    title: profile.username
      ? `${profile.username} | MTG Decklists | CardMystic`
      : 'User Profile | CardMystic',
    description,
    image,
    imageAlt: profile.username
      ? `${profile.username}'s profile art on CardMystic`
      : 'CardMystic user profile',
    robots: profile.username ? 'index, follow' : 'noindex, follow',
  };
}
