<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui';
import {
  navigationActionStateKey,
  navigationTrailEntry,
  pageBreadcrumbs,
} from '~/utils/navigation-trail';
import {
  collectionLabels,
  type CardCollectionCatalog,
  type CardCollectionKind,
} from '~/utils/card-collections';

const route = useRoute();
const router = useRouter();
const { entries, labels } = useNavigationTrail();
const { data: catalog } =
  useNuxtData<CardCollectionCatalog>('card-collections');
if (/^\/(sets|themes|roles)\/[^/]+$/.test(route.path))
  await useCardCollections();
const ariaLabel = computed(() =>
  navigationTrailEntry(route) && !/^\/(sets|themes|roles)\//.test(route.path)
    ? 'Browsing history'
    : 'Breadcrumb',
);
const items = computed<BreadcrumbItem[]>(() => {
  const destination = navigationTrailEntry(route);
  const home = { label: 'Home', to: '/', active: false };
  if (!destination) {
    const pages = pageBreadcrumbs(route.path);
    return pages.length
      ? [
          home,
          ...pages.map((item, index) => ({
            ...item,
            active: index === pages.length - 1,
          })),
        ]
      : [];
  }
  const trail =
    entries.value.at(-1)?.to === destination.to ? entries.value : [destination];
  return [
    home,
    ...trail.flatMap((entry, index) => {
      const location = router.resolve(entry.to);
      const match = /^\/(sets|themes|roles)\/([^/]+)$/.exec(entry.path);
      const kind = match?.[1] as CardCollectionKind | undefined;
      const collection = kind
        ? catalog.value?.[kind].find((item) => item.slug === match?.[2])
        : undefined;
      const current = {
        label: collection
          ? collection.name.charAt(0).toUpperCase() + collection.name.slice(1)
          : (labels.value[entry.path] ?? entry.label),
        to:
          index < trail.length - 1
            ? {
                path: location.path,
                query: location.query,
                state: { [navigationActionStateKey]: 'return' },
              }
            : undefined,
        active: index === trail.length - 1,
      };
      return kind
        ? [
            {
              label: `All ${collectionLabels[kind]}`,
              to: `/${kind}`,
              active: false,
            },
            current,
          ]
        : [current];
    }),
  ];
});
</script>

<template>
  <UBreadcrumb
    v-if="items.length"
    :items="items"
    :aria-label="ariaLabel"
    class="w-full py-2 text-sm"
    :ui="{
      list: 'flex-wrap gap-x-1 gap-y-0',
      item: 'min-w-0 max-w-full',
      link: 'min-h-11 px-2 focus-visible:outline-primary',
      linkLabel: 'whitespace-normal wrap-anywhere',
    }"
  />
</template>
