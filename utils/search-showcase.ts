export interface DemoCard {
  name: string;
  id: string;
  image: string;
  score?: number;
  searched?: boolean;
}

export interface SearchDemo {
  id: string;
  title: string;
  description: { text: string; bold?: boolean }[];
  to: string;
  scoreLabel: string;
  icon: string;
  inputLabel: string;
  input: string;
  query?: string;
  cards: DemoCard[];
  examples: { label: string; to: string }[];
}

const smartLink = (query: string) =>
  '/search/all/smart?' + new URLSearchParams({ query, useRerank: 'false' });
const similarLink = (card_name: string) =>
  '/search/all/similarity?' +
  new URLSearchParams({ card_name, useRerank: 'false' });
export const deckExamples = [
  {
    label: 'Kaalia Angels',
    commander: 'Kaalia of the Vast',
    cards: [
      'Sol Ring',
      'Arcane Signet',
      'Orzhov Signet',
      'Boros Signet',
      'Rakdos Signet',
      'Swiftfoot Boots',
      'Lightning Greaves',
      'Swords to Plowshares',
      'Path to Exile',
      'Aurelia, the Warleader',
      'Angel of Despair',
      'Command Tower',
      'Exotic Orchard',
      '6 Plains',
      '6 Swamp',
      '6 Mountain',
    ],
  },
  {
    label: 'Meren Graveyard',
    commander: 'Meren of Clan Nel Toth',
    cards: [
      'Sol Ring',
      'Arcane Signet',
      'Golgari Signet',
      'Sakura-Tribe Elder',
      'Viscera Seer',
      'Spore Frog',
      'Eternal Witness',
      'Reclamation Sage',
      'Fleshbag Marauder',
      'Plaguecrafter',
      'Skullclamp',
      'Victimize',
      'Living Death',
      'Animate Dead',
      'Command Tower',
      'Exotic Orchard',
      '9 Forest',
      '9 Swamp',
    ],
  },
  {
    label: 'Aesi Landfall',
    commander: 'Aesi, Tyrant of Gyre Strait',
    cards: [
      'Sol Ring',
      'Arcane Signet',
      'Simic Signet',
      'Cultivate',
      "Kodama's Reach",
      'Explore',
      'Growth Spiral',
      'Rampant Growth',
      'Sakura-Tribe Elder',
      'Coiling Oracle',
      'Rampaging Baloths',
      'Avenger of Zendikar',
      'Scute Swarm',
      'Tatyova, Benthic Druid',
      'Command Tower',
      'Evolving Wilds',
      'Terramorphic Expanse',
      '9 Forest',
      '9 Island',
    ],
  },
].map(({ label, commander, cards }) => ({
  label,
  to:
    '/search/all/deckbuilder?' +
    new URLSearchParams({
      commander,
      decklist: cards
        .map((card) => (/^\d+ /.test(card) ? card : `1 ${card}`))
        .join('\n'),
      useRerank: 'false',
    }),
}));

