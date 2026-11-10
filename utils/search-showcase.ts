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

// Selected examples and Normal-search scores checked against the public API on 2026-11-08.
// Recommendation scores use Kaalia as commander with an empty starting deck; these are not a top-three ranking.
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
        name: 'Toxic Deluge',
        id: 'afaef788-34d1-460b-b884-9d7ae6ddeb18',
        image:
          'https://cards.scryfall.io/normal/front/1/d/1df2c2a6-94a9-4365-9bd5-dd5f2854c562.jpg?1793023039',
        score: 86.0,
      },
      {
        name: "Black Sun's Zenith",
        id: '038c0165-32b6-4e81-8180-604b49905207',
        image:
          'https://cards.scryfall.io/normal/front/e/d/eda98f51-a918-4ef7-a123-7d4200c79620.jpg?1783904562',
        score: 83.9,
      },
      {
        name: 'Starstorm',
        id: '34d112c3-cc2d-4428-bd7f-568bda61bd30',
        image:
          'https://cards.scryfall.io/normal/front/7/2/728b356a-e2ec-4c44-bd0a-bb9a5427a1ad.jpg?1783923956',
        score: 83.3,
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
        name: 'Clever Concealment',
        id: '42bb7ea9-f6e4-4551-8d93-3b1eae84b865',
        image:
          'https://cards.scryfall.io/normal/front/4/1/41d45a8a-ea1d-4fbc-86d2-5d6340f3b639.jpg?1783903251',
        score: 63.5,
      },
      {
        name: 'Flawless Maneuver',
        id: '4e183439-17d2-47ff-9d99-5e22821d91e3',
        image:
          'https://cards.scryfall.io/normal/front/3/f/3ffe82a4-584e-4ebd-9551-a745bed01e26.jpg?1789599786',
        score: 58.3,
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
    scoreLabel: 'Synergy score',
    cards: [
      {
        name: 'Master of Cruelties',
        id: 'd135c457-9be5-4a6e-a6fb-5b35cfb70cb0',
        image:
          'https://cards.scryfall.io/normal/front/f/f/ffd68fe1-5cfc-44cf-8dfe-3488278cdcef.jpg?1783913284',
        score: 77.4,
      },
      {
        name: 'Avacyn, Angel of Hope',
        id: '216cb26e-8da9-478b-bfbc-8030f7adee72',
        image:
          'https://cards.scryfall.io/normal/front/7/4/74e5dcec-ef1d-4461-bb23-61d98ff082dd.jpg?1783907976',
        score: 88.5,
      },
      {
        name: 'Balefire Dragon',
        id: '3d783beb-9ca6-4681-9276-fc3ad13b993f',
        image:
          'https://cards.scryfall.io/normal/front/e/4/e4510ee2-8a2e-4fe5-94af-df420a6a35a0.jpg?1783907975',
        score: 80.9,
      },
    ],
    examples: deckExamples,
  },
];

// Fixed public-list snapshots; homepage previews never fetch list data.
export { builder as builderExamples } from './home-examples.json';

// Hand-picked cards illustrate the Pro controls; no account or live recommendations are loaded.
export const proExamples = [
  {
    title: 'Suggested adds',
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
