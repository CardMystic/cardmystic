import type {
  CardCollectionKind,
  CardCollectionEntry,
} from '~/models/collectionModel';
export type {
  CardCollectionKind,
  CardCollectionEntry,
  CardCollectionCatalog,
} from '~/models/collectionModel';

export const collectionLabels: Record<CardCollectionKind, string> = {
  themes: 'Themes',
  roles: 'Roles',
  sets: 'Sets',
};
export const collectionDescriptions: Record<CardCollectionKind, string> = {
  themes: 'Browse Magic: The Gathering cards by deck theme.',
  roles: 'Find Magic: The Gathering cards by gameplay role.',
  sets: 'Browse Magic: The Gathering sets and the cards printed in each set.',
};
export function collectionPath(kind: CardCollectionKind, slug?: string) {
  return `/${kind}${slug ? `/${slug}` : ''}`;
}
export function collectionTitle(
  kind: CardCollectionKind,
  entry: CardCollectionEntry,
) {
  const name = entry.name.charAt(0).toUpperCase() + entry.name.slice(1);
  return kind === 'sets'
    ? `${name} MTG Cards`
    : kind === 'themes'
      ? `MTG ${name} Theme Cards`
      : `MTG ${name} Cards`;
}
export function collectionDescription(
  kind: CardCollectionKind,
  entry: CardCollectionEntry,
) {
  return kind === 'sets'
    ? `Browse all Magic: The Gathering cards printed in ${entry.name} (${entry.slug.toUpperCase()}). Search within the set with Smart Search and Enhanced ranking.`
    : `Find Magic: The Gathering cards with the ${entry.name} ${kind === 'themes' ? 'theme' : 'role'}. Browse top cards or refine with Smart Search.`;
}
