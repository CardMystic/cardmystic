<template>
  <div class="w-full mt-2">
    <div class="flex justify-center">
      <UButton
        class="cursor-pointer"
        variant="ghost"
        size="sm"
        color="info"
        :icon="open ? 'i-lucide-chevron-up' : 'i-lucide-info'"
        @click="
          () => {
            open = !open;
          }
        "
      >
        {{ title }}
      </UButton>
    </div>
    <div
      class="grid transition-all duration-300 ease-in-out"
      :class="
        open
          ? 'grid-rows-[1fr] opacity-100 mt-2'
          : 'grid-rows-[0fr] opacity-0 mt-0'
      "
    >
      <div class="overflow-hidden">
        <div class="flex justify-center">
          <UCard
            class="max-w-lg w-full mt-2 mb-2"
            variant="soft"
            :ui="{ body: 'p-4' }"
          >
            <component :is="useH1 ? 'h1' : 'h2'" class="text-lg font-bold mb-3">
              {{ heading }}
            </component>
            <div class="space-y-2 text-sm text-gray-400">
              <p v-for="(paragraph, i) in paragraphs" :key="i">
                {{ paragraph }}
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export type SearchAboutType =
  | 'ai'
  | 'similarity'
  | 'commander'
  | 'keyword'
  | 'recommend'
  | 'popular-cards'
  | 'popular-commanders'
  | 'popular-by-commander';

const open = ref(false);

const props = withDefaults(
  defineProps<{
    type: SearchAboutType;
    useH1?: boolean;
  }>(),
  {
    useH1: true,
  },
);

const content: Record<
  SearchAboutType,
  { title: string; heading: string; paragraphs: string[] }
> = {
  ai: {
    title: 'About Smart Search',
    heading: 'MTG Smart Card Search',
    paragraphs: [
      "Search for Magic: The Gathering cards using natural language. Describe the card, mechanic, or effect you are looking for and CardMystic's semantic search engine will find the best matches.",
      'Our custom semantic (aka vector) machine learning model works by creating numerical representations of card text using advanced techniques, then compares these representations to find the most relevant results.',
      'Try searches like: "creatures that double tokens", "instant speed enchantment removal", or "lands that produce any color of mana".',
    ],
  },

  similarity: {
    title: 'About Similarity Search',
    heading: 'MTG Card Similarity Search',
    paragraphs: [
      'Find Magic: The Gathering cards similar to any card in the game. This search is great for discovering alternatives, budget replacements, and cards with similar mechanics or abilities.',
      'Our custom semantic (aka vector) machine learning model works by creating numerical representations of card text using advanced techniques, then compares these representations to find the most relevant results.',
      'Simply enter a card name to find other cards that have similar mechanics and abilities.',
    ],
  },

  commander: {
    title: 'About Commander Search',
    heading: 'MTG Commander Search',
    paragraphs: [
      "Find the perfect commander for your next EDH deck using CardMystic's MTG Commander search. Describe the strategy, playstyle, or theme you want and discover commanders that match your deck concept.",
      'Our custom semantic (aka vector) machine learning model works by creating numerical representations of card text using advanced techniques, then compares these representations to find the most relevant results.',
      'Try searches like "group hug commander", "artifact combo commander in blue and red", or "graveyard recursion commander" to find a leader for your next deck.',
    ],
  },

  keyword: {
    title: 'About Keyword Search',
    heading: 'MTG Keyword Search',
    paragraphs: [
      'Search Magic: The Gathering cards by keywords, mechanics, or oracle text.',
      'This is a traditional keyword search that uses fuzzy matching to find cards that match the exact keywords you enter.',
    ],
  },

  recommend: {
    title: 'About Deck Recommender',
    heading: 'MTG Deck Card Recommender',
    paragraphs: [
      'Get personalized card recommendations for your Magic: The Gathering deck. Paste your decklist and CardMystic will suggest cards that improve synergy, consistency, and power level.',
      'Our ALS (Alternating Least Squares) machine learning model compares your deck to similar decks in our database and finds cards you are missing using linear algebra.',
      'Describe what you\'re looking for, such as "card draw", "artifact removal", or "token synergy" to receive targeted card recommendations tailored to your strategy.',
      'NOTE: The recommendation model is trained explicitly on Commander decks. Other formats coming soon!',
    ],
  },

  'popular-cards': {
    title: 'About Popular Commander Cards',
    heading: 'Popular MTG Commander Cards',
    paragraphs: [
      'Discover the most popular Magic: The Gathering cards across all Commander (EDH) decks.',
      "Use the optional search bar to re-rank results by semantic relevance: describe what you're looking for and the ranking will adjust to highlight the most relevant popular cards.",
    ],
  },

  'popular-commanders': {
    title: 'About Popular Commanders',
    heading: 'Popular MTG Commanders',
    paragraphs: [
      'Discover the most popular commanders across all EDH decks.',
      'Use the optional search bar to re-rank results by semantic relevance: describe a strategy or theme and the ranking will adjust to highlight the most relevant popular commanders.',
    ],
  },

  'popular-by-commander': {
    title: 'About Popular Cards by Commander',
    heading: 'Popular Cards by Commander',
    paragraphs: [
      'Discover the most popular cards for any commander.',
      'Select a commander to see which cards appear most often in their decks. If the commander has a partner, you can optionally select a partner to refine the results further.',
      'Use the optional search bar to re-rank results by semantic relevance: describe what you\'re looking for (e.g. "ramp", "removal", "card draw") and the ranking will adjust accordingly.',
    ],
  },
};

const title = computed(() => content[props.type].title);
const heading = computed(() => content[props.type].heading);
const paragraphs = computed(() => content[props.type].paragraphs);
</script>
