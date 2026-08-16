import { describe, it, expect } from 'vitest';
import {
  FALLBACK_OG_IMAGE,
  buildArticleSeo,
  buildDecklistSeo,
  buildUserProfileSeo,
  excerptFromMarkdown,
} from '~/utils/seoMeta';
import type { Article } from '~/models/articleModel';
import type { DecklistSummary } from '~/models/cardListModel';
import type { PublicProfile } from '~/models/userModel';

const makeArticle = (overrides: Partial<Article> = {}): Article =>
  ({
    id: 'a1',
    user_id: 'u1',
    username: 'author',
    title: 'How to Play Commander',
    description: '',
    image_url: null,
    is_published: true,
    published_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    content: '',
    ...overrides,
  }) as Article;

const makeDecklist = (
  overrides: Partial<DecklistSummary> = {},
): DecklistSummary =>
  ({
    id: 'd1',
    name: 'Krenko Goblin Tribal',
    description: null,
    format: 'commander',
    avatar_card_name: null,
    commanders: [],
    color_ratios: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 0 },
    updated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    visibility: 'public',
    user_id: 'u1',
    username: null,
    like_count: 0,
    save_count: 0,
    comment_count: 0,
    view_count: 0,
    ...overrides,
  }) as DecklistSummary;

const makeProfile = (overrides: Partial<PublicProfile> = {}): PublicProfile =>
  ({
    id: 'u1',
    username: 'mystic',
    avatar_card_name: null,
    is_featured: false,
    is_author: false,
    follower_count: 0,
    ...overrides,
  }) as PublicProfile;

describe('excerptFromMarkdown', () => {
  it('strips fenced code, links, headings, and emphasis', () => {
    const md = [
      '# Heading',
      '',
      'Some **bold** and _italic_ text with a [link](https://example.com).',
      '',
      '```ts',
      'const x = 1;',
      '```',
      '',
      '> a quote',
    ].join('\n');
    const out = excerptFromMarkdown(md);
    expect(out).toBe('Heading Some bold and italic text with a link. a quote');
  });

  it('truncates with an ellipsis when longer than max', () => {
    const md = 'a'.repeat(300);
    const out = excerptFromMarkdown(md, 50);
    expect(out.length).toBe(50);
    expect(out.endsWith('…')).toBe(true);
  });

  it('returns an empty string for empty input', () => {
    expect(excerptFromMarkdown('')).toBe('');
  });
});

describe('buildArticleSeo', () => {
  it('returns fallback meta when article is null', () => {
    const seo = buildArticleSeo(null);
    expect(seo.title).toBe('Article | CardMystic');
    expect(seo.image).toBe(FALLBACK_OG_IMAGE);
    expect(seo.robots).toBe('noindex, nofollow');
  });

  it('titles as "{article.title} | CardMystic"', () => {
    const seo = buildArticleSeo(makeArticle({ title: 'My Article' }));
    expect(seo.title).toBe('My Article | CardMystic');
  });

  it('prefers author description over content excerpt', () => {
    const seo = buildArticleSeo(
      makeArticle({
        description: '   The chosen blurb.   ',
        content: 'Different body text.',
      }),
    );
    expect(seo.description).toBe('The chosen blurb.');
  });

  it('falls back to a markdown excerpt when description is empty', () => {
    const seo = buildArticleSeo(
      makeArticle({
        description: '',
        content: '# Hello\n\nThis is the **body** of the article.',
      }),
    );
    expect(seo.description).toBe('Hello This is the body of the article.');
  });

  it('falls back to a canned line when both description and content are empty', () => {
    const seo = buildArticleSeo(
      makeArticle({ title: 'Untitled', description: '', content: '' }),
    );
    expect(seo.description).toContain('Untitled');
    expect(seo.description).toContain('CardMystic');
  });

  it('uses the article image_url when present', () => {
    const seo = buildArticleSeo(
      makeArticle({ image_url: 'https://cdn.example.com/cover.jpg' }),
    );
    expect(seo.image).toBe('https://cdn.example.com/cover.jpg');
  });

  it('falls back to the generic image when image_url is missing', () => {
    const seo = buildArticleSeo(makeArticle({ image_url: null }));
    expect(seo.image).toBe(FALLBACK_OG_IMAGE);
  });

  it('marks drafts as noindex', () => {
    expect(buildArticleSeo(makeArticle({ is_published: false })).robots).toBe(
      'noindex, nofollow',
    );
    expect(buildArticleSeo(makeArticle({ is_published: true })).robots).toBe(
      'index, follow',
    );
  });
});