// Current top Normal-mode results for each exact linked query, captured on 2026-11-22.
// Similarity includes the searched card followed by its top two matches.
export const searchDemos: SearchDemo[] = [
  {
    id: 'smart',
    title: 'Smart Search',
    icon: 'i-lucide-brain',
    description: [
      { text: 'Describe what you want your cards to do.', bold: true },
      { text: ' Find an effect ' },
      { text: 'without knowing its exact wording', bold: true },
      { text: ', then filter by ' },
      { text: 'colors, format, or budget', bold: true },
      { text: '.' },
    ],
    inputLabel: 'Describe the cards you want',
    input: 'X spell board wipes',
    to: smartLink('X spell board wipes'),
    scoreLabel: 'Match score',
    cards: [
      {
        name: 'Savage Twister',
        id: '5268518e-7631-4149-8eea-c2475b9b14df',
        image:
          'https://cards.scryfall.io/normal/front/0/6/06ec1b2d-06dd-4364-a913-c34889b70fa1.jpg?1783934269',
        score: 79.7,
      },
      {
        name: 'Lavalanche',
        id: '4475e9a7-4e94-4965-8e7e-211d40a98217',
        image:
          'https://cards.scryfall.io/normal/front/e/3/e3a3b450-d988-40cb-a1ee-8b00ccdf5071.jpg?1783921410',
        score: 79.1,
      },
      {
        name: 'Nova Flame',
        id: 'f4310dfd-52eb-4c1f-b1ad-bfbc9b50fe7b',
        image:
          'https://cards.scryfall.io/normal/front/1/b/1b5f713f-6ad9-445e-ae4c-56250bb3aecb.jpg?1783903280',
        score: 78.1,
      },
    ],
    examples: [
      'X spell board wipes',
      'lands that make any color',
      'graveyard recursion',
    ].map((query) => ({ label: query, to: smartLink(query) })),
  },
  {
    id: 'similarity',
    title: 'Similarity Search',
    icon: 'i-mdi-cards-outline',
    description: [
      { text: 'Start with a card you already like.', bold: true },
      { text: ' Find ' },
      { text: 'similar effects and alternatives', bold: true },
      { text: ', whether you need ' },
      { text: 'another copy', bold: true },
      { text: ' of an effect, a ' },
      { text: 'budget alternative', bold: true },
      { text: ', or a ' },
      { text: 'replacement for a Game Changer', bold: true },
      { text: '.' },
    ],
    inputLabel: 'Find cards similar to',
    input: "Teferi's Protection",
    to: similarLink("Teferi's Protection"),
    scoreLabel: 'Similarity score',
    cards: [
      {
        name: "Teferi's Protection",
        id: '0d4ecdb1-ec90-497f-a7a4-1c68092b8757',
        image:
          'https://cards.scryfall.io/normal/front/4/8/483fa1cb-1e35-44f2-a143-98c0f107f5ca.jpg?1783921926',
        searched: true,
      },
      {
        name: 'Ultimate Magic: Holy',
        id: '1eae48aa-f01d-4398-a68e-3b5af0542ab1',
        image:
          'https://cards.scryfall.io/normal/front/8/f/8fdb8414-2f08-42fb-ae0a-c7f0af1e144e.jpg?1783906364',
        score: 78.3,
      },
      {
        name: 'Perch Protection',
        id: '295fe873-ecb5-4d5e-a73c-3af6c478afc5',
        image:
          'https://cards.scryfall.io/normal/front/f/3/f3afb862-c156-495b-a0df-4c4ed0bbc869.jpg?1787677318',
        score: 77.9,
      },
    ],
    examples: [
      "Teferi's Protection",
      'Seedborn Muse',
      'Narset, Parter of Veils',
    ].map((name) => ({
      label: name,
      to: similarLink(name),
    })),
  },
  {
    id: 'recommend',
    title: 'Deck Recommender',
    icon: 'i-lucide-box',
    description: [
      { text: 'Choose a saved deck or paste a decklist.', bold: true },
      { text: ' Get ' },
      { text: 'personalized suggestions', bold: true },
      {
        text: ' that fit your deck, then narrow it down by searching for what you need such as “ramp”, “removal”, or “card draw”.',
      },
    ],
    inputLabel: 'Select your decklist',
    input: 'Kaalia of the Vast',
    query: 'Finishers',
    to:
      '/search/all/deckbuilder?' +
      new URLSearchParams({
        commander: 'Kaalia of the Vast',
        description: 'Finishers',
        useRerank: 'false',
      }),
    scoreLabel: 'Match score',
    cards: [
      {
        name: 'Lava Axe',
        id: '387b6b07-a283-412d-94c3-f7f1dc76e858',
        image:
          'https://cards.scryfall.io/normal/front/c/3/c3dab325-8f4f-4288-9f3f-960e52b4335b.jpg?1783934548',
        score: 73.2,
      },
      {
        name: 'Flame Rift',
        id: '28479aa8-d1cd-421a-8bbb-0594bb4dd410',
        image:
          'https://cards.scryfall.io/normal/front/e/6/e63ed449-d249-4639-85d2-f8fe75496d5c.jpg?1783926784',
        score: 68.1,
      },
      {
        name: 'City on Fire',
        id: '41eec4e8-92d3-4f98-9346-3a3e3cc602ce',
        image:
          'https://cards.scryfall.io/normal/front/6/f/6f455cc1-a822-44ef-ba7c-bfcff69bd45e.jpg?1783916996',
        score: 67.5,
      },
    ],
    examples: deckExamples,
  },
];

