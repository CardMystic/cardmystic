<template>
  <LazyCometDog />
  <SpaceBackground :full="true">
    <div class="hero px-0 h-full w-full justify-center flex flex-col items-center">
      <div class="explore-spacer">
      </div>
      <UContainer class="flex flex-col items-center justify-center text-center max-w-250 h-full relative z-10">
        <div class="header-layout">
          <div class="title-container">
            <img src="/wizard.webp" class="image object-cover" alt="Wizard" fetchpriority="high" />
            <h1 class="subtitle text-white">
              <b style="color: var(--ui-highlight)">CardMystic</b> Is An <b style="color: var(--ui-highlight)">A.I.
                Search
                Engine</b> For
              <b style="color: var(--ui-highlight)">MTG</b>
            </h1>
          </div>
        </div>

        <!-- Search -->
        <Search :showAbout="true" />

      </UContainer>

      <!-- Explore text + icon -->
      <div class="explore-spacer mb-4 flex flex-col items-center gap-1 text-black">
        <!-- Fanned cards at bottom -->
        <div class="bottom-cards">
          <div v-if="heroCards[0]" class="card-wrapper card-left">
            <LazyCardSimple :card="heroCards[0]" size="small" />
          </div>
          <div v-if="heroCards[1]" class="card-wrapper card-center">
            <LazyCardSimple :card="heroCards[1]" size="small" />
          </div>
          <div v-if="heroCards[2]" class="card-wrapper card-right">
            <LazyCardSimple :card="heroCards[2]" size="small" />
          </div>
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
        class="p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-linear-to-br from-primary/10 via-primary/5 to-transparent">
        <div class="flex items-start gap-4">
          <UIcon name="i-lucide-book-open" class="text-3xl text-primary shrink-0 mt-1" />
          <div>
            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">How To Use</h2>
            <p class="text-base md:text-lg leading-relaxed">
              Simply describe the cards you want in plain English, and let our
              intelligent search engine do the rest. Still not sure? Try an
              example query below!
            </p>
          </div>
        </div>
      </div>

      <!-- How It Works -->
      <div
        class="p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-linear-to-br from-primary/10 via-primary/5 to-transparent">
        <div class="flex items-start gap-4">
          <UIcon name="i-lucide-sparkles" class="text-3xl text-primary shrink-0 mt-1" />
          <div>
            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">How It Works</h2>
            <p class="text-base md:text-lg leading-relaxed">
              Our A.I. experts meticulously train custom, state-of-the-art models to understand the nuances of Magic
              including
              slang, synergies, and game mechanics.
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
    <LazyProductPromotionButtons />
  </UContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomePage' });
definePageMeta({
  layout: 'fullscreen'
});
useSeoMeta({
  title: 'CardMystic - AI Search Engine for Magic: The Gathering',
  description: 'Search Magic: The Gathering cards using natural language AI. Find MTG cards by describing what you want in plain English.',
  ogTitle: 'CardMystic - AI Search Engine for Magic: The Gathering',
  ogDescription: 'Search Magic: The Gathering cards using natural language AI. Find MTG cards by describing what you want in plain English.',
  ogType: 'website',
  ogImage: 'https://cardmystic.com/cardmystic_cards.png',
  ogImageAlt: () => 'CardMystic - AI Search Engine for Magic: The Gathering',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CardMystic - AI Search Engine for Magic: The Gathering',
  twitterDescription: 'Search Magic: The Gathering cards using natural language AI. Find MTG cards by describing what you want in plain English.'
})

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/wizard.webp',
      type: 'image/webp',
      fetchpriority: 'high',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      src: '/ld/home.json'
    }
  ]
})

import type { Card as CardType } from '~/models/cardModel';
import { useUserProfile } from '~/composables/useUserProfile';
import { useSearchType } from '~/composables/useSearchType';
// Use search type composable to check if AI search is active
const { isAiSearch } = useSearchType();

// Check if user is logged in
const { userProfile } = useUserProfile();
const isLoggedIn = computed(() => !!userProfile.value);

// Hardcoded hero cards
const heroCards: CardType[] = [
  {
    card_name: 'Ugin, the Spirit Dragon',
    card_data: {
      id: '9c017fa9-7021-417a-9c2e-3df409644fcf',
      name: 'Ugin, the Spirit Dragon',
      image_uris: {
        normal: 'https://cards.scryfall.io/normal/front/1/b/1bacda35-bb91-4537-a14d-846650fa85f6.jpg?1594157535',
      }
    } as any
  },
  {
    card_name: 'The Ur-Dragon',
    card_data: {
      id: '10d42b35-844f-4a64-9981-c6118d45e826',
      name: 'The Ur-Dragon',
      image_uris: {
        normal: 'https://cards.scryfall.io/normal/front/6/2/6270c798-a3ba-4826-b0a9-82f7e12890f6.jpg?1719466632',
      }
    } as any
  },
  {
    card_name: 'Teferi, Time Raveler',
    card_data: {
      id: '662fe50f-d75c-422c-8c6c-1f9b5c4ba21f',
      name: 'Teferi, Time Raveler',
      image_uris: {
        normal: 'https://cards.scryfall.io/normal/front/5/a/5a47d968-bba0-4277-b5d7-eb9e1acd7953.jpg?1731704855',
      }
    } as any
  }
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
  width: 200px
  height: 200px
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
  @media (max-width: 768px)
    width: 105px
    
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