describe('buildDecklistSeo', () => {
  it('returns fallback meta when list is null', () => {
    const seo = buildDecklistSeo(null);
    expect(seo.title).toBe('Decklist | CardMystic');
    expect(seo.image).toBe(FALLBACK_OG_IMAGE);
    expect(seo.robots).toBe('noindex, nofollow');
  });

  it('titles as "{name} | MTG Decklist | CardMystic"', () => {
    const seo = buildDecklistSeo(makeDecklist({ name: 'Goblins!' }));
    expect(seo.title).toBe('Goblins! | MTG Decklist | CardMystic');
  });

  it('uses "Untitled deck" when name is null', () => {
    const seo = buildDecklistSeo(makeDecklist({ name: null }));
    expect(seo.title).toBe('Untitled deck | MTG Decklist | CardMystic');
  });

  it('prefers the owner-supplied description over the synthesized one', () => {
    const seo = buildDecklistSeo(
      makeDecklist({ description: '  Aggro goblins go brrr.  ' }),
    );
    expect(seo.description).toBe('Aggro goblins go brrr.');
  });

  it('synthesizes a description from format, commanders, and owner', () => {
    const seo = buildDecklistSeo(
      makeDecklist({
        name: 'Krenko',
        format: 'commander',
        commanders: ['Krenko, Mob Boss'],
        username: 'mystic',
      }),
    );
    expect(seo.description).toContain('Krenko');
    expect(seo.description).toContain('commander');
    expect(seo.description).toContain('led by Krenko, Mob Boss');
    expect(seo.description).toContain('built by mystic');
  });

  it('falls back to the passed ownerUsername when list.username is null', () => {
    const seo = buildDecklistSeo(
      makeDecklist({ username: null }),
      'someoneelse',
    );
    expect(seo.description).toContain('built by someoneelse');
  });

  it('prefers avatar_card_name for the image', () => {
    const seo = buildDecklistSeo(
      makeDecklist({
        avatar_card_name: 'Sol Ring',
        commanders: ['Krenko, Mob Boss'],
      }),
    );
    expect(seo.image).toContain('exact=Sol%20Ring');
  });

  it('falls back to the first commander when avatar_card_name is empty', () => {
    const seo = buildDecklistSeo(
      makeDecklist({
        avatar_card_name: null,
        commanders: ['Krenko, Mob Boss', 'Purphoros'],
      }),
    );
    expect(seo.image).toContain('exact=Krenko%2C%20Mob%20Boss');
  });

  it('falls back to the generic image when neither avatar nor commanders are set', () => {
    const seo = buildDecklistSeo(
      makeDecklist({ avatar_card_name: null, commanders: [] }),
    );
    expect(seo.image).toBe(FALLBACK_OG_IMAGE);
  });

  it('marks private lists as noindex', () => {
    expect(
      buildDecklistSeo(makeDecklist({ visibility: 'private' })).robots,
    ).toBe('noindex, nofollow');
    expect(
      buildDecklistSeo(makeDecklist({ visibility: 'public' })).robots,
    ).toBe('index, follow');
  });
});

describe('buildUserProfileSeo', () => {
  it('returns fallback meta when profile is null', () => {
    const seo = buildUserProfileSeo(null, 0);
    expect(seo.title).toBe('User Profile | CardMystic');
    expect(seo.image).toBe(FALLBACK_OG_IMAGE);
    expect(seo.robots).toBe('noindex, follow');
  });

  it('titles as "{username} | MTG Decklists | CardMystic"', () => {
    const seo = buildUserProfileSeo(makeProfile({ username: 'mystic' }), 0);
    expect(seo.title).toBe('mystic | MTG Decklists | CardMystic');
  });

  it('pluralizes the deck count', () => {
    const one = buildUserProfileSeo(makeProfile(), 1).description;
    const many = buildUserProfileSeo(makeProfile(), 4).description;
    expect(one).toContain('1 public MTG decklist.');
    expect(many).toContain('4 public MTG decklists');
  });

  it('pluralizes the follower count and omits it when zero', () => {
    const zero = buildUserProfileSeo(
      makeProfile({ follower_count: 0 }),
      2,
    ).description;
    const one = buildUserProfileSeo(
      makeProfile({ follower_count: 1 }),
      2,
    ).description;
    const many = buildUserProfileSeo(
      makeProfile({ follower_count: 12 }),
      2,
    ).description;
    expect(zero).not.toContain('follower');
    expect(one).toContain('1 follower');
    expect(many).toContain('12 followers');
  });

  it('describes zero-deck users as community members', () => {
    const seo = buildUserProfileSeo(makeProfile(), 0);
    expect(seo.description).toContain('Magic: The Gathering community member');
  });

  it('uses the avatar_card_name for the image when set', () => {
    const seo = buildUserProfileSeo(
      makeProfile({ avatar_card_name: 'Jace, the Mind Sculptor' }),
      0,
    );
    expect(seo.image).toContain('exact=Jace%2C%20the%20Mind%20Sculptor');
  });

  it('falls back to the generic image when avatar_card_name is missing', () => {
    const seo = buildUserProfileSeo(makeProfile({ avatar_card_name: null }), 0);
    expect(seo.image).toBe(FALLBACK_OG_IMAGE);
  });

  it('marks profiles with a username as indexable', () => {
    expect(
      buildUserProfileSeo(makeProfile({ username: 'mystic' }), 0).robots,
    ).toBe('index, follow');
    expect(
      buildUserProfileSeo(makeProfile({ username: null as never }), 0).robots,
    ).toBe('noindex, follow');
  });
});
