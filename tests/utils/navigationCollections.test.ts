import { describe, expect, it } from 'vitest';
import { navigationCatalog } from '../../utils/navigationCollections';
import { siteNavigation } from '../../utils/site-navigation';
import type {
  CardCollectionCatalog,
  CardCollectionEntry,
} from '../../models/collectionModel';

const entry = (
  slug: string,
  cardCount: number,
  releasedAt: string | null = null,
): CardCollectionEntry => ({
  slug,
  name: slug,
  cardCount,
  releasedAt,
  imageUrl: `https://example.com/${slug}.jpg`,
  imageCardName: 'Example card',
});

describe('navigation catalog', () => {
  it('preserves menu ordering while sending only six entries and required fields per category', () => {
    const catalog: CardCollectionCatalog = {
      dataReleaseId: 'test',
      themes: Array.from({ length: 20 }, (_, i) => entry(`theme-${i}`, i)),
      roles: [
        ...Array.from({ length: 20 }, (_, i) => entry(`role-${i}`, i)),
        entry('game-changers', 1),
      ],
      sets: Array.from({ length: 20 }, (_, i) =>
        entry(`set-${i}`, 20 - i, `2026-10-${String(i + 1).padStart(2, '0')}`),
      ),
    };
    const original = structuredClone(catalog);
    const navigation = navigationCatalog(catalog);
    expect(siteNavigation(navigation)).toEqual(siteNavigation(catalog));
    expect(navigation.themes).toHaveLength(6);
    expect(navigation.roles).toHaveLength(6);
    expect(navigation.sets).toHaveLength(6);
    expect(navigation.roles[0].slug).toBe('game-changers');
    expect(navigation.sets[0].slug).toBe('set-19');
    expect(navigation.themes[0].slug).toBe('theme-19');
    expect(Object.keys(navigation.roles[0]).sort()).toEqual([
      'cardCount',
      'name',
      'releasedAt',
      'slug',
    ]);
    expect(catalog).toEqual(original);
  });

  it('supports empty categories without manufacturing menu entries', () => {
    expect(
      navigationCatalog({
        dataReleaseId: 'empty',
        themes: [],
        roles: [],
        sets: [],
      }),
    ).toEqual({ themes: [], roles: [], sets: [] });
  });
});
