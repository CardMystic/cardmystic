import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { isResourceId } from './resource-id';

export interface NavigationTrailEntry {
  kind: 'search' | 'card';
  path: string;
  to: string;
  label: string;
}

export const navigationActionStateKey = 'cardmysticNavigationAction';
export type NavigationAction = 'drill-down' | 'refine' | 'return';

const searchLabels: ReadonlyMap<string, string> = new Map([
  ['smart', 'Smart Search'],
  ['similarity', 'Similarity Search'],
  ['commander', 'Commander Search'],
  ['keyword', 'Keyword Search'],
  ['deckbuilder', 'Deck Recommender'],
]);

export function navigationTrailEntry(
  route: Pick<
    RouteLocationNormalizedLoaded,
    'path' | 'fullPath' | 'query' | 'params'
  >,
): NavigationTrailEntry | undefined {
  // Router links can encode the same filters differently; compare one URL form.
  const queryString = new URL(
    route.fullPath,
    'https://cardmystic.invalid',
  ).searchParams.toString();
  const to = `${route.path}${queryString ? `?${queryString}` : ''}`;
  const cardId = /^\/card\/([^/]+)$/.exec(route.path)?.[1];
  if (cardId && isResourceId(cardId)) {
    return { kind: 'card', path: route.path, to, label: 'Card details' };
  }

  const search =
    /^\/search\/(?:all|paper|arena|mtgo|modern|commander)\/([^/]+)(?:\/([^/]+))?$/.exec(
      route.path,
    );
  const collection = /^\/(themes|roles|sets)\/([^/]+)$/.exec(route.path);
  if (collection) {
    const label =
      collection[1] === 'themes'
        ? 'Theme'
        : collection[1] === 'roles'
          ? 'Role'
          : 'Set';
    const name = collection[2]!.split('-').join(' ');
    return { kind: 'search', path: route.path, to, label: `${label}: ${name}` };
  }
  const popular =
    /^\/(popular-cards|popular-commanders|popular-by-commander)\/(?:all|paper|arena|mtgo|modern|commander)(?:\/[^/]+)?$/.exec(
      route.path,
    );
  const mode = search?.[1] ?? popular?.[1];
  const label =
    searchLabels.get(mode ?? '') ??
    (
      {
        'popular-cards': 'Popular Cards',
        'popular-commanders': 'Popular Commanders',
        'popular-by-commander': 'Commander Popularity',
      } as Record<string, string>
    )[mode ?? ''];
  if (!label) return undefined;
  const text = (key: string) =>
    typeof route.query[key] === 'string' ? (route.query[key] as string) : '';
  const query =
    text('query') ||
    text('card_name') ||
    (typeof route.params.slug === 'string'
      ? route.params.slug.split('-').filter(Boolean).join(' ')
      : '');
  const context =
    mode === 'deckbuilder' || mode === 'popular-by-commander'
      ? [text('commander'), text('partnerCommander')].filter(Boolean).join(', ')
      : query;
  return {
    kind: 'search',
    path: route.path,
    to,
    label: context ? `${label}: ${context}` : label,
  };
}

export function advanceNavigationTrail(
  entries: NavigationTrailEntry[],
  destination: NavigationTrailEntry | undefined,
  action?: NavigationAction,
): NavigationTrailEntry[] {
  if (!destination) return [];

  const current = entries.at(-1);
  const cardSource =
    action === 'drill-down'
      ? current
      : action === 'refine' && current?.kind === 'search'
        ? entries.at(-2)
        : undefined;
  if (
    destination.kind === 'search' &&
    navigationSearchMode(destination.path) === 'deckbuilder' &&
    cardSource?.kind === 'card' &&
    new URL(destination.to, 'https://cardmystic.invalid').searchParams.get(
      'decklist',
    ) === `1 ${cardSource.label}`
  ) {
    const description = new URL(
      destination.to,
      'https://cardmystic.invalid',
    ).searchParams
      .get('description')
      ?.trim();
    const suffix = destination.label.startsWith('Deck Recommender: ')
      ? `, ${destination.label.slice('Deck Recommender: '.length)}`
      : description
        ? `, ${description}`
        : '';
    destination = {
      ...destination,
      label: `Deck Recommender: ${cardSource.label}${suffix}`,
    };
  }
  if (
    current?.kind === 'card' &&
    destination.kind === 'card' &&
    current.path === destination.path
  ) {
    return [...entries.slice(0, -1), { ...destination, label: current.label }];
  }

  if (action === 'return') {
    const ancestor = entries.findLastIndex(
      (entry) => entry.to === destination.to,
    );
    return ancestor >= 0 ? entries.slice(0, ancestor + 1) : [destination];
  }

  // Refining one search updates its return destination, not the discovery depth.
  if (
    action === 'refine' &&
    current?.kind === 'search' &&
    destination.kind === 'search' &&
    navigationSearchMode(current.path) ===
      navigationSearchMode(destination.path)
  ) {
    return [...entries.slice(0, -1), destination];
  }
  return action === 'drill-down'
    ? [...entries, destination].slice(-10)
    : [destination];
}

