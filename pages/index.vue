<template>
  <SpaceBackground :full="true">
    <LazyCometDog />
    <div class="hero px-0 w-full flex flex-col items-center justify-center">
      <UContainer
        class="hero-grid grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center w-full max-w-350 relative z-10"
      >
        <!-- Left: title + search -->
        <div
          class="flex flex-col gap-5 items-center lg:items-start text-center lg:text-left"
        >
          <p class="hero-eyebrow">YOUR ALL-IN-ONE MTG TOOLKIT</p>
          <h1 class="hero-title text-white">
            Build
            <span class="hero-title-highlight">Smarter</span>
            Decks.
          </h1>
          <p class="hero-subtitle">
            MTG Smart Search Engine, Similar Card Search, Popular Card Search,
            Deck Builder & Deck Recommender for Magic: The Gathering
          </p>

          <!-- Search (suggested searches + advanced filters render directly
               below the search bar on all breakpoints) -->
          <Search :show-suggested-searches="true" />
        </div>

        <!-- Right: fanned hero cards + Ready To Search example.
             Self-hosted WebPs (~40 kB each) are much smaller than the
             equivalent Scryfall `normal` JPGs (~100 kB each) and don't
             add cross-origin DNS/connect time to LCP. Sized at the 2×
             DPR of their CSS box so they look crisp on retina without
             wasted bytes. -->
        <div class="hero-right">
          <NuxtLink
            v-for="card in heroCards"
            :key="card.id"
            :to="`/card/${card.id}`"
            class="hero-card"
            :class="card.position"
          >
            <img
              :src="card.image"
              :alt="card.name"
              width="360"
              height="502"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              class="hero-card-img"
            />
          </NuxtLink>

          <!-- Example query matching the cards above -->
          <NuxtLink
            :to="{
              path: '/search/all/smart',
              query: { query: readyToSearch.query },
            }"
            class="ready-card"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="ready-label">Ready to search</p>
            </div>
            <p class="ready-query">{{ readyToSearch.query }}</p>
            <p class="ready-desc">{{ readyToSearch.description }}</p>
          </NuxtLink>
        </div>
      </UContainer>
    </div>
  </SpaceBackground>

  <!-- Everything below the fold -->
  <UContainer class="mt-10 mb-10">
    <!-- User-specific sections when logged in -->
    <ClientOnly>
      <LazyRecentLists v-if="isLoggedIn" class="mb-14" />
      <LazyRecentListsNotLoggedIn v-else class="mb-14" />
      <template #fallback>
        <LazyRecentListsNotLoggedIn class="mb-14" />
      </template>
    </ClientOnly>

    <LazyFeaturedSection class="mb-14" />

    <LazyRecentArticles class="mb-14" />

    <LazyQueryCount class="mb-14"></LazyQueryCount>

    <!-- How To Use & How It Works Section -->
    <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- How To Use -->
      <div
        class="p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-linear-to-br from-primary/10 via-primary/5 to-transparent"
      >
        <div class="flex items-start gap-4">
          <UIcon
            name="i-lucide-book-open"
            class="text-3xl text-primary shrink-0 mt-1"
          />
          <div>
            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">
              How To Use
            </h2>
            <p class="text-base md:text-lg leading-relaxed">
              Simply describe the cards you want in plain English, and let our
              semantic search engine do the rest. Still not sure? Try an example
              query below!
            </p>
          </div>
        </div>
      </div>

      <!-- How It Works -->
      <div
        class="p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-linear-to-br from-primary/10 via-primary/5 to-transparent"
      >
        <div class="flex items-start gap-4">
          <UIcon
            name="i-lucide-sparkles"
            class="text-3xl text-primary shrink-0 mt-1"
          />
          <div>
            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">
              How It Works
            </h2>
            <p class="text-base md:text-lg leading-relaxed">
              Our custom models use advanced machine learning techniques to
              understand the nuances of Magic including slang, synergies, and
              game mechanics.
            </p>
          </div>
        </div>
      </div>
    </div>
    <LazyEfficiency class="mb-20" />
    <ClientOnly>
      <LazyExampleQueries class="mb-10" />
      <template #fallback>
        <ExampleQueriesSkeleton class="mb-10" />
      </template>
    </ClientOnly>
    <ClientOnly>
      <LazyTopQueries class="mb-10" />
      <template #fallback>
        <TopQueriesSkeleton class="mb-10" />
      </template>
    </ClientOnly>
    <LazyMeetTheDevs class="mb-10" />
    <LazySponsorships class="mb-10" />
    <LazyJoinUs class="mb-10" />
  </UContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomePage' });
definePageMeta({
  layout: 'fullscreen',
});
useSeoMeta({
  title: 'CardMystic - Smart Search Engine for Magic: The Gathering',
  description:
    'Search Magic: The Gathering cards using natural language. Find MTG cards by describing what you want in plain English.',
  ogTitle: 'CardMystic - Smart Search Engine for Magic: The Gathering',
  ogDescription:
    'Search Magic: The Gathering cards using natural language. Find MTG cards by describing what you want in plain English.',
  ogType: 'website',
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => 'CardMystic - Smart Search Engine for Magic: The Gathering',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CardMystic - Smart Search Engine for Magic: The Gathering',
  twitterDescription:
    'Search Magic: The Gathering cards using natural language. Find MTG cards by describing what you want in plain English.',
});

