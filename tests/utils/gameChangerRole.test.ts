import { describe, expect, it } from 'vitest';
import {
  collectionTitle,
  collectionDescription,
} from '../../utils/card-collections';
import { siteNavigation } from '../../utils/site-navigation';
const gameChangers = {
  slug: 'game-changers',
  name: 'Game Changers',
  cardCount: 2,
  imageUrl: null,
  imageCardName: null,
  releasedAt: null,
};

describe('Game Changers role', () => {
  it('uses a Commander-specific SEO title and description without a hard-coded count', () => {
    expect(collectionTitle('roles', gameChangers)).toBe(
      'MTG Commander Game Changers List',
    );
    expect(collectionDescription('roles', gameChangers)).toContain(
      'current Magic: The Gathering Commander Game Changers list',
    );
    expect(
      collectionTitle('roles', { ...gameChangers, slug: 'ramp', name: 'Ramp' }),
    ).toBe('MTG Ramp Cards');
  });
  it('keeps Game Changers first in the Roles dropdown regardless of card count', () => {
    const catalog = {
      dataReleaseId: 'test',
      themes: [],
      sets: [],
      roles: [
        { ...gameChangers, slug: 'ramp', name: 'Ramp', cardCount: 1000 },
        gameChangers,
      ],
    };
    const navigation = siteNavigation(catalog, 'success');
    expect(
      navigation.find((item) => item.label === 'Roles')?.children?.[0],
    ).toMatchObject({ label: 'Game Changers', to: '/roles/game-changers' });
  });
});
