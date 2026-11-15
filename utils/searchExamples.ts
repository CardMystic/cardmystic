export type LandingSearchType =
  | 'smart'
  | 'similarity'
  | 'commander'
  | 'keyword'
  | 'recommend'
  | 'popular-by-commander'
  | 'popular-by-card';

interface Suggestion {
  label: string;
  icon: string;
}

interface LandingConfig {
  heading: string;
  suggestions: Suggestion[];
}

export const landingConfigs: Record<LandingSearchType, LandingConfig> = {
  'popular-by-commander': {
    heading: 'Find Popular Cards for Your Commander',
    suggestions: [
      { label: 'Kaalia of the Vast', icon: 'i-mdi-crown' },
      { label: "Atraxa, Praetors' Voice", icon: 'i-mdi-crown' },
      { label: 'Muldrotha, the Gravetide', icon: 'i-mdi-crown' },
      { label: 'Korvold, Fae-Cursed King', icon: 'i-mdi-crown' },
      { label: 'Isshin, Two Heavens as One', icon: 'i-mdi-crown' },
      { label: "Yuriko, the Tiger's Shadow", icon: 'i-mdi-crown' },
    ],
  },
  'popular-by-card': {
    heading: 'Find Commanders That Play Your Card',
    suggestions: [
      { label: 'Doubling Season', icon: 'i-lucide-copy-plus' },
      { label: 'Skullclamp', icon: 'i-lucide-book-open' },
      { label: "Ashnod's Altar", icon: 'i-lucide-skull' },
      { label: 'Impact Tremors', icon: 'i-lucide-flame' },
      { label: 'Hardened Scales', icon: 'i-lucide-plus' },
      { label: 'Birthing Pod', icon: 'i-lucide-sprout' },
    ],
  },
  smart: {
    heading: 'The Fastest Way To Find The Right Cards',
    suggestions: [
      {
        label: 'Creatures that draw cards',
        icon: 'i-lucide-book-open',
      },
      {
        label: 'Two-mana mana rocks',
        icon: 'i-lucide-gem',
      },
      {
        label: 'Instant-speed protection',
        icon: 'i-lucide-shield',
      },
      {
        label: 'Graveyard recursion',
        icon: 'i-lucide-refresh-cw',
      },
      {
        label: 'Token doublers',
        icon: 'i-lucide-copy-plus',
      },
      {
        label: 'Exile board wipes',
        icon: 'i-lucide-sparkles',
      },
    ],
  },
  similarity: {
    heading: 'Find Similar Effects & Alternatives to Your Favorite Cards',
    suggestions: [
      {
        label: 'Lightning Bolt',
        icon: 'i-lucide-zap',
      },
      { label: 'Sol Ring', icon: 'i-lucide-circle-dot' },
      {
        label: 'Rhystic Study',
        icon: 'i-lucide-book-open',
      },
      {
        label: 'Swords to Plowshares',
        icon: 'i-lucide-swords',
      },
      {
        label: 'Cyclonic Rift',
        icon: 'i-lucide-waves',
      },
      {
        label: 'Counterspell',
        icon: 'i-lucide-shield-x',
      },
    ],
  },
  commander: {
    heading: 'Find the Perfect Commander for Your Next Deck',
    suggestions: [
      {
        label: 'Graveyard recursion',
        icon: 'i-lucide-refresh-cw',
      },
      {
        label: 'Spellslinger',
        icon: 'i-lucide-wand-sparkles',
      },
      {
        label: 'Artifact combo',
        icon: 'i-lucide-cog',
      },
      {
        label: 'Group hug',
        icon: 'i-lucide-hand-heart',
      },
      {
        label: 'Voltron',
        icon: 'i-lucide-swords',
      },
      {
        label: 'Token army',
        icon: 'i-lucide-users',
      },
    ],
  },
  keyword: {
    heading: 'Search MTG Cards by Mechanics and Rules Text',
    suggestions: [
      {
        label: 'Draw a card',
        icon: 'i-lucide-book-open',
      },
      {
        label: 'Create a token',
        icon: 'i-lucide-copy-plus',
      },
      {
        label: 'Destroy target creature',
        icon: 'i-lucide-skull',
      },
      {
        label: 'Counter target spell',
        icon: 'i-lucide-shield-x',
      },
      {
        label: 'Whenever a creature dies',
        icon: 'i-lucide-refresh-ccw',
      },
      {
        label: 'Enters the battlefield',
        icon: 'i-lucide-log-in',
      },
    ],
  },
  recommend: {
    heading: 'Find Cards That Belong in Your Deck',
    suggestions: [
      {
        label: 'Korvold, Fae-Cursed King',
        icon: 'i-mdi-crown',
      },
      {
        label: 'Kaalia of the Vast',
        icon: 'i-mdi-crown',
      },
      {
        label: "Atraxa, Praetors' Voice",
        icon: 'i-mdi-crown',
      },
      {
        label: 'Muldrotha, the Gravetide',
        icon: 'i-mdi-crown',
      },
      {
        label: 'Isshin, Two Heavens as One',
        icon: 'i-mdi-crown',
      },
      {
        label: "Yuriko, the Tiger's Shadow",
        icon: 'i-mdi-crown',
      },
    ],
  },
};

// Curated example queries shown under the home hero search bar.
// These queries have no equivalent curated page; keep their exact searches
// as crawlable links without prefetching results for every chip.
export const baseQueries = [
  'X spell board wipes',
  'lands that make any color',
  'aristocrats draw engine',
  'token doublers',
];

export const moreQueries = [
  'etb triggers',
  'instant speed enchantment removal',
  'graveyard recursion',
  'mana rocks that cost 2 or less',
];
