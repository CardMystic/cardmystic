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
        icon: 'i-lucide-search',
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
  <UNavigationMenu :items="items" class="w-full justify-center" />
</template>
