import { describe, it, expect } from 'vitest';
import {
  similarQueries,
  keywordQueries,
  commanderQueries,
  arenaQueries,
  mtgoQueries,
  modernQueries,
  aiQueries,
  deckbuilderQueries,
  popularCardQueries,
  popularCommanderQueries,
  popularByCommanderQueries,
  getSeoEntry,
  getSeoPath,
  getAllSeoSlugs,
} from '~/utils/seoQueries';
import type { SeoQuery } from '~/utils/seoQueries';

const allGroups: [string, SeoQuery[]][] = [
  ['similarQueries', similarQueries],
  ['keywordQueries', keywordQueries],
  ['commanderQueries', commanderQueries],
  ['arenaQueries', arenaQueries],
  ['mtgoQueries', mtgoQueries],
  ['modernQueries', modernQueries],
  ['aiQueries', aiQueries],
  ['deckbuilderQueries', deckbuilderQueries],
  ['popularCardQueries', popularCardQueries],
  ['popularCommanderQueries', popularCommanderQueries],
  ['popularByCommanderQueries', popularByCommanderQueries],
];

// ---------------------------------------------------------------------------
// Data invariants — these pages are prerendered/linked from the sitemap, so
// a malformed slug or duplicate silently breaks SEO routing.
// ---------------------------------------------------------------------------
describe('SEO query data invariants', () => {
  it.each(allGroups)('%s has unique slugs', (_name, queries) => {
    const slugs = queries.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(allGroups)('%s slugs are URL-safe', (_name, queries) => {
    for (const q of queries) {
      expect(q.slug, `slug "${q.slug}"`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it.each(allGroups)(
    '%s entries have query, title, and description',
    (_name, queries) => {
      for (const q of queries) {
        expect(q.query, `query for "${q.slug}"`).toBeTruthy();
        expect(q.title, `title for "${q.slug}"`).toBeTruthy();
        expect(q.description, `description for "${q.slug}"`).toBeTruthy();
      }
    },
  );

  it('similarity entries use the similarity search type', () => {
    for (const q of similarQueries) {
      expect(q.searchType).toBe('similarity');
    }
  });

  it('deckbuilder entries use commander names as deck recommendation queries', () => {
    for (const q of deckbuilderQueries) {
      expect(q.searchType).toBe('deckbuilder');
      expect(q.slug).toMatch(/^best-cards-for-/);
    }
  });

  it('popularity entries use their matching route types', () => {
    for (const q of popularCardQueries) {
      expect(q.searchType).toBe('popular-cards');
    }
    for (const q of popularCommanderQueries) {
      expect(q.searchType).toBe('popular-commanders');
    }
    for (const q of popularByCommanderQueries) {
      expect(q.searchType).toBe('popular-by-commander');
      expect(q.slug).toMatch(/^most-played-cards-for-/);
    }
  });
});

// ---------------------------------------------------------------------------
// getSeoEntry
// ---------------------------------------------------------------------------
describe('getSeoEntry', () => {
  it('finds entries in every registry group', () => {
    expect(getSeoEntry('all', 'smart', aiQueries[0].slug)).toBe(aiQueries[0]);
    expect(getSeoEntry('all', 'keyword', keywordQueries[0].slug)).toBe(
      keywordQueries[0],
    );
    expect(getSeoEntry('all', 'commander', commanderQueries[0].slug)).toBe(
      commanderQueries[0],
    );
    expect(getSeoEntry('all', 'similarity', similarQueries[0].slug)).toBe(
      similarQueries[0],
    );
    expect(getSeoEntry('arena', 'smart', arenaQueries[0].slug)).toBe(
      arenaQueries[0],
    );
    expect(getSeoEntry('mtgo', 'smart', mtgoQueries[0].slug)).toBe(
      mtgoQueries[0],
    );
    expect(getSeoEntry('modern', 'smart', modernQueries[0].slug)).toBe(
      modernQueries[0],
    );
    expect(getSeoEntry('all', 'deckbuilder', deckbuilderQueries[0].slug)).toBe(
      deckbuilderQueries[0],
    );
    expect(
      getSeoEntry('all', 'popular-cards', popularCardQueries[0].slug),
    ).toBe(popularCardQueries[0]);
    expect(
      getSeoEntry('all', 'popular-commanders', popularCommanderQueries[0].slug),
    ).toBe(popularCommanderQueries[0]);
    expect(
      getSeoEntry(
        'all',
        'popular-by-commander',
        popularByCommanderQueries[0].slug,
      ),
    ).toBe(popularByCommanderQueries[0]);
  });

  it('returns undefined for unknown slugs and unregistered combinations', () => {
    expect(
      getSeoEntry('all', 'smart', 'definitely-not-a-slug'),
    ).toBeUndefined();
    // Arena only registers smart search — keyword slugs must not leak in.
    expect(
      getSeoEntry('arena', 'keyword', keywordQueries[0].slug),
    ).toBeUndefined();
    expect(getSeoEntry('paper', 'smart', aiQueries[0].slug)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getAllSeoSlugs
// ---------------------------------------------------------------------------
describe('getAllSeoSlugs', () => {
  it('covers all eleven registry groups with every slug', () => {
    const result = getAllSeoSlugs();
    expect(result).toHaveLength(11);

    const totalSlugs = result.reduce((sum, g) => sum + g.slugs.length, 0);
    const expectedTotal = allGroups.reduce((sum, [, q]) => sum + q.length, 0);
    expect(totalSlugs).toBe(expectedTotal);

    for (const group of result) {
      expect(group.platform).toBeTruthy();
      expect(group.searchType).toBeTruthy();
      expect(group.slugs.length).toBeGreaterThan(0);
    }
  });

  it('every listed slug resolves back through getSeoEntry', () => {
    for (const { platform, searchType, slugs } of getAllSeoSlugs()) {
      for (const slug of slugs) {
        expect(
          getSeoEntry(platform, searchType, slug),
          `${platform}:${searchType}:${slug}`,
        ).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getSeoPath
// ---------------------------------------------------------------------------
describe('getSeoPath', () => {
  it('builds search and popularity route layouts', () => {
    expect(getSeoPath('all', 'smart', 'best-card-draw')).toBe(
      '/search/all/smart/best-card-draw',
    );
    expect(getSeoPath('all', 'popular-cards', 'card-draw')).toBe(
      '/popular-cards/all/card-draw',
    );
    expect(
      getSeoPath(
        'all',
        'popular-by-commander',
        'most-played-cards-for-kaalia-of-the-vast',
      ),
    ).toBe(
      '/popular-by-commander/all/most-played-cards-for-kaalia-of-the-vast',
    );
  });
});
