<template>
  <section class="destination-section">
    <nav class="destination-rows" aria-label="Explore CardMystic">
      <div
        v-for="group in linkGroups"
        :key="group.label"
        class="destination-row"
      >
        <div class="row-heading">
          <UIcon :name="group.icon" class="row-icon" aria-hidden="true" />
          <h3 class="row-title">{{ group.label }}</h3>
        </div>

        <div class="destination-grid">
          <NuxtLink
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            no-prefetch
            :aria-label="link.label"
            :class="['destination-card', `destination-card--${link.tone}`]"
          >
            <span class="card-icon-wrap">
              <UIcon :name="link.icon" class="card-icon" aria-hidden="true" />
            </span>
            <span class="card-title">{{ link.label }}</span>
          </NuxtLink>
        </div>
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
        tone: 'themes',
      },
      {
        label: 'Roles',
        icon: 'i-lucide-list-filter',
        to: '/roles',
        tone: 'roles',
      },
      {
        label: 'Sets',
        icon: 'i-mdi-cards-outline',
        to: '/sets',
        tone: 'sets',
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
        tone: 'smart-search',
      },
      {
        label: 'Similarity Search',
        icon: 'i-mdi-cards-outline',
        to: '/search/all/similarity',
        tone: 'similarity-search',
      },
      {
        label: 'Deck Recommender',
        icon: 'i-lucide-box',
        to: '/search/all/deckbuilder',
        tone: 'deck-recommender',
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
        tone: 'decklists',
      },
      {
        label: 'Users',
        icon: 'i-lucide-user-search',
        to: '/explore/users',
        tone: 'users',
      },
      {
        label: 'Articles',
        icon: 'i-lucide-newspaper',
        to: '/explore/articles',
        tone: 'articles',
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
        tone: 'popular-cards',
      },
      {
        label: 'Commanders',
        icon: 'i-mdi-crown',
        to: '/popular-commanders/all',
        tone: 'commanders',
      },
      {
        label: 'Cards by Commander',
        icon: 'i-lucide-flame',
        to: '/popular-by-commander/all',
        tone: 'by-commander',
      },
    ],
  },
] as const;
</script>

<style scoped lang="sass">
.destination-section
  padding: 1rem
  border: 1px solid rgba(147, 114, 255, 0.18)
  border-radius: 1.25rem
  background: linear-gradient(125deg, rgba(147, 114, 255, 0.07), rgba(147, 114, 255, 0.015))
  box-shadow: 0 16px 40px rgba(15, 10, 35, 0.06)

.destination-rows
  display: flex
  flex-direction: column
  gap: 1.35rem

.destination-row
  display: grid
  grid-template-columns: minmax(160px, 0.22fr) minmax(0, 1fr)
  align-items: stretch
  gap: 1.25rem

.row-heading
  display: flex
  align-items: flex-start
  gap: 0.7rem
  padding-top: 0.85rem

.row-icon
  width: 1.25rem
  height: 1.25rem
  flex: 0 0 auto
  color: var(--ui-primary)

.row-title
  font-size: 1rem
  font-weight: 750
  line-height: 1.2

.destination-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 0.5rem

.destination-card
  --card-color: #4338ca
  --card-dark: #c4b5fd
  --card-rgb: 99, 102, 241
  position: relative
  display: grid
  grid-template-columns: minmax(0, 1fr)
  justify-items: center
  align-content: start
  gap: 0.4rem
  min-height: 5.5rem
  padding: 0.75rem 0.5rem
  overflow: hidden
  border: 1px solid rgba(var(--card-rgb), 0.24)
  border-radius: 0.9rem
  color: var(--card-color)
  text-decoration: none
  text-align: center
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease
  &::before
    content: ''
    position: absolute
    inset: 0 auto 0 0
    width: 3px
    background: rgb(var(--card-rgb))
    opacity: 0.75
  &:hover
    transform: translateY(-3px)
    border-color: rgba(var(--card-rgb), 0.48)
    background: rgba(var(--card-rgb), 0.1)
  &:focus-visible
    outline: 2px solid rgba(var(--card-rgb), 0.75)
    outline-offset: 2px

.card-icon-wrap
  display: inline-flex
  align-items: center
  justify-content: center
  width: 2rem
  height: 2rem
  border-radius: 0.7rem
  background: rgba(var(--card-rgb), 0.13)

.card-icon
  width: 1.2rem
  height: 1.2rem

.card-title
  max-width: 100%
  overflow-wrap: anywhere
  font-size: 0.875rem
  font-weight: 750
  line-height: 1.2

.destination-card--smart-search
  --card-color: #c2410c
  --card-dark: #fdba74
  --card-rgb: 249, 115, 22

.destination-card--similarity-search
  --card-color: #000000
  --card-dark: #ffffff
  --card-rgb: 0, 0, 0

.destination-card--deck-recommender
  --card-color: #6d28d9
  --card-dark: #c4b5fd
  --card-rgb: 139, 92, 246
.destination-card--decklists
  --card-color: #0369a1
  --card-dark: #7dd3fc
  --card-rgb: 14, 165, 233

.destination-card--users
  --card-color: #6d28d9
  --card-dark: #c4b5fd
  --card-rgb: 139, 92, 246

.destination-card--articles
  --card-color: #047857
  --card-dark: #6ee7b7
  --card-rgb: 16, 185, 129

.destination-card--popular-cards
  --card-color: #1d4ed8
  --card-dark: #93c5fd
  --card-rgb: 59, 130, 246

.destination-card--commanders
  --card-color: #b45309
  --card-dark: #fcd34d
  --card-rgb: 245, 158, 11

.destination-card--by-commander
  --card-color: #be123c
  --card-dark: #fda4af
  --card-rgb: 244, 63, 94

@media (max-width: 1023px)
  .destination-row
    grid-template-columns: 1fr
    gap: 0.75rem

  .row-heading
    padding-top: 0

@media (max-width: 767px)
  .destination-section
    padding: 0.75rem

  .destination-card
    padding-inline: 0.25rem

  .card-title
    font-size: 0.75rem
</style>

<style lang="sass">
html.dark .destination-section .destination-card
  color: var(--card-dark)

html.dark .destination-section .destination-card--similarity-search
  --card-rgb: 255, 255, 255
</style>