useHead({
  link: [
    // Preload the hero card images so the browser can fetch them
    // in parallel with the HTML document instead of waiting for the
    // `<img>` tags to be discovered during render.
    {
      rel: 'preload',
      as: 'image',
      href: '/ugin.webp',
      type: 'image/webp',
      fetchpriority: 'high',
    },
    {
      rel: 'preload',
      as: 'image',
      href: '/kaalia.webp',
      type: 'image/webp',
      fetchpriority: 'high',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      src: '/ld/home.json',
    },
  ],
});

import { useUserProfile } from '~/composables/useUserProfile';

// Check if user is logged in
const { userProfile } = useUserProfile();
const isLoggedIn = computed(() => !!userProfile.value);

// Hardcoded hero cards, fanned out on the right side of the hero.
// Each renders as an image link to its card detail page. The
// "Ready To Search" example query below them is chosen to match
// these cards, so the hero reads as a live search result.
const heroCards = [
  {
    id: 'eecb3047-a563-441a-9175-200421981ac3',
    name: 'Ugin, the Spirit Dragon',
    image: '/ugin.webp',
    position: 'hero-card-back',
  },
  {
    id: 'cb8d80c9-ed58-4f2d-aa8c-c383370c7f1a',
    name: 'Kaalia of the Vast',
    image: '/kaalia.webp',
    position: 'hero-card-front',
  },
];

// Example query shown in the "Ready To Search" card — kept in sync
// with the hero cards above (both are giant flying threats Kaalia
// can cheat into play).
const readyToSearch = {
  query: 'Angels, demons, and dragons',
  description: 'Results ranked by how closely card text matches the idea.',
};

const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/',
  page_name: 'Home Page',
  query: '',
  card_name: '',
  filters: undefined,
});
</script>

<style lang="sass" scoped>
.hero
  position: relative
  min-height: 100vh
  padding: 110px 0 60px
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-bottom: 3px solid white
  overflow: hidden
  @media (max-width: 1023px)
    padding: 90px 0 40px

.hero-eyebrow
  font-family: monospace
  font-size: 0.85rem
  font-weight: 600
  letter-spacing: 0.35em
  text-transform: uppercase
  color: var(--ui-highlight)

.hero-title
  font-size: clamp(3rem, 6vw, 5.5rem)
  font-weight: 900
  line-height: 0.95
  letter-spacing: -0.02em
  text-transform: uppercase

.hero-title-highlight
  display: block
  background: linear-gradient(100deg, #c4b5fd 0%, #8f6edf 60%, #6d4fc4 100%)
  -webkit-background-clip: text
  background-clip: text
  -webkit-text-fill-color: transparent
  color: transparent

.hero-subtitle
  max-width: 34rem
  font-size: 1.00rem
  line-height: 1.6
  color: rgba(230, 230, 250, 0.85)

// ── Fanned cards + Ready To Search ─────────────────────────────
.hero-right
  position: relative
  width: 100%
  max-width: 480px
  height: 560px
  margin: 0 auto
  @media (max-width: 1023px)
    max-width: 400px
    height: 470px

.hero-card
  position: absolute
  display: block
  cursor: pointer
  border-radius: 14px

.hero-card:hover
  z-index: 10

.hero-card-img
  width: 100%
  height: auto
  aspect-ratio: 360/502
  object-fit: cover
  border-radius: 14px
  display: block
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)

.hero-card:hover .hero-card-img
  transform: scale(1.05)

// Ugin — behind, tilted right, purple glow
.hero-card-back
  top: 0
  right: 0
  width: 62%
  transform: rotate(7deg)
  z-index: 1
  .hero-card-img
    border: 3px solid rgba(143, 110, 223, 0.9)

// Kaalia — in front, tilted left, orange glow
.hero-card-front
  top: 18%
  left: 0
  width: 64%
  transform: rotate(-8deg)
  z-index: 2
  .hero-card-img
    border: 3px solid rgba(228, 132, 42, 0.9)

.ready-card
  position: absolute
  bottom: 0
  right: 0
  z-index: 3
  width: min(320px, 92%)
  padding: 14px 16px
  border-radius: 12px
  background: #fff
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45)
  text-align: left
  text-decoration: none
  transition: transform 0.2s ease
  &:hover
    transform: translateY(-2px)

.ready-label
  font-size: 0.7rem
  font-weight: 700
  letter-spacing: 0.15em
  text-transform: uppercase
  color: #8f6edf

.ready-icon
  font-size: 1.1rem
  color: #8f6edf
  flex-shrink: 0

.ready-query
  margin-top: 4px
  font-size: 1rem
  font-weight: 700
  color: #111827

.ready-desc
  margin-top: 2px
  font-size: 0.85rem
  line-height: 1.4
  color: #6b7280
</style>
