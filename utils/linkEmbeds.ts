/**
 * Discord-style link "unfurl" parsing for the primer / article markdown
 * previews. Detects bare CardMystic URLs on their own line and returns a
 * structured description of what to fetch and how to route on click.
 *
 * Only bare full-line URLs unfurl. Inline autolinks and `[label](href)` links
 * stay as regular text so authors can still write "see this deck" links.
 */

export type LinkEmbedType =
  'decklist' | 'article' | 'user' | 'search' | 'popular';

/** Slug/type breakdown for a `/search/...` or `/popular-.../...` URL. */
export interface SearchEmbedInfo {
  platform: string;
  searchType: string;
  slug: string | null;
}

export interface LinkEmbedTarget {
  /** Original trimmed line as it appeared in the source. */
  url: string;
  /** Canonical relative path to navigate to on click. */
  href: string;
  type: LinkEmbedType;
  /** Populated for `decklist`, `article`, `user`. */
  id?: string;
  /** Populated for `search` and `popular`. */
  search?: SearchEmbedInfo;
}

const ORIGIN_RE = /^https?:\/\/(?:www\.)?cardmystic\.com(\/.*)$/i;
const UUID_ISH_RE = /^[A-Za-z0-9_-]{8,}$/;

function stripOrigin(raw: string): string | null {
  const trimmed = raw.trim();
  const originMatch = trimmed.match(ORIGIN_RE);
  if (originMatch) return originMatch[1];
  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

/** Parse a single trimmed line into an embed target, or `null` if it isn't a
 *  CardMystic URL we know how to unfurl. */
export function parseLinkEmbedTarget(
  raw: string,
): Omit<LinkEmbedTarget, 'url'> | null {
  const withOrigin = stripOrigin(raw);
  if (!withOrigin) return null;

  // Drop query string / fragment for pattern matching, then trim trailing "/".
  const pathOnly = withOrigin.split(/[?#]/)[0];
  const path = pathOnly.replace(/\/+$/, '') || '/';
  if (path.includes(' ')) return null;

  let m: RegExpMatchArray | null;

  m = path.match(/^\/lists\/([^/]+)$/);
  if (m) return { href: path, type: 'decklist', id: decodeURIComponent(m[1]) };

  m = path.match(/^\/articles\/([^/]+)$/);
  if (m) return { href: path, type: 'article', id: decodeURIComponent(m[1]) };

  // /user/{id} — accept UUID-ish segments only so `/user/account` etc. don't
  // masquerade as embeddable profiles.
  m = path.match(/^\/user\/([^/]+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (UUID_ISH_RE.test(id) && id !== 'account' && id !== 'setup')
      return { href: path, type: 'user', id };
  }

  m = path.match(/^\/search\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    return {
      href: path,
      type: 'search',
      search: {
        platform: m[1],
        searchType: m[2],
        slug: m[3] ? decodeURIComponent(m[3]) : null,
      },
    };
  }

  m = path.match(
    /^\/(popular-cards|popular-commanders|popular-by-commander)\/([^/]+)(?:\/([^/]+))?$/,
  );
  if (m) {
    return {
      href: path,
      type: 'popular',
      search: {
        platform: m[2],
        searchType: m[1],
        slug: m[3] ? decodeURIComponent(m[3]) : null,
      },
    };
  }

  return null;
}

/** Extract embed targets from a markdown source, deduped by canonical href. */
export function extractLinkEmbedTargets(source: string): LinkEmbedTarget[] {
  const targets: LinkEmbedTarget[] = [];
  const seen = new Map<string, number>();
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const parsed = parseLinkEmbedTarget(line);
    if (!parsed) continue;
    const key = `${parsed.type}:${parsed.href}`;
    if (seen.has(key)) continue;
    seen.set(key, targets.length);
    targets.push({ ...parsed, url: line });
  }
  return targets;
}

/**
 * Replaces every trimmed embed-URL line in `source` with a token placeholder
 * (`LINKEMBEDTOKEN{n}LINKEMBEDTOKEN`, surrounded by blank lines so marked
 * treats it as its own block) and returns both the rewritten source and the
 * ordered targets. The token order matches `targets`, deduped by canonical
 * href so identical URLs collapse to the same embed.
 */
export function extractAndTokenizeLinkEmbeds(source: string): {
  processed: string;
  targets: LinkEmbedTarget[];
} {
  const targets: LinkEmbedTarget[] = [];
  const indexByKey = new Map<string, number>();
  const lines = source.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    const parsed = parseLinkEmbedTarget(trimmed);
    if (!parsed) return line;
    const key = `${parsed.type}:${parsed.href}`;
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      idx = targets.length;
      indexByKey.set(key, idx);
      targets.push({ ...parsed, url: trimmed });
    }
    return `\n\nLINKEMBEDTOKEN${idx}LINKEMBEDTOKEN\n\n`;
  });
  return { processed: lines.join('\n'), targets };
}
