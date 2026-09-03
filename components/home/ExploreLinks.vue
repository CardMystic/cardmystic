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
          <div>
            <h3 class="row-title">{{ group.label }}</h3>
            <p class="row-description">{{ group.description }}</p>
          </div>
        </div>

        <div class="destination-grid">
          <NuxtLink
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            :aria-label="link.label"
            :class="['destination-card', `destination-card--${link.tone}`]"
          >
            <span class="card-icon-wrap">
              <UIcon :name="link.icon" class="card-icon" aria-hidden="true" />
            </span>
            <span class="card-copy">
              <span class="card-title">{{ link.label }}</span>
              <span class="card-description">{{ link.description }}</span>
            </span>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="card-arrow"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>
      </div>
    </nav>
  </section>
</template>

<script setup lang="ts">
const linkGroups = [
  {
    label: 'Search',
    description: 'Powerful searches & deck recommendations.',
    icon: 'i-lucide-search',
    links: [
      {
        label: 'Smart Search',
        description: 'Natural language semantic vector search.',
        icon: 'i-lucide-brain',
        to: '/search/all/smart',
        tone: 'smart-search',
      },
      {
        label: 'Similarity Search',
        description: 'Find similar cards based on the input card.',
        icon: 'i-mdi-cards-outline',
        to: '/search/all/similarity',
        tone: 'similarity-search',
      },
      {
        label: 'Deck Recommender',
        description: 'Get personalized recommendations based on your deck.',
        icon: 'i-lucide-box',
        to: '/search/all/deckbuilder',
        tone: 'deck-recommender',
      },
    ],
  },
  {
    label: 'Community',
    description: 'Discover what the CardMystic community is building.',
    icon: 'i-lucide-users',
    links: [
      {
        label: 'Decklists',
        description:
          'Browse public decks made with the CardMystic deck builder.',
        icon: 'i-lucide-list-tree',
        to: '/explore/decklists',
        tone: 'decklists',
      },
      {
        label: 'Users',
        description: 'Find players and see the decks they share.',
        icon: 'i-lucide-user-search',
        to: '/explore/users',
        tone: 'users',
      },
      {
        label: 'Articles',
        description: 'Read strategy, deck techs, and community guides.',
        icon: 'i-lucide-newspaper',
        to: '/explore/articles',
        tone: 'articles',
      },
    ],
  },
  {
    label: 'Popular Cards',
    description: 'Discover the most popular cards across all decks.',
    icon: 'i-lucide-trending-up',
    links: [
      {
        label: 'Commander Cards',
        description: 'See the most-played cards across Commander decks.',
        icon: 'i-lucide-chart-no-axes-combined',
        to: '/popular-cards/all',
        tone: 'popular-cards',
      },
      {
        label: 'Commanders',
        description: 'Explore the commanders players build most often.',
        icon: 'i-mdi-crown',
        to: '/popular-commanders/all',
        tone: 'commanders',
      },
      {
        label: 'Cards by Commander',
        description: 'Find the most-played cards for any commander.',
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

.section-heading
  margin-bottom: 1.4rem

.section-eyebrow
  font-family: monospace
  font-size: 0.72rem
  font-weight: 700
  letter-spacing: 0.16em
  text-transform: uppercase
  color: var(--ui-primary)

.section-title
  margin-top: 0.2rem
  font-size: clamp(1.35rem, 2vw, 1.8rem)
  font-weight: 750
  line-height: 1.2

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

.row-description
  max-width: 13rem
  margin-top: 0.3rem
  font-size: 0.78rem
  line-height: 1.45
  opacity: 0.62

.destination-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 0.75rem

.destination-card
  --card-color: #4338ca
  --card-dark: #c4b5fd
  --card-rgb: 99, 102, 241
  position: relative
  display: grid
  grid-template-columns: auto minmax(0, 1fr) auto
  align-items: center
  gap: 0.8rem
  min-height: 5.6rem
  padding: 0.9rem 1rem
  overflow: hidden
  border: 1px solid rgba(var(--card-rgb), 0.24)
  border-radius: 0.9rem
  color: var(--card-color)
  text-decoration: none
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
  width: 2.35rem
  height: 2.35rem
  border-radius: 0.7rem
  background: rgba(var(--card-rgb), 0.13)

.card-icon
  width: 1.2rem
  height: 1.2rem

.card-copy
  display: flex
  flex-direction: column
  gap: 0.25rem
  min-width: 0

.card-title
  font-size: 0.93rem
  font-weight: 750
  line-height: 1.2

.card-description
  color: var(--ui-text-muted)
  font-size: 0.75rem
  line-height: 1.4

.card-arrow
  width: 1rem
  height: 1rem
  align-self: flex-start
  opacity: 0.45
  transition: transform 180ms ease, opacity 180ms ease

.destination-card:hover .card-arrow
  transform: translate(2px, -2px)
  opacity: 0.9

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

  .row-description
    max-width: none

@media (max-width: 767px)
  .destination-section
    padding: 1.15rem

  .destination-grid
    grid-template-columns: 1fr

  .destination-card
    min-height: 5rem

@media (min-width: 768px) and (max-width: 1023px)
  .destination-grid
    grid-template-columns: repeat(3, minmax(0, 1fr))
</style>

<style lang="sass">
html.dark .destination-section .destination-card
  color: var(--card-dark)

html.dark .destination-section .destination-card--similarity-search
  --card-rgb: 255, 255, 255
</style>
