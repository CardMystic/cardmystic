<template>
  <SpaceBackground :full="true">
    <LazyCometDog />
    <div
      class="hero px-0 h-full w-full justify-center flex flex-col items-center"
    >
      <div class="explore-spacer"></div>
      <UContainer
        class="flex flex-col items-center justify-center text-center max-w-250 h-full relative z-10"
      >
        <div class="header-layout">
          <div class="title-container">
            <img
              src="/wizard.webp"
              class="image object-cover"
              alt="Wizard"
              fetchpriority="high"
            />
            <h1 class="subtitle text-white">
              Build <b style="color: var(--ui-highlight)">Smarter Decks</b> With
              <b style="color: var(--ui-highlight)">Tools Designed</b> For
              <b style="color: var(--ui-highlight)">Magic</b>
            </h1>
          </div>
        </div>

        <!-- Search -->
        <Search :showAbout="true" />
      </UContainer>

      <!-- Explore text + icon -->
      <div
        class="explore-spacer mb-4 flex flex-col items-center gap-1 text-black"
      >
        <!-- Fanned cards at bottom. Self-hosted WebPs (~40 kB each) are
             much smaller than the equivalent Scryfall `normal` JPGs
             (~100 kB each) and don't add cross-origin DNS/connect time
             to LCP. Sized at the 2× DPR of their CSS box (180 × 251) so
             they look crisp on retina without wasted bytes. -->
        <div class="bottom-cards">
          <NuxtLink
            v-for="card in heroCards"
            :key="card.id"
            :to="`/card/${card.id}`"
            class="card-wrapper"
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
        </div>
      </div>
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
    {
      rel: 'preload',
      as: 'image',
      href: '/wizard.webp',
      type: 'image/webp',
      fetchpriority: 'high',
    },
    // Preload the three hero card images so the browser can fetch them
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
      href: '/ur-dragon.webp',
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
import { useSearchType } from '~/composables/useSearchType';
// Use search type composable to check if Smart search is active
const { isAiSearch } = useSearchType();

// Check if user is logged in
const { userProfile } = useUserProfile();
const isLoggedIn = computed(() => !!userProfile.value);

// Hardcoded hero cards. Each renders as a fanned-out image link to its
// card detail page. Images are self-hosted WebPs (~40 kB each, 360×502
// — exactly 2× the desktop CSS slot of 180×251) so they don't pull
// from scryfall.io on the most-visited page.
const heroCards = [
  {
    id: 'eecb3047-a563-441a-9175-200421981ac3',
    name: 'Ugin, the Spirit Dragon',
    image: '/ugin.webp',
    position: 'card-left',
  },
  {
    id: '87b22b09-4f6d-4bc5-9cfc-663e4c7c6981',
    name: 'The Ur-Dragon',
    image: '/ur-dragon.webp',
    position: 'card-center',
  },
  {
    id: 'cb8d80c9-ed58-4f2d-aa8c-c383370c7f1a',
    name: 'Kaalia of the Vast',
    image: '/kaalia.webp',
    position: 'card-right',
  },
];

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
  min-height:  100vh
  padding-top: 0px
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-bottom: 3px solid white
  overflow: hidden

.image
  width: 160px
  height: 160px
  position: relative
  z-index: 10
  @media (max-width: 768px)
    top: -10px
    width: 80px
    height: 80px

.explore-spacer
  flex-grow: 1
  justify-content: flex-end
  min-height: 120px

.header-layout
  margin-bottom: 20px
  @media (max-width: 768px)
    margin-bottom: 4px

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  text-align: center
  min-width: 372px
  position: relative

.bottom-cards
  position: absolute
  bottom: 0px
  left: 50%
  transform: translateX(-50%) translateY(50%)
  display: flex
  align-items: center
  justify-content: center
  width: 500px
  height: 300px
  z-index: 5
  @media (max-width: 768px)
    width: 350px
    height: 200px

.card-wrapper
  position: absolute
  width: 180px
  cursor: pointer
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  @media (max-width: 768px)
    width: 105px

.card-wrapper:hover
  z-index: 10

.hero-card-img
  width: 100%
  height: auto
  aspect-ratio: 360/502
  object-fit: cover
  border-radius: 8px
  display: block
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)

.card-wrapper:hover .hero-card-img
  transform: scale(1.08)

.card-left
  transform: rotate(-15deg) translateX(-100px)
  @media (max-width: 768px)
    transform: rotate(-15deg) translateX(-70px)

.card-center
  transform: rotate(0deg)
  z-index: 2

.card-right
  transform: rotate(15deg) translateX(100px)
  @media (max-width: 768px)
    transform: rotate(15deg) translateX(70px)

.subtitle
  font-size: 2.0rem
  line-height: 1.2
  @media (max-width: 768px)
    font-size: 1.5rem
    text-align: center
    position: relative
    top: -15px
</style>
