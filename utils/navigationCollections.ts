import type {
  CardCollectionCatalog,
  CardCollectionEntry,
  CardCollectionKind,
} from '../models/collectionModel';

type NavigationCollection = Pick<
  CardCollectionEntry,
  'slug' | 'name' | 'cardCount' | 'releasedAt'
>;
export type NavigationCatalog = Record<
  CardCollectionKind,
  NavigationCollection[]
>;

export function navigationEntries(
  kind: CardCollectionKind,
  entries: readonly NavigationCollection[],
) {
  return [...entries]
    .sort((a, b) =>
      kind === 'sets'
        ? (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '') ||
          a.name.localeCompare(b.name)
        : (kind === 'roles'
            ? Number(b.slug === 'game-changers') -
              Number(a.slug === 'game-changers')
            : 0) ||
          b.cardCount - a.cardCount ||
          a.name.localeCompare(b.name),
    )
    .slice(0, 6);
}

/** Only menu entries and fields cross the network; the full directory stays on the server. */
export function navigationCatalog(
  catalog: CardCollectionCatalog,
): NavigationCatalog {
  const select = (kind: CardCollectionKind) =>
    navigationEntries(kind, catalog[kind]).map(
      ({ slug, name, cardCount, releasedAt }) => ({
        slug,
        name,
        cardCount,
        releasedAt,
      }),
    );
  return {
    themes: select('themes'),
    roles: select('roles'),
    sets: select('sets'),
  };
}
