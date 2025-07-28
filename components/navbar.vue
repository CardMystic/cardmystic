<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/'
  },
  {
    label: 'Search',
    icon: 'i-lucide-search',
    children: [
      {
        label: 'AI Search',
        description: 'Search for cards using AI',
        icon: 'i-lucide-brain',
        to: '/search',
      },
      {
        label: 'Similarity Search',
        description: 'Search for similar cards by name',
        icon: 'i-mdi-cards-outline',
        to: '/search/similarity',
      },
    ]
  },
  {
    label: 'About',
    icon: 'i-lucide-info',
    to: '/about'
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/cardmystic/cardmystic',
    target: '_blank'
  },
  {
    label: 'Patreon',
    icon: 'i-simple-icons-patreon',
    to: 'https://www.patreon.com/thecardmystic',
    target: '_blank'
  }
])
</script>

<template>
  <div
    class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/75 dark:bg-gray-950/75 backdrop-blur">
    <UNavigationMenu :items="items" class="w-full justify-center py-4" />
  </div>
</template>
