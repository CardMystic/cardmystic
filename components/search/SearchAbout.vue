<template>
  <div class="w-full mt-2">
    <div class="flex justify-center">
      <UButton variant="ghost" size="sm" color="info" :icon="open ? 'i-lucide-chevron-up' : 'i-lucide-info'"
        @click="open = !open">
        {{ title }}
      </UButton>
    </div>
    <div class="grid transition-all duration-300 ease-in-out"
      :class="open ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'">
      <div class="overflow-hidden">
        <div class="flex justify-center">
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
    </div>
  </div>
</template>

<script setup lang="ts">
export type SearchAboutType = 'ai' | 'similarity' | 'commander' | 'keyword' | 'recommend'
  | 'arena-ai' | 'arena-similarity' | 'arena-recommend' | 'arena-commander' | 'arena-keyword'
  | 'mtgo-ai' | 'mtgo-similarity' | 'mtgo-recommend' | 'mtgo-commander' | 'mtgo-keyword'
  | 'modern-ai' | 'modern-similarity' | 'modern-recommend' | 'modern-commander' | 'modern-keyword'
  | 'paper-ai' | 'paper-similarity' | 'paper-recommend' | 'paper-commander' | 'paper-keyword'
  | 'commander-ai' | 'commander-similarity' | 'commander-recommend' | 'commander-commander' | 'commander-keyword'

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
      'Describe what you\'re looking for , such as "card draw", "artifact removal", or "token synergy" to receive targeted card recommendations tailored to your strategy.',
      'Note: The recommendation model is trained on Commander decks. Other formats coming soon!',
    ],
  },

  'arena-ai': {
    title: 'About MTG Arena Card Search',
    heading: 'MTG Arena Card Search',
    paragraphs: [
      'Search for MTG Arena cards using natural language. CardMystic\'s AI-powered search helps you find Arena-legal cards by describing the mechanic, effect, or strategy you need.',
      'Results are filtered to cards available on MTG Arena, so every suggestion is ready for your next Arena deck. Perfect for Standard, Explorer, Historic, Brawl, and other Arena formats.',
      'Try searches like "creatures that draw cards on ETB", "cheap instant speed removal", or "multicolor lands" to discover powerful Arena-legal cards for your deck.',
    ],
  },

  'arena-similarity': {
    title: 'About MTG Arena Similarity Search',
    heading: 'MTG Arena Card Similarity Search',
    paragraphs: [
      'Find MTG Arena cards similar to any card in Magic: The Gathering. Discover Arena-legal alternatives, budget replacements, and cards with similar effects.',
      'Enter a card name and our engine finds the most similar cards available on MTG Arena. Ideal for finding substitutes when a card isn\'t available on Arena or when you need budget-friendly options.',
      'Use additional filters like color identity, card type, and mana value to narrow results for the perfect Arena deck fit.',
    ],
  },

  'arena-recommend': {
    title: 'About MTG Arena Deck Recommender',
    heading: 'MTG Arena Deck Builder & Card Recommender',
    paragraphs: [
      'Get AI-powered card recommendations for your MTG Arena deck. Paste your decklist and CardMystic will suggest Arena-legal cards that improve your deck\'s synergy and consistency.',
      'Our recommendation engine analyzes your deck and suggests cards available on MTG Arena that fill gaps in your strategy — whether you need more removal, card draw, ramp, or win conditions.',
      'Note: The recommendation model is trained on Commander decks, so results are optimized for the Commander format.',
      'Perfect for building and upgrading Standard, Explorer, Historic, and Brawl decks on MTG Arena.',
    ],
  },

  'mtgo-ai': {
    title: 'About MTGO Card Search',
    heading: 'MTGO Card Search',
    paragraphs: [
      'Search for Magic: The Gathering Online cards using natural language. CardMystic\'s AI search helps you find MTGO-legal cards by describing the effect, mechanic, or strategy you\'re looking for.',
      'Results are filtered to cards available on Magic: The Gathering Online, covering formats like Vintage, Legacy, Modern, Pauper, and more.',
      'Try searches like "efficient graveyard hate", "fast mana rocks", or "win conditions for control decks" to find powerful cards for your MTGO deck.',
    ],
  },

  'mtgo-similarity': {
    title: 'About MTGO Similarity Search',
    heading: 'MTGO Card Similarity Search',
    paragraphs: [
      'Find MTGO cards similar to any card in Magic: The Gathering. Discover alternatives and replacements available on Magic: The Gathering Online.',
      'Enter a card name and our engine finds the most similar cards available on MTGO. Great for finding budget alternatives or discovering cards with similar effects for competitive and casual play.',
      'Filter by color identity, card type, mana value, and format legality to find the perfect MTGO card for your deck.',
    ],
  },

  'mtgo-recommend': {
    title: 'About MTGO Deck Recommender',
    heading: 'MTGO Deck Builder & Card Recommender',
    paragraphs: [
      'Get AI-powered card recommendations for your MTGO deck. Paste your decklist and CardMystic will suggest cards available on Magic: The Gathering Online that strengthen your deck.',
      'Our recommendation engine analyzes your deck\'s strategy and suggests MTGO-legal cards to fill gaps — whether you need sideboard options, better removal, or stronger finishers.',
      'Note: The recommendation model is trained on Commander decks, so results are optimized for the Commander format.',
      'Ideal for building and tuning decks for Vintage, Legacy, Modern, Pauper, and other MTGO formats.',
    ],
  },

  'arena-commander': {
    title: 'About MTG Arena Commander Search',
    heading: 'MTG Arena Commander Search',
    paragraphs: [
      'Find the perfect commander for your next MTG Arena Brawl or Historic Brawl deck. Describe the strategy, playstyle, or theme you want and CardMystic\'s AI will find Arena-legal commanders that match.',
      'Results are filtered to legendary creatures available on MTG Arena, so every suggestion is ready for your next Brawl deck. Our AI understands color identity, tribal synergies, and popular Arena archetypes.',
      'Try searches like "lifegain commander", "token synergy Brawl commander", or "artifact commander in blue" to discover powerful Arena-legal commanders.',
    ],
  },

  'mtgo-commander': {
    title: 'About MTGO Commander Search',
    heading: 'MTGO Commander Search',
    paragraphs: [
      'Find the perfect commander for your next MTGO EDH deck. Describe the strategy, playstyle, or theme you want and CardMystic\'s AI will find MTGO-legal commanders that match your deck concept.',
      'Results are filtered to legendary creatures available on Magic: The Gathering Online, covering the full Commander card pool for competitive and casual EDH play.',
      'Try searches like "stax commander", "combo commander in Sultai", or "voltron commander" to discover powerful commanders for your MTGO EDH deck.',
    ],
  },

  'modern-ai': {
    title: 'About Modern Card Search',
    heading: 'MTG Modern Card Search',
    paragraphs: [
      'Search for Modern-legal Magic: The Gathering cards using natural language. CardMystic\'s AI-powered search helps you find cards legal in Modern by describing the mechanic, effect, or strategy you need.',
      'Results are filtered to cards legal in the Modern format, so every suggestion is tournament-ready. Perfect for building competitive Modern decks or exploring new strategies.',
      'Try searches like "efficient graveyard hate", "one mana cantrips", or "creatures that generate card advantage" to discover powerful Modern-legal cards for your deck.',
    ],
  },

  'modern-similarity': {
    title: 'About Modern Similarity Search',
    heading: 'MTG Modern Card Similarity Search',
    paragraphs: [
      'Find Modern-legal cards similar to any card in Magic: The Gathering. Discover alternatives, budget replacements, and cards with similar effects that are legal in Modern.',
      'Enter a card name and our AI finds the most similar cards legal in the Modern format. Ideal for finding substitutes, budget-friendly options, or sideboard alternatives for your Modern deck.',
      'Use additional filters like color identity, card type, and mana value to narrow results for the perfect Modern deck fit.',
    ],
  },

  'modern-commander': {
    title: 'About Modern Commander Search',
    heading: 'MTG Modern Commander Search',
    paragraphs: [
      'Find the perfect commander for a Modern-legal EDH deck. Describe the strategy, playstyle, or theme you want and CardMystic\'s AI will find Modern-legal commanders that match your deck concept.',
      'Results are filtered to legendary creatures legal in the Modern format, making it easy to explore commanders for Modern-legal Commander variants and casual play.',
      'Try searches like "energy commander", "aggro commander in red and white", or "graveyard commander" to discover powerful Modern-legal commanders.',
    ],
  },

  'modern-recommend': {
    title: 'About Modern Deck Recommender',
    heading: 'MTG Modern Deck Builder & Card Recommender',
    paragraphs: [
      'Get AI-powered card recommendations for your Modern deck. Paste your decklist and CardMystic will suggest Modern-legal cards that improve your deck\'s synergy and consistency.',
      'Our recommendation engine analyzes your deck and suggests cards legal in Modern that fill gaps in your strategy — whether you need better sideboard options, more efficient removal, or stronger finishers.',
      'Note: The recommendation model is trained on Commander decks, so results are optimized for the Commander format.',
      'Ideal for building and tuning competitive Modern decks for FNM, tournaments, and online play.',
    ],
  },

  'modern-keyword': {
    title: 'About Modern Keyword Search',
    heading: 'MTG Modern Keyword Search',
    paragraphs: [
      'Search Modern-legal Magic: The Gathering cards by keywords, mechanics, or oracle text. Find cards with specific abilities and interactions that are legal in the Modern format.',
      'This search is ideal when you know the mechanic or ability you want. Find Modern-legal cards with flying, trample, deathtouch, sacrifice effects, token generation, and many other MTG mechanics.',
      'Combine keywords with filters like color identity, card type, mana value, and rarity to quickly find Modern-legal cards that match your deckbuilding requirements.',
    ],
  },

  'arena-keyword': {
    title: 'About MTG Arena Keyword Search',
    heading: 'MTG Arena Keyword Search',
    paragraphs: [
      'Search MTG Arena cards by keywords, mechanics, or oracle text. Find Arena-legal cards with specific abilities and interactions for your next deck.',
      'This search is ideal when you know the mechanic or ability you want. Find Arena-legal cards with flying, trample, deathtouch, sacrifice effects, token generation, and many other MTG mechanics.',
      'Combine keywords with filters like color identity, card type, mana value, and rarity to quickly find Arena-legal cards for Standard, Explorer, Historic, and Brawl.',
    ],
  },

  'mtgo-keyword': {
    title: 'About MTGO Keyword Search',
    heading: 'MTGO Keyword Search',
    paragraphs: [
      'Search MTGO cards by keywords, mechanics, or oracle text. Find cards available on Magic: The Gathering Online with specific abilities and interactions.',
      'This search is ideal when you know the mechanic or ability you want. Find MTGO-legal cards with flying, trample, deathtouch, sacrifice effects, token generation, and many other MTG mechanics.',
      'Combine keywords with filters like color identity, card type, mana value, and format legality to quickly find MTGO cards for Vintage, Legacy, Modern, Pauper, and other formats.',
    ],
  },

  'paper-ai': {
    title: 'About Paper Card Search',
    heading: 'Paper MTG Card Search',
    paragraphs: [
      'Search for paper Magic: The Gathering cards using natural language. CardMystic\'s AI-powered search helps you find cards available in paper by describing the mechanic, effect, or strategy you need.',
      'Results are filtered to cards printed in paper, so every suggestion is available for tabletop play. Perfect for Commander, Legacy, Modern, Pioneer, Standard, and casual kitchen-table formats.',
      'Try searches like "board wipes that leave my creatures", "efficient card draw in green", or "tribal lords" to discover powerful paper cards for your deck.',
    ],
  },

  'paper-similarity': {
    title: 'About Paper Similarity Search',
    heading: 'Paper MTG Card Similarity Search',
    paragraphs: [
      'Find paper Magic: The Gathering cards similar to any card in the game. Discover alternatives, budget replacements, and cards with similar effects available in paper.',
      'Enter a card name and our AI finds the most similar cards available in paper. Ideal for finding substitutes or budget-friendly options for your tabletop deck.',
      'Use additional filters like color identity, card type, and mana value to narrow results for the perfect paper deck fit.',
    ],
  },

  'paper-commander': {
    title: 'About Paper Commander Search',
    heading: 'Paper MTG Commander Search',
    paragraphs: [
      'Find the perfect commander for your next paper EDH deck. Describe the strategy, playstyle, or theme you want and CardMystic\'s AI will find paper-legal commanders that match your deck concept.',
      'Results are filtered to legendary creatures available in paper, covering the full Commander card pool for competitive and casual tabletop play.',
      'Try searches like "lifegain commander", "spellslinger commander in blue and red", or "sacrifice commander" to discover powerful commanders for your paper EDH deck.',
    ],
  },

  'paper-recommend': {
    title: 'About Paper Deck Recommender',
    heading: 'Paper MTG Deck Builder & Card Recommender',
    paragraphs: [
      'Get AI-powered card recommendations for your paper Magic: The Gathering deck. Paste your decklist and CardMystic will suggest paper-available cards that improve your deck\'s synergy and consistency.',
      'Our recommendation engine analyzes your deck and suggests cards available in paper that fill gaps in your strategy — whether you need more removal, card draw, ramp, or win conditions.',
      'Note: The recommendation model is trained on Commander decks, so results are optimized for the Commander format.',
      'Ideal for building and tuning Commander, Legacy, Modern, Pioneer, and other tabletop format decks.',
    ],
  },

  'paper-keyword': {
    title: 'About Paper Keyword Search',
    heading: 'Paper MTG Keyword Search',
    paragraphs: [
      'Search paper Magic: The Gathering cards by keywords, mechanics, or oracle text. Find cards available in paper with specific abilities and interactions.',
      'This search is ideal when you know the mechanic or ability you want. Find paper cards with flying, trample, deathtouch, sacrifice effects, token generation, and many other MTG mechanics.',
      'Combine keywords with filters like color identity, card type, mana value, and rarity to quickly find paper cards for Commander, Legacy, Modern, and other tabletop formats.',
    ],
  },

  'commander-ai': {
    title: 'About Commander Card Search',
    heading: 'Commander MTG Card Search',
    paragraphs: [
      'Search for Commander-legal Magic: The Gathering cards using natural language. CardMystic\'s AI-powered search helps you find cards legal in Commander by describing the mechanic, effect, or strategy you need.',
      'Results are filtered to cards legal in the Commander format, so every suggestion is ready for your next EDH deck.',
      'Try searches like "board wipes that leave my creatures", "efficient card draw in green", or "combo pieces for infinite mana" to discover powerful Commander-legal cards for your deck.',
    ],
  },

  'commander-similarity': {
    title: 'About Commander Similarity Search',
    heading: 'Commander MTG Card Similarity Search',
    paragraphs: [
      'Find Commander-legal cards similar to any card in Magic: The Gathering. Discover alternatives, budget replacements, and cards with similar effects that are legal in Commander.',
      'Enter a card name and our AI finds the most similar cards legal in the Commander format. Ideal for finding substitutes or budget-friendly options for your EDH deck.',
      'Use additional filters like color identity, card type, and mana value to narrow results for the perfect Commander deck fit.',
    ],
  },

  'commander-commander': {
    title: 'About Commander Search',
    heading: 'Commander-Legal Commander Search',
    paragraphs: [
      'Find the perfect commander for your next EDH deck. Describe the strategy, playstyle, or theme you want and CardMystic\'s AI will find Commander-legal legendary creatures that match your deck concept.',
      'Results are filtered to legendary creatures legal in the Commander format, covering the full EDH card pool for competitive and casual play.',
      'Try searches like "lifegain commander", "spellslinger commander in blue and red", or "sacrifice commander" to discover powerful commanders for your EDH deck.',
    ],
  },

  'commander-keyword': {
    title: 'About Commander Keyword Search',
    heading: 'Commander MTG Keyword Search',
    paragraphs: [
      'Search Commander-legal Magic: The Gathering cards by keywords, mechanics, or oracle text. Find cards with specific abilities and interactions that are legal in the Commander format.',
      'This search is ideal when you know the mechanic or ability you want. Find Commander-legal cards with flying, trample, deathtouch, sacrifice effects, token generation, and many other MTG mechanics.',
      'Combine keywords with filters like color identity, card type, mana value, and rarity to quickly find Commander-legal cards for your EDH deck.',
    ],
  },

  'commander-recommend': {
    title: 'About Commander Deck Recommender',
    heading: 'Commander Deck Builder & Card Recommender',
    paragraphs: [
      'Get AI-powered card recommendations for your Commander deck. Paste your decklist and CardMystic will suggest Commander-legal cards that improve your deck\'s synergy and consistency.',
      'Our recommendation engine analyzes your deck and suggests cards legal in Commander that fill gaps in your strategy — whether you need more removal, card draw, ramp, or win conditions.',
      'Note: The recommendation model is trained on Commander decks, so results are optimized for the Commander format.',
      'Ideal for building and tuning competitive and casual EDH decks.',
    ],
  },
}

const title = computed(() => content[props.type].title)
const heading = computed(() => content[props.type].heading)
const paragraphs = computed(() => content[props.type].paragraphs)
</script>
