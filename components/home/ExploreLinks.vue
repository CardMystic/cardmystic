<template>
  <section class="border-y border-default py-5">
    <nav
      class="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-4 md:gap-8"
      aria-label="Explore CardMystic"
    >
      <div v-for="group in linkGroups" :key="group.label" class="min-w-0">
        <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-toned">
          {{ group.label }}
        </h3>
        <ul>
          <li v-for="link in group.links" :key="link.to">
            <NuxtLink
              :to="link.to"
              no-prefetch
              class="inline-flex min-h-11 items-center gap-2 rounded text-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <UIcon
                :name="link.icon"
                class="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </section>
</template>

<script setup lang="ts">
const linkGroups = [
  {
    label: 'Browse Cards',
    icon: 'i-mdi-cards-outline',
    links: [
      {
        label: 'Themes',
        icon: 'i-lucide-tags',
        to: '/themes',
      },
      {
        label: 'Roles',
        icon: 'i-lucide-list-filter',
        to: '/roles',
      },
      {
        label: 'Sets',
        icon: 'i-mdi-cards-outline',
        to: '/sets',
      },
    ],
  },
  {
    label: 'Search',
    icon: 'i-lucide-search',
    links: [
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
        label: 'Deck Recommender',
        icon: 'i-lucide-box',
        to: '/search/all/deckbuilder',
      },
    ],
  },
  {
    label: 'Community',
    icon: 'i-lucide-users',
    links: [
      {
        label: 'Decklists',
        icon: 'i-lucide-list-tree',
        to: '/explore/decklists',
      },
      {
        label: 'Users',
        icon: 'i-lucide-user-search',
        to: '/explore/users',
      },
      {
        label: 'Articles',
        icon: 'i-lucide-newspaper',
        to: '/explore/articles',
      },
    ],
  },
  {
    label: 'Popular Cards',
    icon: 'i-lucide-trending-up',
    links: [
      {
        label: 'Commander Cards',
        icon: 'i-lucide-chart-no-axes-combined',
        to: '/popular-cards/all',
      },
      {
        label: 'Commanders',
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
] as const;
</script>
