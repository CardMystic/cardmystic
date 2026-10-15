import type { NavigationMenuItem } from '@nuxt/ui';
import {
  collectionPath,
  type CardCollectionCatalog,
  type CardCollectionKind,
} from './card-collections';

export interface SiteNavigationItem extends NavigationMenuItem {
  setCode?: string;
  children?: SiteNavigationItem[];
}

export const utilityNavigation: SiteNavigationItem[] = [
  { label: 'About', icon: 'i-lucide-info', to: '/about' },
  { label: 'Memberships', icon: 'i-lucide-credit-card', to: '/memberships' },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/cardmystic/cardmystic',
    target: '_blank',
  },
];

function collectionNavigation(
  kind: CardCollectionKind,
  catalog: CardCollectionCatalog | null | undefined,
  status: string,
): SiteNavigationItem {
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  const entries = [...(catalog?.[kind] ?? [])].sort((a, b) =>
    kind === 'sets'
      ? (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '') ||
        a.name.localeCompare(b.name)
      : b.cardCount - a.cardCount || a.name.localeCompare(b.name),
  );
  return {
    label,
    icon: {
      sets: 'i-mdi-cards-outline',
      roles: 'i-lucide-list-filter',
      themes: 'i-lucide-tags',
    }[kind],
    children: [
      ...(entries.length
        ? []
        : [
            {
              label:
                status === 'pending' || status === 'idle'
                  ? `Loading ${kind}...`
                  : status === 'error'
                    ? `${label} could not be loaded`
                    : `No ${kind} available`,
              disabled: true,
            },
          ]),
      ...entries.slice(0, 6).map((entry) => ({
        label: entry.name.charAt(0).toUpperCase() + entry.name.slice(1),
        to: collectionPath(kind, entry.slug),
        ...(kind === 'sets' ? { setCode: entry.slug } : {}),
      })),
      {
        label: `All ${kind}`,
        to: collectionPath(kind),
        class: 'border-t border-default mt-1',
      },
    ],
  };
}

export function siteNavigation(
  catalog: CardCollectionCatalog | null | undefined,
  status = 'success',
): SiteNavigationItem[] {
  return [
    {
      label: 'Search',
      icon: 'i-lucide-search',
      children: [
        {
          label: 'Smart Search',
          icon: 'i-lucide-brain',
          to: '/search/all/smart',
        },
        {
          label: 'Similarity Search',
          icon: 'i-mdi-cards-outline',
          to: '/search/all/similarity',
        },
        {
          label: 'Commander Search',
          icon: 'i-mdi-crown',
          to: '/search/all/commander',
        },
        {
          label: 'Keyword Search',
          icon: 'i-lucide-whole-word',
          to: '/search/all/keyword',
        },
        {
          label: 'Deck Recommender',
          icon: 'i-lucide-box',
          to: '/search/all/deckbuilder',
        },
      ],
    },
    {
      label: 'Community',
      icon: 'i-lucide-users',
      children: [
        {
          label: 'Decklists',
          icon: 'i-lucide-list-tree',
          to: '/explore/decklists',
        },
        { label: 'Users', icon: 'i-lucide-user-search', to: '/explore/users' },
        {
          label: 'Articles',
          icon: 'i-lucide-newspaper',
          to: '/explore/articles',
        },
      ],
    },
    {
      label: 'Popular Cards',
      icon: 'i-lucide-chart-no-axes-combined',
      children: [
        {
          label: 'Popular Commander Cards',
          icon: 'i-lucide-chart-no-axes-combined',
          to: '/popular-cards/all',
        },
        {
          label: 'Popular Commanders',
          icon: 'i-mdi-crown',
          to: '/popular-commanders/all',
        },
        {
          label: 'Cards by Commander',
          icon: 'i-lucide-flame',
          to: '/popular-by-commander/all',
        },
      ],
    },
    collectionNavigation('sets', catalog, status),
    collectionNavigation('roles', catalog, status),
    collectionNavigation('themes', catalog, status),
  ];
}