export function restoredNavigationTrail(
  value: unknown,
  currentTo: string,
): NavigationTrailEntry[] | undefined {
  if (!Array.isArray(value) || !value.length || value.length > 10)
    return undefined;
  const valid = value.every(
    (entry): entry is NavigationTrailEntry =>
      entry !== null &&
      typeof entry === 'object' &&
      (entry.kind === 'search' || entry.kind === 'card') &&
      typeof entry.path === 'string' &&
      /^\/(?:search|card|themes|roles|sets|popular-cards|popular-commanders|popular-by-commander)\/[^/]/.test(
        entry.path,
      ) &&
      typeof entry.to === 'string' &&
      (entry.to === entry.path || entry.to.startsWith(`${entry.path}?`)) &&
      typeof entry.label === 'string',
  );
  return valid && value.at(-1)?.to === currentTo ? value : undefined;
}

function navigationSearchMode(path: string) {
  return path.startsWith('/search/') ? path.split('/')[3] : path.split('/')[1];
}

export function inferredNavigationAction(
  from: NavigationTrailEntry | undefined,
  to: NavigationTrailEntry | undefined,
): NavigationAction | undefined {
  if (!from || !to || from.to === to.to) return undefined;
  if (
    from.kind === 'search' &&
    to.kind === 'search' &&
    navigationSearchMode(from.path) === navigationSearchMode(to.path)
  )
    return 'refine';
  if (to.kind === 'card') return 'drill-down';
  // A blank search from the main navigation starts a new browsing trail.
  if (to.kind === 'search' && to.label.includes(': ')) return 'drill-down';
  return undefined;
}

export interface PageBreadcrumb {
  label: string;
  to?: string;
}

export function pageBreadcrumbs(path: string): PageBreadcrumb[] {
  if (path === '/staff') return [{ label: 'Staff tools' }];
  if (path.startsWith('/staff/articles'))
    return [
      { label: 'Staff tools', to: '/staff' },
      {
        label: 'Staff articles',
        ...(path === '/staff/articles' ? {} : { to: '/staff/articles' }),
      },
      ...(path === '/staff/articles' ? [] : [{ label: 'Edit article' }]),
    ];
  const deck = /^\/lists\/([^/]+)(?:\/(primer))?$/.exec(path);
  if (deck && isResourceId(deck[1]!))
    return [
      { label: 'Decklists', to: '/explore/decklists' },
      {
        label: 'Deck details',
        ...(deck[2] ? { to: `/lists/${deck[1]}` } : {}),
      },
      ...(deck[2] ? [{ label: 'Primer' }] : []),
    ];
  const article = /^\/articles\/([^/]+)(?:\/(edit))?$/.exec(path);
  if (article && isResourceId(article[1]!))
    return [
      { label: 'Articles', to: '/explore/articles' },
      {
        label: 'Article',
        ...(article[2] ? { to: `/articles/${article[1]}` } : {}),
      },
      ...(article[2] ? [{ label: 'Edit article' }] : []),
    ];
  if (/^\/user\/[^/]+$/.test(path) && isResourceId(path.split('/')[2]!))
    return [
      { label: 'Players', to: '/explore/users' },
      { label: 'Player profile' },
    ];
  const labels: Record<string, string> = {
    '/themes': 'Themes',
    '/roles': 'Roles',
    '/sets': 'Sets',
    '/memberships': 'Memberships',
    '/about': 'About',
    '/privacyPolicy': 'Privacy Policy',
    '/terms': 'Terms of Service',
    '/billing-policy': 'Billing & Refunds',
    '/lists': 'Your Decks',
    '/articles/mine': 'Your Articles',
    '/explore/articles': 'Articles',
    '/explore/decklists': 'Decklists',
    '/explore/users': 'Players',
    '/user/history': 'Search History',
    '/user/account': 'Your Account',
  };
  return labels[path] ? [{ label: labels[path] }] : [];
}
