<template>
  <div class="w-full mt-2">
    <div class="flex justify-center">
      <UButton variant="ghost" size="sm" color="info" :icon="open ? 'i-lucide-chevron-up' : 'i-lucide-info'"
        @click="open = !open">
        {{ title }}
      </UButton>
    </div>
    <div v-show="open" class="flex justify-center mt-2">
      <UCard class="max-w-lg w-full" :ui="{ body: 'p-4' }">
        <component :is="useH1 ? 'h1' : 'h2'" class="text-lg font-bold mb-3">
          {{ heading }}
        </component>
        <div class="space-y-2 text-sm text-gray-400">
          <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
export type SearchAboutType = 'ai' | 'similarity' | 'commander' | 'keyword' | 'recommend'

const open = ref(false)

const props = withDefaults(defineProps<{
  type: SearchAboutType
  useH1?: boolean
}>(), {
  useH1: true,
})

const content: Record<SearchAboutType, { title: string; heading: string; paragraphs: string[] }> = {
  ai: {
    title: 'About AI Search',
    heading: 'MTG AI Card Search',
    paragraphs: [
      'Search for Magic: The Gathering cards using natural language. Describe the card, mechanic, or effect you are looking for and CardMystic\'s AI-powered MTG card search will find the best matches.',
      'Instead of memorizing exact card names, you can search using plain English. Our AI understands card mechanics, abilities, and gameplay interactions.',
      'Try searches like "creatures that double tokens", "instant speed enchantment removal", or "lands that produce any color of mana" to quickly discover powerful cards for your deck.',
      'Level up your next deck whether you\'re playing Commander, MTGO, MTG Arena, or any other Magic: The Gathering format!'
    ],
  },

  similarity: {
    title: 'About Similarity Search',
    heading: 'MTG Card Similarity Search',
    paragraphs: [
      'Find Magic: The Gathering cards similar to any card in the game. CardMystic\'s MTG similarity search helps you discover alternatives, budget replacements, and cards with similar mechanics or abilities.',
      'Enter a card name and our AI model analyzes card text, mana cost, card type, and gameplay effects to find similar cards.',
      'Use filters like color identity, card type, mana value, and format legality to narrow results and quickly find cards that fit perfectly into your deck.',
      'Level up your next deck whether you\'re playing Commander, MTGO, MTG Arena, or any other Magic: The Gathering format!'
    ],
  },

  commander: {
    title: 'About Commander Search',
    heading: 'MTG Commander Search',
    paragraphs: [
      'Find the perfect commander for your next EDH deck using CardMystic\'s MTG Commander search. Describe the strategy, playstyle, or theme you want and discover commanders that match your deck concept.',
      'Our AI understands Commander-specific concepts such as color identity, tribal synergies, combo strategies, and popular EDH archetypes. This makes it easy to explore new commanders and unique deck ideas.',
      'Try searches like "group hug commander", "artifact combo commander in blue and red", or "graveyard recursion commander" to discover powerful leaders for your next deck.',
      'Level up your next deck whether you\'re playing Commander, MTGO, MTG Arena, or any other Magic: The Gathering format!'
    ],
  },

  keyword: {
    title: 'About Keyword Search',
    heading: 'MTG Keyword Search',
    paragraphs: [
      'Search Magic: The Gathering cards by keywords, mechanics, or oracle text. CardMystic\'s keyword search scans the full card database to find cards with specific abilities and interactions.',
      'This search is ideal when you know the mechanic or ability you want. Find cards with flying, trample, deathtouch, sacrifice effects, token generation, and many other MTG mechanics.',
      'Combine keywords with filters like color identity, card type, mana value, rarity, and format legality to quickly find cards that match your deckbuilding requirements.',
      'Level up your next deck whether you\'re playing Commander, MTGO, MTG Arena, or any other Magic: The Gathering format!'
    ],
  },

  recommend: {
    title: 'About Deck Recommender',
    heading: 'MTG Deck Card Recommender',
    paragraphs: [
      'Get personalized card recommendations for your Magic: The Gathering deck. Paste your decklist and CardMystic will suggest cards that improve synergy, consistency, and power level.',
      'Our recommendation model compares your deck to similar decks in our database to suggest cards that strengthen your deck and fill missing roles like card draw, ramp, or removal.',
      'You can describe what your deck needs, such as "card draw", "artifact removal", or "token synergy" to receive targeted card recommendations tailored to your strategy.',
      'Level up your next deck whether you\'re playing Commander, MTGO, MTG Arena, or any other Magic: The Gathering format!'
    ],
  },
}

const title = computed(() => content[props.type].title)
const heading = computed(() => content[props.type].heading)
const paragraphs = computed(() => content[props.type].paragraphs)
</script>
