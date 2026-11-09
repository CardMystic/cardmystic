<template>
  <SpaceBackground :full="true">
    <div class="hero px-0 w-full flex flex-col items-center justify-center">
      <UContainer
        class="hero-grid grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center w-full max-w-350 relative z-10"
      >
        <!-- Left: title + search -->
        <div
          class="flex flex-col gap-5 items-center lg:items-start text-center lg:text-left"
        >
          <p class="hero-eyebrow">MTG SMART CARD SEARCH</p>
          <h1 class="hero-title text-white">
            Describe It.
            <span class="hero-title-highlight">Find It.</span>
          </h1>
          <p class="hero-subtitle">
            Just describe the effect you're looking for and we'll handle the
            rest! Free to use, no account needed!
          </p>

          <!-- Search (suggested searches + advanced filters render directly
               below the search bar on all breakpoints) -->
          <Search :show-suggested-searches="true" />
          <HeroStats />
        </div>

        <!-- Desktop artwork stays server-rendered. Mobile selects an inline
             placeholder so hidden images never download before hydration. -->
        <div class="hero-right">
          <NuxtLink
            v-for="card in heroCards"
            :key="card.id"
            :to="`/card/${card.id}`"
            no-prefetch
            class="hero-card"
            :class="card.position"
          >
            <picture>
              <source media="(min-width: 1024px)" :srcset="card.image" />
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                :alt="card.name"
                width="360"
                height="502"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                class="hero-card-img"
              />
            </picture>
          </NuxtLink>

          <!-- Example query matching the cards above -->
          <NuxtLink
            :to="{
              path: '/search/all/smart',
              query: { query: readyToSearch.query },
            }"
            no-prefetch
            class="ready-card"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="ready-label flex items-center gap-2">
                <UIcon
                  name="i-lucide-search"
                  class="size-4 shrink-0"
                  aria-hidden="true"
                />
                Ready to search
              </p>
            </div>
            <p class="ready-query">“{{ readyToSearch.query }}”</p>
          </NuxtLink>
        </div>
      </UContainer>
    </div>
  </SpaceBackground>

  <!-- Everything below the fold -->
  <UContainer class="home-content max-w-[2000px] my-8 lg:my-12">
    <ClientOnly>
      <RecentLists v-if="isLoggedIn" class="home-gallery mb-20 lg:mb-24" />
    </ClientOnly>

    <SearchShowcase class="home-gallery mb-20 lg:mb-24" />

    <LazyFeaturedSection
      :show-sign-in="!isLoggedIn"
      :hydrate-on-visible="sectionVisibility"
      class="home-gallery mb-20 lg:mb-24"
    />

    <LazyRecentArticles
      :hydrate-on-visible="sectionVisibility"
      class="home-gallery mb-20 lg:mb-24"
    />

    <ClientOnly>
      <LazyTopQueries class="home-reading mb-10" />
      <template #fallback>
        <TopQueriesSkeleton class="home-reading mb-10" />
      </template>
    </ClientOnly>
    <LazyMeetTheDevs
      :hydrate-on-visible="sectionVisibility"
      class="home-reading mb-10"
    />
    <LazySponsorships
      :hydrate-on-visible="sectionVisibility"
      class="home-reading mb-10"
    />
    <LazyJoinUs
      :hydrate-on-visible="sectionVisibility"
      class="home-reading mb-10"
    />
    <LazyExploreLinks
      :hydrate-on-visible="sectionVisibility"
      class="home-reading"
    />
  </UContainer>
</template>

<script setup lang="ts">
import homeSchema from '~~/public/home.json';

import { safeJsonLd } from '~/utils/safeJsonLd';

useCanonicalUrl('/');
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
  ogImage: 'https://cardmystic.com/cardmystic_preview.png',
  ogImageAlt: () => 'CardMystic - Smart Search Engine for Magic: The Gathering',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CardMystic - Smart Search Engine for Magic: The Gathering',
  twitterDescription:
    'Search Magic: The Gathering cards using natural language. Find MTG cards by describing what you want in plain English.',
});

useHead({
  link: [
    // Match the picture sources and layout breakpoint: preload only on desktop.
    {
      rel: 'preload',
      as: 'image',
      href: '/adrix-and-nev.jpg',
      media: '(min-width: 1024px)',
      type: 'image/jpeg',
      fetchpriority: 'high',
    },
    {
      rel: 'preload',
      as: 'image',
      href: '/mondrak.jpg',
      media: '(min-width: 1024px)',
      type: 'image/jpeg',
      fetchpriority: 'high',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: safeJsonLd(homeSchema),
    },
  ],
});

import { useUserProfile } from '~/composables/useUserProfile';

// Check if user is logged in
const { userProfile } = useUserProfile();
const isLoggedIn = computed(() => !!userProfile.value);

const sectionVisibility = { rootMargin: '200px' };

// Hardcoded hero cards, fanned out on the right side of the hero.
// Each renders as an image link to its card detail page. The
// "Ready To Search" example query below them is chosen to match
// these cards, so the hero reads as a live search result.
const heroCards = [
  {
    id: '12a6cad9-eb42-43bd-9e68-aaf862cd83db',
    name: 'Adrix and Nev, Twincasters',
    image: '/adrix-and-nev.jpg',
    position: 'hero-card-back',
  },
  {
    id: 'fe83087d-c6c1-40be-9295-baaa1c6b2db1',
    name: 'Mondrak, Glory Dominus',
    image: '/mondrak.jpg',
    position: 'hero-card-front',
  },
];

// Example query shown in the "Ready To Search" card — kept in sync
// with the token-doubling creatures above.
const readyToSearch = {
  query: 'Creatures that double your tokens',
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
.home-gallery
  width: 100%
  max-width: 1440px
  margin-inline: auto

.home-reading
  width: 100%
  max-width: 1120px
  margin-inline: auto

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
  color: var(--ui-text-highlighted)

.hero-title
  font-size: clamp(2.5rem, 5vw, 4.5rem)
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
    display: none

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

// Back card — behind, tilted right, purple glow
.hero-card-back
  top: 0
  right: 0
  width: 62%
  transform: rotate(7deg)
  z-index: 1
  .hero-card-img
    border: 3px solid rgba(143, 110, 223, 0.9)

// Front card — in front, tilted left, orange glow
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
</style>