// Hand-picked cards illustrate suggested adds and cuts; no account or live recommendations are loaded.
export const deckSuggestionExamples = [
  {
    title: 'Suggested Adds',
    action: 'Add',
    icon: 'i-lucide-plus',
    color: 'success',
    cards: [
      {
        name: 'Foundry Inspector',
        id: '18f22960-87ec-43cd-82ea-ec5cabf49ad3',
        image:
          'https://cards.scryfall.io/normal/front/1/6/16debeb1-fb2b-4172-b6da-726416d4fb38.jpg?1783915599',
      },
      {
        name: 'Etherium Sculptor',
        id: '96b87445-6362-4a17-91b2-cbf203fd03fd',
        image:
          'https://cards.scryfall.io/normal/front/b/0/b0556f20-1ea8-4ab5-9a09-dec9959f017b.jpg?1783906043',
      },
      {
        name: 'Emry, Lurker of the Loch',
        id: 'da3e7d3d-2ca0-40c3-9602-fca37c92f507',
        image:
          'https://cards.scryfall.io/normal/front/c/9/c977d89a-bfd1-4e98-9d95-3e41c53dd188.jpg?1783906044',
      },
    ],
  },
  {
    title: 'Suggested cuts',
    action: 'Cut',
    icon: 'i-lucide-scissors',
    color: 'error',
    cards: [
      {
        name: 'Darksteel Ingot',
        id: 'a2529491-7389-4cfa-92d2-145eda779603',
        image:
          'https://cards.scryfall.io/normal/front/f/2/f279fcf1-e4f5-4873-9d73-8d62e0343b81.jpg?1783911890',
      },
      {
        name: 'Manalith',
        id: 'bd9e416a-89b3-4912-be9b-49fce6a93dc9',
        image:
          'https://cards.scryfall.io/normal/front/f/0/f0d7d904-f29b-4524-9223-27910d748bdb.jpg?1783933970',
      },
      {
        name: 'Cancel',
        id: '7d00fb28-ea6c-49a9-b4af-ffb38860a9a7',
        image:
          'https://cards.scryfall.io/normal/front/4/7/475bff39-220a-4490-9c2e-d311e306a6db.jpg?1783908966',
      },
    ],
  },
] as const;

// Fixed homepage results; no searches are run to render these cards.
export const deckSearchCards: DemoCard[] = [
  {
    name: 'Whipflare',
    id: 'a6b599db-8d45-4a11-9765-ae7eb235b4b2',
    image:
      'https://cards.scryfall.io/normal/front/8/1/81a3f7f3-da33-48d6-89c0-faf42998a08b.jpg?1783934732',
  },
  {
    name: 'All Is Dust',
    id: '14693689-d087-43b6-9c3f-63ab0648fc20',
    image:
      'https://cards.scryfall.io/normal/front/4/2/4210c54e-89fd-4971-ab6a-ca8f4e7fe97a.jpg?1783915459',
  },
  {
    name: 'Ugin, the Spirit Dragon',
    id: 'eecb3047-a563-441a-9175-200421981ac3',
    image:
      'https://cards.scryfall.io/normal/front/9/c/9c017fa9-7021-417a-9c2e-3df409644fcf.jpg?1783930748',
  },
];
