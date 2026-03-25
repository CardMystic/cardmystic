import type { CardSearchFilters } from '~/models/searchModel';

export type SeoSearchType = 'ai' | 'similarity' | 'keyword';

export interface SeoQuery {
  slug: string;
  /** The actual query string sent to the search API */
  query: string;
  searchType: SeoSearchType;
  filters?: Partial<CardSearchFilters>;
  /** SEO page title (appears in <title> and <h1>) */
  title: string;
  /** SEO meta description */
  description: string;
}

// ─── Similar Cards ───────────────────────────────────────────────
export const similarQueries: SeoQuery[] = [
  {
    slug: 'lightning-bolt',
    query: 'Lightning Bolt',
    searchType: 'similarity',
    title: 'Cards Similar to Lightning Bolt',
    description:
      'Find Magic: The Gathering cards similar to Lightning Bolt. Discover efficient burn spells, direct damage, and budget alternatives.',
  },
  {
    slug: 'counterspell',
    query: 'Counterspell',
    searchType: 'similarity',
    title: 'Cards Similar to Counterspell',
    description:
      'Find MTG cards similar to Counterspell. Discover counter magic, permission spells, and budget alternatives for your blue deck.',
  },
  {
    slug: 'swords-to-plowshares',
    query: 'Swords to Plowshares',
    searchType: 'similarity',
    title: 'Cards Similar to Swords to Plowshares',
    description:
      'Find MTG cards similar to Swords to Plowshares. Discover efficient white removal spells and exile effects.',
  },
  {
    slug: 'sol-ring',
    query: 'Sol Ring',
    searchType: 'similarity',
    title: 'Cards Similar to Sol Ring',
    description:
      'Find MTG cards similar to Sol Ring. Discover mana rocks, fast mana, and ramp artifacts for your Commander deck.',
  },
  {
    slug: 'path-to-exile',
    query: 'Path to Exile',
    searchType: 'similarity',
    title: 'Cards Similar to Path to Exile',
    description:
      'Find MTG cards similar to Path to Exile. Discover efficient removal spells and exile effects in white.',
  },
  {
    slug: 'thoughtseize',
    query: 'Thoughtseize',
    searchType: 'similarity',
    title: 'Cards Similar to Thoughtseize',
    description:
      'Find MTG cards similar to Thoughtseize. Discover hand disruption, discard spells, and black control staples.',
  },
  {
    slug: 'brainstorm',
    query: 'Brainstorm',
    searchType: 'similarity',
    title: 'Cards Similar to Brainstorm',
    description:
      'Find MTG cards similar to Brainstorm. Discover cantrips, card selection spells, and blue card draw effects.',
  },
  {
    slug: 'dark-ritual',
    query: 'Dark Ritual',
    searchType: 'similarity',
    title: 'Cards Similar to Dark Ritual',
    description:
      'Find MTG cards similar to Dark Ritual. Discover fast mana, ritual effects, and black mana acceleration.',
  },
  {
    slug: 'wrath-of-god',
    query: 'Wrath of God',
    searchType: 'similarity',
    title: 'Cards Similar to Wrath of God',
    description:
      'Find MTG cards similar to Wrath of God. Discover board wipes, mass removal, and destroy all creatures effects.',
  },
  {
    slug: 'birds-of-paradise',
    query: 'Birds of Paradise',
    searchType: 'similarity',
    title: 'Cards Similar to Birds of Paradise',
    description:
      'Find MTG cards similar to Birds of Paradise. Discover mana dorks, creature-based ramp, and green mana acceleration.',
  },
  {
    slug: 'fetchlands',
    query: 'Flooded Strand',
    searchType: 'similarity',
    title: 'Cards Similar to Fetch Lands',
    description:
      'Find MTG lands similar to fetch lands. Discover mana fixing, dual lands, and land search effects.',
  },
  {
    slug: 'rhystic-study',
    query: 'Rhystic Study',
    searchType: 'similarity',
    title: 'Cards Similar to Rhystic Study',
    description:
      'Find MTG cards similar to Rhystic Study. Discover powerful card draw enchantments and tax effects for Commander.',
  },
  {
    slug: 'cyclonic-rift',
    query: 'Cyclonic Rift',
    searchType: 'similarity',
    title: 'Cards Similar to Cyclonic Rift',
    description:
      'Find MTG cards similar to Cyclonic Rift. Discover mass bounce effects, blue board wipes, and overload spells.',
  },
  {
    slug: 'demonic-tutor',
    query: 'Demonic Tutor',
    searchType: 'similarity',
    title: 'Cards Similar to Demonic Tutor',
    description:
      'Find MTG cards similar to Demonic Tutor. Discover tutor effects, card search spells, and black utility cards.',
  },
  {
    slug: 'llanowar-elves',
    query: 'Llanowar Elves',
    searchType: 'similarity',
    title: 'Cards Similar to Llanowar Elves',
    description:
      'Find MTG cards similar to Llanowar Elves. Discover one-mana mana dorks and green creature ramp.',
  },
  // ── Moxfield Game Changers ──
  {
    slug: 'ad-nauseam',
    query: 'Ad Nauseam',
    searchType: 'similarity',
    title: 'Cards Similar to Ad Nauseam',
    description:
      'Find MTG cards similar to Ad Nauseam. Discover powerful draw engines, life-for-cards effects, and combo enablers.',
  },
  {
    slug: 'ancient-tomb',
    query: 'Ancient Tomb',
    searchType: 'similarity',
    title: 'Cards Similar to Ancient Tomb',
    description:
      'Find MTG cards similar to Ancient Tomb. Discover fast mana lands, colorless acceleration, and sol lands.',
  },
  {
    slug: 'aura-shards',
    query: 'Aura Shards',
    searchType: 'similarity',
    title: 'Cards Similar to Aura Shards',
    description:
      'Find MTG cards similar to Aura Shards. Discover creature-triggered removal, artifact and enchantment hate, and Selesnya staples.',
  },
  {
    slug: 'bolas-citadel',
    query: "Bolas's Citadel",
    searchType: 'similarity',
    title: "Cards Similar to Bolas's Citadel",
    description:
      "Find MTG cards similar to Bolas's Citadel. Discover life-as-resource engines, top-of-library play effects, and black combo pieces.",
  },
  {
    slug: 'braids-cabal-minion',
    query: 'Braids, Cabal Minion',
    searchType: 'similarity',
    title: 'Cards Similar to Braids, Cabal Minion',
    description:
      'Find MTG cards similar to Braids, Cabal Minion. Discover stax creatures, forced sacrifice effects, and resource denial.',
  },
  {
    slug: 'carpet-of-flowers',
    query: 'Carpet of Flowers',
    searchType: 'similarity',
    title: 'Cards Similar to Carpet of Flowers',
    description:
      'Find MTG cards similar to Carpet of Flowers. Discover efficient green ramp enchantments and opponent-dependent mana sources.',
  },
  {
    slug: 'consecrated-sphinx',
    query: 'Consecrated Sphinx',
    searchType: 'similarity',
    title: 'Cards Similar to Consecrated Sphinx',
    description:
      'Find MTG cards similar to Consecrated Sphinx. Discover massive card draw creatures, blue finishers, and draw doublers.',
  },
  {
    slug: 'craterhoof-behemoth',
    query: 'Craterhoof Behemoth',
    searchType: 'similarity',
    title: 'Cards Similar to Craterhoof Behemoth',
    description:
      'Find MTG cards similar to Craterhoof Behemoth. Discover game-ending creatures, Overrun effects, and green finishers.',
  },
  {
    slug: 'deflecting-swat',
    query: 'Deflecting Swat',
    searchType: 'similarity',
    title: 'Cards Similar to Deflecting Swat',
    description:
      'Find MTG cards similar to Deflecting Swat. Discover free spells, redirect effects, and commander-enabled protection.',
  },
  {
    slug: 'demonic-consultation',
    query: 'Demonic Consultation',
    searchType: 'similarity',
    title: 'Cards Similar to Demonic Consultation',
    description:
      'Find MTG cards similar to Demonic Consultation. Discover efficient tutors, combo enablers, and high-risk search effects.',
  },
  {
    slug: 'dockside-extortionist',
    query: 'Dockside Extortionist',
    searchType: 'similarity',
    title: 'Cards Similar to Dockside Extortionist',
    description:
      'Find MTG cards similar to Dockside Extortionist. Discover treasure generators, red ramp creatures, and ETB value engines.',
  },
  {
    slug: 'doubling-season',
    query: 'Doubling Season',
    searchType: 'similarity',
    title: 'Cards Similar to Doubling Season',
    description:
      'Find MTG cards similar to Doubling Season. Discover token doublers, counter doublers, and green value enchantments.',
  },
  {
    slug: 'drannith-magistrate',
    query: 'Drannith Magistrate',
    searchType: 'similarity',
    title: 'Cards Similar to Drannith Magistrate',
    description:
      'Find MTG cards similar to Drannith Magistrate. Discover hatebears, casting restriction effects, and white stax pieces.',
  },
  {
    slug: 'elesh-norn-grand-cenobite',
    query: 'Elesh Norn, Grand Cenobite',
    searchType: 'similarity',
    title: 'Cards Similar to Elesh Norn, Grand Cenobite',
    description:
      'Find MTG cards similar to Elesh Norn. Discover anthem effects, creature debuffs, and powerful white Praetors.',
  },
  {
    slug: 'emrakul-the-aeons-torn',
    query: 'Emrakul, the Aeons Torn',
    searchType: 'similarity',
    title: 'Cards Similar to Emrakul, the Aeons Torn',
    description:
      'Find MTG cards similar to Emrakul. Discover Eldrazi titans, annihilator creatures, and massive colorless finishers.',
  },
  {
    slug: 'enlightened-tutor',
    query: 'Enlightened Tutor',
    searchType: 'similarity',
    title: 'Cards Similar to Enlightened Tutor',
    description:
      'Find MTG cards similar to Enlightened Tutor. Discover artifact and enchantment tutors, white search effects, and toolbox enablers.',
  },
  {
    slug: 'expropriate',
    query: 'Expropriate',
    searchType: 'similarity',
    title: 'Cards Similar to Expropriate',
    description:
      'Find MTG cards similar to Expropriate. Discover extra turn spells, vote mechanics, and blue game-ending sorceries.',
  },
  {
    slug: 'fierce-guardianship',
    query: 'Fierce Guardianship',
    searchType: 'similarity',
    title: 'Cards Similar to Fierce Guardianship',
    description:
      'Find MTG cards similar to Fierce Guardianship. Discover free counterspells, commander-enabled protection, and blue shields.',
  },
  {
    slug: 'food-chain',
    query: 'Food Chain',
    searchType: 'similarity',
    title: 'Cards Similar to Food Chain',
    description:
      'Find MTG cards similar to Food Chain. Discover creature-based combo engines, exile-mana effects, and infinite mana enablers.',
  },
  {
    slug: 'force-of-will',
    query: 'Force of Will',
    searchType: 'similarity',
    title: 'Cards Similar to Force of Will',
    description:
      'Find MTG cards similar to Force of Will. Discover free counterspells, pitch spells, and blue force effects for Legacy and Commander.',
  },
  {
    slug: 'gaeas-cradle',
    query: "Gaea's Cradle",
    searchType: 'similarity',
    title: "Cards Similar to Gaea's Cradle",
    description:
      "Find MTG cards similar to Gaea's Cradle. Discover creature-based mana lands, green ramp lands, and powerful mana producers.",
  },
  {
    slug: 'grave-pact',
    query: 'Grave Pact',
    searchType: 'similarity',
    title: 'Cards Similar to Grave Pact',
    description:
      'Find MTG cards similar to Grave Pact. Discover forced sacrifice enchantments, aristocrats enablers, and death trigger payoffs.',
  },
  {
    slug: 'humility',
    query: 'Humility',
    searchType: 'similarity',
    title: 'Cards Similar to Humility',
    description:
      'Find MTG cards similar to Humility. Discover creature-neutralizing enchantments, stax pieces, and power/toughness setters.',
  },
  {
    slug: 'imperial-seal',
    query: 'Imperial Seal',
    searchType: 'similarity',
    title: 'Cards Similar to Imperial Seal',
    description:
      'Find MTG cards similar to Imperial Seal. Discover one-mana tutors, top-of-library search, and efficient black sorceries.',
  },
  {
    slug: 'intruder-alarm',
    query: 'Intruder Alarm',
    searchType: 'similarity',
    title: 'Cards Similar to Intruder Alarm',
    description:
      'Find MTG cards similar to Intruder Alarm. Discover untap engines, creature-triggered combos, and blue enchantment synergies.',
  },
  {
    slug: 'jeweled-lotus',
    query: 'Jeweled Lotus',
    searchType: 'similarity',
    title: 'Cards Similar to Jeweled Lotus',
    description:
      'Find MTG cards similar to Jeweled Lotus. Discover fast mana artifacts, commander ramp, and explosive acceleration.',
  },
  {
    slug: 'jin-gitaxias-core-augur',
    query: 'Jin-Gitaxias, Core Augur',
    searchType: 'similarity',
    title: 'Cards Similar to Jin-Gitaxias, Core Augur',
    description:
      'Find MTG cards similar to Jin-Gitaxias. Discover massive card draw creatures, hand disruption, and blue Praetors.',
  },
  {
    slug: 'kinnan-bonder-prodigy',
    query: 'Kinnan, Bonder Prodigy',
    searchType: 'similarity',
    title: 'Cards Similar to Kinnan, Bonder Prodigy',
    description:
      'Find MTG cards similar to Kinnan. Discover mana doublers, mana rock synergies, and Simic value commanders.',
  },
  {
    slug: 'korvold-fae-cursed-king',
    query: 'Korvold, Fae-Cursed King',
    searchType: 'similarity',
    title: 'Cards Similar to Korvold, Fae-Cursed King',
    description:
      'Find MTG cards similar to Korvold. Discover sacrifice commanders, Jund value engines, and sacrifice payoffs.',
  },
  {
    slug: 'land-tax',
    query: 'Land Tax',
    searchType: 'similarity',
    title: 'Cards Similar to Land Tax',
    description:
      'Find MTG cards similar to Land Tax. Discover land search enchantments, white ramp effects, and deck thinning.',
  },
  {
    slug: 'leovold-emissary-of-trest',
    query: 'Leovold, Emissary of Trest',
    searchType: 'similarity',
    title: 'Cards Similar to Leovold, Emissary of Trest',
    description:
      'Find MTG cards similar to Leovold. Discover draw restriction effects, Sultai hatebears, and control commanders.',
  },
  {
    slug: 'mana-crypt',
    query: 'Mana Crypt',
    searchType: 'similarity',
    title: 'Cards Similar to Mana Crypt',
    description:
      'Find MTG cards similar to Mana Crypt. Discover free mana rocks, fast artifact acceleration, and explosive mana sources.',
  },
  {
    slug: 'mana-drain',
    query: 'Mana Drain',
    searchType: 'similarity',
    title: 'Cards Similar to Mana Drain',
    description:
      'Find MTG cards similar to Mana Drain. Discover premium counterspells, mana-generating counters, and blue staples.',
  },
  {
    slug: 'mana-vault',
    query: 'Mana Vault',
    searchType: 'similarity',
    title: 'Cards Similar to Mana Vault',
    description:
      'Find MTG cards similar to Mana Vault. Discover burst mana rocks, untap-based acceleration, and fast mana artifacts.',
  },
  {
    slug: 'mystic-remora',
    query: 'Mystic Remora',
    searchType: 'similarity',
    title: 'Cards Similar to Mystic Remora',
    description:
      'Find MTG cards similar to Mystic Remora. Discover tax-based draw, cumulative upkeep cards, and blue enchantment draw engines.',
  },
  {
    slug: 'narset-parter-of-veils',
    query: 'Narset, Parter of Veils',
    searchType: 'similarity',
    title: 'Cards Similar to Narset, Parter of Veils',
    description:
      'Find MTG cards similar to Narset. Discover draw restriction effects, static ability planeswalkers, and blue control pieces.',
  },
  {
    slug: 'natural-order',
    query: 'Natural Order',
    searchType: 'similarity',
    title: 'Cards Similar to Natural Order',
    description:
      'Find MTG cards similar to Natural Order. Discover creature tutors, green cheating effects, and sacrifice-to-search spells.',
  },
  {
    slug: 'necropotence',
    query: 'Necropotence',
    searchType: 'similarity',
    title: 'Cards Similar to Necropotence',
    description:
      'Find MTG cards similar to Necropotence. Discover life-for-cards engines, black draw enchantments, and powerful resource conversion.',
  },
  {
    slug: 'omniscience',
    query: 'Omniscience',
    searchType: 'similarity',
    title: 'Cards Similar to Omniscience',
    description:
      'Find MTG cards similar to Omniscience. Discover free casting enchantments, cost reduction effects, and blue combo finishers.',
  },
  {
    slug: 'opposition-agent',
    query: 'Opposition Agent',
    searchType: 'similarity',
    title: 'Cards Similar to Opposition Agent',
    description:
      'Find MTG cards similar to Opposition Agent. Discover search denial, flash hatebears, and black disruption creatures.',
  },
  {
    slug: 'seedborn-muse',
    query: 'Seedborn Muse',
    searchType: 'similarity',
    title: 'Cards Similar to Seedborn Muse',
    description:
      'Find MTG cards similar to Seedborn Muse. Discover untap-all effects, green value creatures, and mana advantage engines.',
  },
  {
    slug: 'serra-ascendant',
    query: 'Serra Ascendant',
    searchType: 'similarity',
    title: 'Cards Similar to Serra Ascendant',
    description:
      'Find MTG cards similar to Serra Ascendant. Discover life threshold creatures, cheap white beaters, and commander lifegain staples.',
  },
  {
    slug: 'smothering-tithe',
    query: 'Smothering Tithe',
    searchType: 'similarity',
    title: 'Cards Similar to Smothering Tithe',
    description:
      'Find MTG cards similar to Smothering Tithe. Discover treasure generators, white ramp enchantments, and tax effects.',
  },
  {
    slug: 'stasis',
    query: 'Stasis',
    searchType: 'similarity',
    title: 'Cards Similar to Stasis',
    description:
      'Find MTG cards similar to Stasis. Discover untap denial, lockdown enchantments, and blue stax pieces.',
  },
  {
    slug: 'survival-of-the-fittest',
    query: 'Survival of the Fittest',
    searchType: 'similarity',
    title: 'Cards Similar to Survival of the Fittest',
    description:
      'Find MTG cards similar to Survival of the Fittest. Discover creature tutors, discard-to-search, and green toolbox enchantments.',
  },
  {
    slug: 'sylvan-library',
    query: 'Sylvan Library',
    searchType: 'similarity',
    title: 'Cards Similar to Sylvan Library',
    description:
      'Find MTG cards similar to Sylvan Library. Discover green draw enchantments, top-of-library manipulation, and life-for-cards.',
  },
  {
    slug: 'teferi-time-raveler',
    query: 'Teferi, Time Raveler',
    searchType: 'similarity',
    title: 'Cards Similar to Teferi, Time Raveler',
    description:
      'Find MTG cards similar to Teferi, Time Raveler. Discover timing restriction effects, bounce planeswalkers, and Azorius control pieces.',
  },
  {
    slug: 'thassas-oracle',
    query: "Thassa's Oracle",
    searchType: 'similarity',
    title: "Cards Similar to Thassa's Oracle",
    description:
      "Find MTG cards similar to Thassa's Oracle. Discover alternative win conditions, devotion payoffs, and combo finishers.",
  },
  {
    slug: 'tooth-and-nail',
    query: 'Tooth and Nail',
    searchType: 'similarity',
    title: 'Cards Similar to Tooth and Nail',
    description:
      'Find MTG cards similar to Tooth and Nail. Discover creature tutors that cheat into play, green finishers, and entwine spells.',
  },
  {
    slug: 'urza-lord-high-artificer',
    query: 'Urza, Lord High Artificer',
    searchType: 'similarity',
    title: 'Cards Similar to Urza, Lord High Artificer',
    description:
      'Find MTG cards similar to Urza. Discover artifact commanders, blue artifact synergies, and mana-generating artifact creatures.',
  },
  {
    slug: 'vampiric-tutor',
    query: 'Vampiric Tutor',
    searchType: 'similarity',
    title: 'Cards Similar to Vampiric Tutor',
    description:
      'Find MTG cards similar to Vampiric Tutor. Discover instant-speed tutors, top-of-library search, and efficient black card search.',
  },
  {
    slug: 'vorinclex-voice-of-hunger',
    query: 'Vorinclex, Voice of Hunger',
    searchType: 'similarity',
    title: 'Cards Similar to Vorinclex, Voice of Hunger',
    description:
      'Find MTG cards similar to Vorinclex. Discover mana doubling creatures, green Praetors, and mana denial effects.',
  },
  {
    slug: 'winter-orb',
    query: 'Winter Orb',
    searchType: 'similarity',
    title: 'Cards Similar to Winter Orb',
    description:
      'Find MTG cards similar to Winter Orb. Discover mana denial artifacts, stax pieces, and land untap restriction effects.',
  },
  // ── Popular Commander Staples ──
  {
    slug: 'edgar-markov',
    query: 'Edgar Markov',
    searchType: 'similarity',
    title: 'Cards Similar to Edgar Markov',
    description:
      'Find MTG cards similar to Edgar Markov. Discover vampire tribal commanders, eminence creatures, and Mardu token generators.',
  },
  {
    slug: 'the-ur-dragon',
    query: 'The Ur-Dragon',
    searchType: 'similarity',
    title: 'Cards Similar to The Ur-Dragon',
    description:
      'Find MTG cards similar to The Ur-Dragon. Discover five-color dragon commanders, dragon cost reducers, and tribal payoffs.',
  },
  {
    slug: 'atraxa-praetors-voice',
    query: "Atraxa, Praetors' Voice",
    searchType: 'similarity',
    title: "Cards Similar to Atraxa, Praetors' Voice",
    description:
      'Find MTG cards similar to Atraxa. Discover proliferate commanders, counter synergies, and four-color value creatures.',
  },
  {
    slug: 'muldrotha-the-gravetide',
    query: 'Muldrotha, the Gravetide',
    searchType: 'similarity',
    title: 'Cards Similar to Muldrotha, the Gravetide',
    description:
      'Find MTG cards similar to Muldrotha. Discover graveyard recursion commanders, Sultai value engines, and permanent replay effects.',
  },
  {
    slug: 'tymna-the-weaver',
    query: 'Tymna the Weaver',
    searchType: 'similarity',
    title: 'Cards Similar to Tymna the Weaver',
    description:
      'Find MTG cards similar to Tymna. Discover partner commanders, combat-based draw, and Orzhov value creatures.',
  },
  {
    slug: 'thrasios-triton-hero',
    query: 'Thrasios, Triton Hero',
    searchType: 'similarity',
    title: 'Cards Similar to Thrasios, Triton Hero',
    description:
      'Find MTG cards similar to Thrasios. Discover partner commanders, infinite mana sinks, and Simic card advantage creatures.',
  },
  {
    slug: 'sensei-divining-top',
    query: "Sensei's Divining Top",
    searchType: 'similarity',
    title: "Cards Similar to Sensei's Divining Top",
    description:
      "Find MTG cards similar to Sensei's Divining Top. Discover top-of-library manipulation, card selection artifacts, and draw smoothing.",
  },
  {
    slug: 'esper-sentinel',
    query: 'Esper Sentinel',
    searchType: 'similarity',
    title: 'Cards Similar to Esper Sentinel',
    description:
      'Find MTG cards similar to Esper Sentinel. Discover tax-based draw, white card advantage creatures, and one-drop value.',
  },
];

// ─── Keyword Searches ────────────────────────────────────────────
export const keywordQueries: SeoQuery[] = [
  {
    slug: 'flying',
    query: 'flying',
    searchType: 'keyword',
    title: 'MTG Cards with Flying',
    description:
      'Find all Magic: The Gathering cards with flying. Browse creatures and spells with the flying keyword.',
  },
  {
    slug: 'deathtouch',
    query: 'deathtouch',
    searchType: 'keyword',
    title: 'MTG Cards with Deathtouch',
    description:
      'Find all MTG cards with deathtouch. Browse deadly creatures that destroy anything they damage.',
  },
  {
    slug: 'trample',
    query: 'trample',
    searchType: 'keyword',
    title: 'MTG Cards with Trample',
    description:
      'Find all MTG cards with trample. Browse creatures that deal excess combat damage to the defending player.',
  },
  {
    slug: 'lifelink',
    query: 'lifelink',
    searchType: 'keyword',
    title: 'MTG Cards with Lifelink',
    description:
      'Find all MTG cards with lifelink. Browse creatures and spells that gain life when dealing damage.',
  },
  {
    slug: 'token-generation',
    query: 'create token',
    searchType: 'keyword',
    title: 'MTG Token Generators',
    description:
      'Find all MTG cards that create tokens. Browse creatures, enchantments, and spells that generate creature tokens.',
  },
  {
    slug: 'card-draw',
    query: 'draw a card',
    searchType: 'keyword',
    title: 'MTG Cards That Draw Cards',
    description:
      'Find all MTG cards with card draw effects. Browse spells and permanents that let you draw additional cards.',
  },
  {
    slug: 'destroy-creature',
    query: 'destroy target creature',
    searchType: 'keyword',
    title: 'MTG Creature Removal Spells',
    description:
      'Find all MTG cards that destroy creatures. Browse removal spells and effects across all colors.',
  },
  {
    slug: 'exile',
    query: 'exile target',
    searchType: 'keyword',
    title: 'MTG Exile Effects',
    description:
      'Find all MTG cards with exile effects. Browse spells that remove permanents, cards, or creatures from the game.',
  },
  {
    slug: 'counter-spell',
    query: 'counter target spell',
    searchType: 'keyword',
    title: 'MTG Counterspells',
    description:
      'Find all MTG counterspells. Browse instants and abilities that counter target spells.',
  },
  {
    slug: 'indestructible',
    query: 'indestructible',
    searchType: 'keyword',
    title: 'MTG Cards with Indestructible',
    description:
      'Find all MTG cards with indestructible. Browse permanents that cannot be destroyed by damage or destroy effects.',
  },
  {
    slug: 'hexproof',
    query: 'hexproof',
    searchType: 'keyword',
    title: 'MTG Cards with Hexproof',
    description:
      'Find all MTG cards with hexproof. Browse creatures and permanents that cannot be targeted by opponents.',
  },
  {
    slug: 'flash',
    query: 'flash',
    searchType: 'keyword',
    title: 'MTG Cards with Flash',
    description:
      'Find all MTG cards with flash. Browse creatures and permanents you can cast at instant speed.',
  },
  {
    slug: 'sacrifice',
    query: 'sacrifice a creature',
    searchType: 'keyword',
    title: 'MTG Sacrifice Effects',
    description:
      'Find all MTG cards with sacrifice effects. Browse aristocrat payoffs, sacrifice outlets, and death triggers.',
  },
  {
    slug: 'mill',
    query: 'mill',
    searchType: 'keyword',
    title: 'MTG Mill Cards',
    description:
      'Find all MTG cards with mill effects. Browse spells and permanents that put cards from libraries into graveyards.',
  },
  {
    slug: 'landfall',
    query: 'landfall',
    searchType: 'keyword',
    title: 'MTG Landfall Cards',
    description:
      'Find all MTG cards with landfall triggers. Browse permanents that reward you for playing lands.',
  },
  {
    slug: 'equipment',
    query: 'equip',
    searchType: 'keyword',
    title: 'MTG Equipment Cards',
    description:
      'Find all MTG equipment cards. Browse artifacts that attach to and boost your creatures.',
  },
  {
    slug: 'vigilance',
    query: 'vigilance',
    searchType: 'keyword',
    title: 'MTG Cards with Vigilance',
    description:
      'Find all MTG cards with vigilance. Browse creatures that can attack without tapping.',
  },
  {
    slug: 'first-strike',
    query: 'first strike',
    searchType: 'keyword',
    title: 'MTG Cards with First Strike',
    description:
      'Find all MTG cards with first strike. Browse creatures that deal combat damage before normal damage.',
  },
  {
    slug: 'double-strike',
    query: 'double strike',
    searchType: 'keyword',
    title: 'MTG Cards with Double Strike',
    description:
      'Find all MTG cards with double strike. Browse creatures that deal both first strike and normal combat damage.',
  },
  {
    slug: 'reach',
    query: 'reach',
    searchType: 'keyword',
    title: 'MTG Cards with Reach',
    description:
      'Find all MTG cards with reach. Browse creatures that can block flyers without having flying themselves.',
  },
  {
    slug: 'menace',
    query: 'menace',
    searchType: 'keyword',
    title: 'MTG Cards with Menace',
    description:
      'Find all MTG cards with menace. Browse creatures that must be blocked by two or more creatures.',
  },
  {
    slug: 'ward',
    query: 'ward',
    searchType: 'keyword',
    title: 'MTG Cards with Ward',
    description:
      'Find all MTG cards with ward. Browse permanents that tax opponents for targeting them.',
  },
  {
    slug: 'haste',
    query: 'haste',
    searchType: 'keyword',
    title: 'MTG Cards with Haste',
    description:
      'Find all MTG cards with haste. Browse creatures that can attack and tap the turn they enter the battlefield.',
  },
  {
    slug: 'proliferate',
    query: 'proliferate',
    searchType: 'keyword',
    title: 'MTG Proliferate Cards',
    description:
      'Find all MTG cards with proliferate. Browse spells and permanents that add counters to any number of permanents and players.',
  },
  {
    slug: 'scry',
    query: 'scry',
    searchType: 'keyword',
    title: 'MTG Cards with Scry',
    description:
      'Find all MTG cards with scry. Browse spells that let you look at and order the top cards of your library.',
  },
  {
    slug: 'cascade',
    query: 'cascade',
    searchType: 'keyword',
    title: 'MTG Cascade Cards',
    description:
      'Find all MTG cards with cascade. Browse spells that let you cast free spells from the top of your library.',
  },
  {
    slug: 'treasure-tokens',
    query: 'create a Treasure token',
    searchType: 'keyword',
    title: 'MTG Treasure Token Generators',
    description:
      'Find all MTG cards that create Treasure tokens. Browse ramp and mana-fixing through artifact token generation.',
  },
  {
    slug: 'plus-one-counters',
    query: '+1/+1 counter',
    searchType: 'keyword',
    title: 'MTG +1/+1 Counter Cards',
    description:
      'Find all MTG cards that use +1/+1 counters. Browse creatures and spells that grow and buff with counters.',
  },
  {
    slug: 'return-from-graveyard',
    query: 'return target creature card from your graveyard',
    searchType: 'keyword',
    title: 'MTG Graveyard Recursion Cards',
    description:
      'Find all MTG cards that return creatures from the graveyard. Browse reanimation, recursion, and revival spells.',
  },
  {
    slug: 'protection-from',
    query: 'protection from',
    searchType: 'keyword',
    title: 'MTG Protection Cards',
    description:
      'Find all MTG cards with protection. Browse creatures and spells with protection from colors, types, or effects.',
  },
  {
    slug: 'destroy-artifact',
    query: 'destroy target artifact',
    searchType: 'keyword',
    title: 'MTG Artifact Removal',
    description:
      'Find all MTG cards that destroy artifacts. Browse removal spells and effects that deal with opposing artifacts.',
  },
  {
    slug: 'destroy-enchantment',
    query: 'destroy target enchantment',
    searchType: 'keyword',
    title: 'MTG Enchantment Removal',
    description:
      'Find all MTG cards that destroy enchantments. Browse removal for problematic enchantments across all colors.',
  },
  {
    slug: 'convoke',
    query: 'convoke',
    searchType: 'keyword',
    title: 'MTG Convoke Cards',
    description:
      'Find all MTG cards with convoke. Browse spells that let your creatures help pay casting costs.',
  },
  {
    slug: 'delve',
    query: 'delve',
    searchType: 'keyword',
    title: 'MTG Delve Cards',
    description:
      'Find all MTG cards with delve. Browse spells that exile cards from your graveyard to reduce their cost.',
  },
  {
    slug: 'populate',
    query: 'populate',
    searchType: 'keyword',
    title: 'MTG Populate Cards',
    description:
      'Find all MTG cards with populate. Browse spells that create copies of your creature tokens.',
  },
  {
    slug: 'kicker',
    query: 'kicker',
    searchType: 'keyword',
    title: 'MTG Kicker Cards',
    description:
      'Find all MTG cards with kicker. Browse spells with optional additional costs for enhanced effects.',
  },
  {
    slug: 'madness',
    query: 'madness',
    searchType: 'keyword',
    title: 'MTG Madness Cards',
    description:
      'Find all MTG cards with madness. Browse spells you can cast for an alternate cost when discarded.',
  },
  {
    slug: 'food-tokens',
    query: 'create a Food token',
    searchType: 'keyword',
    title: 'MTG Food Token Cards',
    description:
      'Find all MTG cards that create Food tokens. Browse life-gaining artifact token generators.',
  },
  {
    slug: 'clue-tokens',
    query: 'create a Clue token',
    searchType: 'keyword',
    title: 'MTG Clue Token Cards',
    description:
      'Find all MTG cards that create Clue tokens. Browse investigate effects and card draw through artifact tokens.',
  },
  {
    slug: 'deal-damage-each-opponent',
    query: 'deals damage to each opponent',
    searchType: 'keyword',
    title: 'MTG Group Damage Cards',
    description:
      'Find all MTG cards that deal damage to each opponent. Browse multiplayer burn and group slug effects.',
  },
  {
    slug: 'unblockable',
    query: "can't be blocked",
    searchType: 'keyword',
    title: 'MTG Unblockable Cards',
    description:
      "Find all MTG cards that can't be blocked. Browse evasive creatures and spells that grant unblockability.",
  },
  {
    slug: 'annihilator',
    query: 'annihilator',
    searchType: 'keyword',
    title: 'MTG Annihilator Cards',
    description:
      'Find all MTG cards with annihilator. Browse massive Eldrazi creatures that force opponents to sacrifice permanents.',
  },
  {
    slug: 'storm',
    query: 'storm',
    searchType: 'keyword',
    title: 'MTG Storm Cards',
    description:
      'Find all MTG cards with storm. Browse spells that copy themselves for each spell cast before them this turn.',
  },
  {
    slug: 'infect',
    query: 'infect',
    searchType: 'keyword',
    title: 'MTG Infect Cards',
    description:
      'Find all MTG cards with infect. Browse creatures that deal damage as poison counters and -1/-1 counters.',
  },
  {
    slug: 'transform',
    query: 'transform',
    searchType: 'keyword',
    title: 'MTG Transform Cards',
    description:
      'Find all MTG cards with transform. Browse double-faced cards that flip between two sides.',
  },
  {
    slug: 'cycling',
    query: 'cycling',
    searchType: 'keyword',
    title: 'MTG Cycling Cards',
    description:
      'Find all MTG cards with cycling. Browse spells you can discard to draw a card when not needed.',
  },
  {
    slug: 'myriad',
    query: 'myriad',
    searchType: 'keyword',
    title: 'MTG Myriad Cards',
    description:
      'Find all MTG cards with myriad. Browse creatures that create token copies attacking each other opponent.',
  },
];

// ─── Commander Searches ──────────────────────────────────────────
export const commanderQueries: SeoQuery[] = [
  {
    slug: 'graveyard-recursion',
    query: 'graveyard recursion commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Graveyard Recursion Commanders',
    description:
      'Find the best graveyard recursion commanders in MTG. Discover legendary creatures that reanimate, recur, and exploit the graveyard for your EDH deck.',
  },
  {
    slug: 'token-generation',
    query: 'token generation commander that creates lots of creature tokens',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Token Generation Commanders',
    description:
      'Find the best token-generating commanders in MTG. Discover legendary creatures that create armies of creature tokens for your EDH deck.',
  },
  {
    slug: 'artifact-combo',
    query: 'artifact combo commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Artifact Combo Commanders',
    description:
      'Find the best artifact combo commanders in MTG. Discover legendary creatures that synergize with artifacts and enable powerful combos.',
  },
  {
    slug: 'lifegain',
    query: 'lifegain commander that rewards gaining life',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Lifegain Commanders',
    description:
      'Find the best lifegain commanders in MTG. Discover legendary creatures that reward you for gaining life in your EDH deck.',
  },
  {
    slug: 'tribal',
    query: 'tribal commander that cares about creature types',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Tribal Commanders',
    description:
      'Find the best tribal commanders in MTG. Discover legendary creatures that synergize with specific creature types for your EDH deck.',
  },
  {
    slug: 'voltron',
    query: 'voltron commander that benefits from equipment and auras',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Voltron Commanders',
    description:
      'Find the best voltron commanders in MTG. Discover legendary creatures built for equipment, auras, and commander damage strategies.',
  },
  {
    slug: 'spellslinger',
    query: 'spellslinger commander that rewards casting instants and sorceries',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Spellslinger Commanders',
    description:
      'Find the best spellslinger commanders in MTG. Discover legendary creatures that reward casting instants and sorceries.',
  },
  {
    slug: 'group-hug',
    query: 'group hug commander that gives benefits to all players',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Group Hug Commanders',
    description:
      'Find the best group hug commanders in MTG. Discover friendly legendary creatures that share resources with all players.',
  },
  {
    slug: 'stax',
    query: 'stax commander that slows down opponents and restricts resources',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Stax Commanders',
    description:
      'Find the best stax commanders in MTG. Discover legendary creatures that lock down the board and restrict opponents.',
  },
  {
    slug: 'ramp',
    query: 'ramp commander that accelerates mana production in green',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Ramp Commanders',
    description:
      'Find the best ramp commanders in MTG. Discover legendary creatures that accelerate your mana and power out big spells.',
  },
  {
    slug: 'mill',
    query: 'mill commander that mills opponents libraries',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Mill Commanders',
    description:
      'Find the best mill commanders in MTG. Discover legendary creatures that grind through opponent libraries.',
  },
  {
    slug: 'sacrifice',
    query: 'sacrifice aristocrats commander that benefits from creatures dying',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Sacrifice / Aristocrats Commanders',
    description:
      'Find the best sacrifice and aristocrats commanders in MTG. Discover legendary creatures that profit from death triggers and sacrifice outlets.',
  },
  {
    slug: 'landfall',
    query: 'landfall commander that rewards playing lands',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Landfall Commanders',
    description:
      'Find the best landfall commanders in MTG. Discover legendary creatures that trigger powerful effects when lands enter the battlefield.',
  },
  {
    slug: 'enchantress',
    query: 'enchantress commander that benefits from casting enchantments',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Enchantress Commanders',
    description:
      'Find the best enchantress commanders in MTG. Discover legendary creatures that reward playing enchantments in your EDH deck.',
  },
  {
    slug: 'superfriends',
    query: 'superfriends commander that supports planeswalkers',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Superfriends / Planeswalker Commanders',
    description:
      'Find the best superfriends commanders in MTG. Discover legendary creatures that synergize with planeswalkers.',
  },
  {
    slug: 'reanimator',
    query: 'reanimator commander that brings creatures back from the graveyard',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Reanimator Commanders',
    description:
      'Find the best reanimator commanders in MTG. Discover legendary creatures built for graveyard-to-battlefield strategies.',
  },
  {
    slug: 'treasure',
    query: 'treasure token commander that creates and benefits from treasure',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Treasure Commanders',
    description:
      'Find the best treasure commanders in MTG. Discover legendary creatures that generate and leverage Treasure tokens.',
  },
  {
    slug: 'blink-flicker',
    query: 'blink flicker commander that exiles and returns creatures',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Blink / Flicker Commanders',
    description:
      'Find the best blink and flicker commanders in MTG. Discover legendary creatures that exile and return permanents for repeated ETB triggers.',
  },
  {
    slug: 'dragons',
    query: 'dragon tribal commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Dragon Tribal Commanders',
    description:
      'Find the best dragon tribal commanders in MTG. Discover legendary dragons and dragon lords for your EDH deck.',
  },
  {
    slug: 'elves',
    query: 'elf tribal commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Elf Tribal Commanders',
    description:
      'Find the best elf tribal commanders in MTG. Discover legendary elves and elf synergy commanders for your EDH deck.',
  },
  {
    slug: 'zombies',
    query: 'zombie tribal commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Zombie Tribal Commanders',
    description:
      'Find the best zombie tribal commanders in MTG. Discover legendary zombies and undead lords for your EDH deck.',
  },
  {
    slug: 'vampires',
    query: 'vampire tribal commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Vampire Tribal Commanders',
    description:
      'Find the best vampire tribal commanders in MTG. Discover legendary vampires and blood-themed commanders for your EDH deck.',
  },
  {
    slug: 'angels',
    query: 'angel tribal commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Angel Tribal Commanders',
    description:
      'Find the best angel tribal commanders in MTG. Discover legendary angels and celestial commanders for your EDH deck.',
  },
  {
    slug: 'wizards',
    query: 'wizard tribal commander that cares about wizards',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Wizard Tribal Commanders',
    description:
      'Find the best wizard tribal commanders in MTG. Discover legendary wizards and spellcasting synergy commanders.',
  },
  {
    slug: 'counters',
    query: '+1/+1 counter commander that grows creatures with counters',
    searchType: 'ai',
    filters: { isCommander: true },
    title: '+1/+1 Counter Commanders',
    description:
      'Find the best +1/+1 counter commanders in MTG. Discover legendary creatures that distribute and multiply counters.',
  },
  {
    slug: 'wheels',
    query: 'wheel commander that makes all players discard and draw',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Wheel Commanders',
    description:
      'Find the best wheel commanders in MTG. Discover legendary creatures that reward mass discard and draw effects.',
  },
  {
    slug: 'infect',
    query: 'infect poison counter commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Infect / Poison Commanders',
    description:
      'Find the best infect and poison commanders in MTG. Discover legendary creatures that deal damage as poison counters.',
  },
  {
    slug: 'chaos',
    query: 'chaos commander that creates random and unpredictable effects',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Chaos Commanders',
    description:
      'Find the best chaos commanders in MTG. Discover legendary creatures that make games wild and unpredictable.',
  },
  {
    slug: 'clone-copy',
    query: 'clone copy commander that copies creatures and spells',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Clone / Copy Commanders',
    description:
      'Find the best clone and copy commanders in MTG. Discover legendary creatures that duplicate permanents and spells.',
  },
  {
    slug: 'equipment-aura',
    query: 'equipment and aura commander for voltron strategy',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Equipment & Aura Commanders',
    description:
      'Find the best equipment and aura commanders in MTG. Discover legendary creatures suited for gear and buff strategies.',
  },
  {
    slug: 'politics',
    query: 'political commander that makes deals and manipulates opponents',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Political Commanders',
    description:
      'Find the best political commanders in MTG. Discover legendary creatures that thrive on multiplayer diplomacy and deals.',
  },
  {
    slug: 'storm',
    query: 'storm commander that rewards casting many spells in a turn',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Storm Commanders',
    description:
      'Find the best storm commanders in MTG. Discover legendary creatures that reward chaining spells and going off in one turn.',
  },
  {
    slug: 'control',
    query: 'control commander with counterspells and removal',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Control Commanders',
    description:
      'Find the best control commanders in MTG. Discover legendary creatures that dominate through answers, counters, and removal.',
  },
  {
    slug: 'energy',
    query: 'energy counter commander',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Energy Commanders',
    description:
      'Find the best energy commanders in MTG. Discover legendary creatures that generate and spend energy counters.',
  },
  {
    slug: 'cascade',
    query: 'cascade commander that casts free spells',
    searchType: 'ai',
    filters: { isCommander: true },
    title: 'Cascade Commanders',
    description:
      'Find the best cascade commanders in MTG. Discover legendary creatures that trigger free spells from your library.',
  },
];

// ─── Arena Searches ──────────────────────────────────────────────
export const arenaQueries: SeoQuery[] = [
  {
    slug: 'black-removal',
    query: 'black removal spells that destroy or exile creatures',
    searchType: 'ai',
    filters: {
      isArena: true,
      selectedColors: ['Black'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTG Arena Black Removal Spells',
    description:
      'Find the best black removal spells on MTG Arena. Discover destroy effects, exile spells, and efficient creature removal in black.',
  },
  {
    slug: 'blue-card-draw',
    query: 'blue card draw spells that draw multiple cards',
    searchType: 'ai',
    filters: {
      isArena: true,
      selectedColors: ['Blue'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTG Arena Blue Card Draw',
    description:
      'Find the best blue card draw spells on MTG Arena. Discover cantrips, draw engines, and card advantage for your blue deck.',
  },
  {
    slug: 'token-generators',
    query: 'cards that create creature tokens',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Token Generators',
    description:
      'Find the best token-generating cards on MTG Arena. Discover creatures, enchantments, and spells that create creature tokens.',
  },
  {
    slug: 'white-removal',
    query: 'white removal spells that exile or destroy',
    searchType: 'ai',
    filters: {
      isArena: true,
      selectedColors: ['White'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTG Arena White Removal Spells',
    description:
      'Find the best white removal on MTG Arena. Discover exile effects, enchantment-based removal, and efficient white answers.',
  },
  {
    slug: 'red-aggro',
    query: 'aggressive red creatures with haste or that deal damage',
    searchType: 'ai',
    filters: {
      isArena: true,
      selectedColors: ['Red'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTG Arena Red Aggro Cards',
    description:
      'Find the best red aggro cards on MTG Arena. Discover hasty creatures, burn spells, and aggressive red staples.',
  },
  {
    slug: 'green-ramp',
    query: 'green ramp spells and mana acceleration',
    searchType: 'ai',
    filters: {
      isArena: true,
      selectedColors: ['Green'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTG Arena Green Ramp Cards',
    description:
      'Find the best green ramp cards on MTG Arena. Discover mana dorks, land search spells, and mana acceleration.',
  },
  {
    slug: 'board-wipes',
    query: 'board wipes that destroy all creatures',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Board Wipes',
    description:
      'Find the best board wipes on MTG Arena. Discover mass removal, destroy all creatures effects, and sweepers across all colors.',
  },
  {
    slug: 'counterspells',
    query: 'counterspells and counter magic instants',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Counterspells',
    description:
      'Find the best counterspells on MTG Arena. Discover instant-speed answers and permission spells for your control deck.',
  },
  {
    slug: 'planeswalkers',
    query: 'powerful planeswalkers',
    searchType: 'ai',
    filters: { isArena: true, selectedCardTypes: ['Planeswalker'] },
    title: 'MTG Arena Planeswalkers',
    description:
      'Find the best planeswalkers on MTG Arena. Discover powerful planeswalkers for Standard, Explorer, Historic, and Brawl.',
  },
  {
    slug: 'dual-lands',
    query: 'lands that produce two or more colors of mana',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Dual Lands & Mana Fixing',
    description:
      'Find the best dual lands and mana fixing on MTG Arena. Discover multicolor lands for your Arena deck.',
  },
  {
    slug: 'lifegain',
    query: 'cards that gain life and payoffs for gaining life',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Lifegain Cards',
    description:
      'Find the best lifegain cards on MTG Arena. Discover life gain synergies, payoffs, and enablers for your Arena deck.',
  },
  {
    slug: 'graveyard-synergy',
    query:
      'cards that interact with the graveyard or benefit from cards in graveyard',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Graveyard Synergy Cards',
    description:
      'Find the best graveyard synergy cards on MTG Arena. Discover recursion, reanimation, and graveyard payoffs.',
  },
  {
    slug: 'enchantments',
    query: 'powerful enchantments and enchantment synergies',
    searchType: 'ai',
    filters: { isArena: true, selectedCardTypes: ['Enchantment'] },
    title: 'MTG Arena Best Enchantments',
    description:
      'Find the best enchantments on MTG Arena. Discover auras, sagas, and powerful enchantment effects.',
  },
  {
    slug: 'artifacts',
    query: 'best artifact cards and artifact synergies',
    searchType: 'ai',
    filters: { isArena: true, selectedCardTypes: ['Artifact'] },
    title: 'MTG Arena Best Artifacts',
    description:
      'Find the best artifacts on MTG Arena. Discover equipment, mana rocks, and artifact synergy cards.',
  },
  {
    slug: 'multicolor-bombs',
    query: 'powerful multicolor gold cards',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Multicolor Bombs',
    description:
      'Find the best multicolor cards on MTG Arena. Discover powerful gold cards and multicolor payoffs.',
  },
  {
    slug: 'flash-creatures',
    query: 'creatures with flash that you can cast at instant speed',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Flash Creatures',
    description:
      'Find the best flash creatures on MTG Arena. Discover instant-speed threats and ambush creatures.',
  },
  {
    slug: 'mana-fixing',
    query: 'mana fixing cards and color fixing',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Mana Fixing',
    description:
      'Find the best mana fixing on MTG Arena. Discover color-fixing lands, artifacts, and spells for multicolor decks.',
  },
  {
    slug: 'combat-tricks',
    query: 'combat tricks and instant speed pump spells',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Combat Tricks',
    description:
      'Find the best combat tricks on MTG Arena. Discover instant-speed pump spells and surprise combat effects.',
  },
  {
    slug: 'enchantment-removal',
    query: 'cards that destroy or exile enchantments',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Enchantment Removal',
    description:
      'Find enchantment removal on MTG Arena. Discover answers to problematic enchantments across all colors.',
  },
  {
    slug: 'flyers',
    query: 'best flying creatures and cards with flying',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Best Flyers',
    description:
      'Find the best flying creatures on MTG Arena. Discover evasive threats and aerial attackers.',
  },
  {
    slug: 'deathtouch-creatures',
    query: 'creatures with deathtouch',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Deathtouch Creatures',
    description:
      'Find the best deathtouch creatures on MTG Arena. Discover deadly blockers and efficient killers.',
  },
  {
    slug: 'treasure-ramp',
    query: 'cards that create treasure tokens for mana ramp',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Treasure Ramp',
    description:
      'Find the best treasure token cards on MTG Arena. Discover ramp through artifact token generation.',
  },
  {
    slug: 'card-advantage',
    query: 'cards that generate card advantage and draw extra cards',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Card Advantage Engines',
    description:
      'Find the best card advantage engines on MTG Arena. Discover draw effects, impulse draw, and value generators.',
  },
  {
    slug: 'reanimation',
    query: 'cards that bring creatures back from the graveyard',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Reanimation Spells',
    description:
      'Find reanimation cards on MTG Arena. Discover ways to bring creatures back from the dead.',
  },
  {
    slug: 'sacrifice-synergy',
    query: 'sacrifice synergy cards and aristocrats payoffs',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Sacrifice Synergy',
    description:
      'Find sacrifice synergy cards on MTG Arena. Discover aristocrats payoffs, sacrifice outlets, and death triggers.',
  },
  {
    slug: 'landfall-cards',
    query: 'landfall triggers and land enter effects',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Landfall Cards',
    description:
      'Find the best landfall cards on MTG Arena. Discover powerful triggers from playing lands.',
  },
  {
    slug: 'mill-cards',
    query: 'mill cards that put cards from library into graveyard',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Mill Cards',
    description:
      'Find the best mill cards on MTG Arena. Discover library-emptying spells and mill synergies.',
  },
  {
    slug: 'hexproof-creatures',
    query: 'creatures with hexproof that cannot be targeted',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Hexproof Creatures',
    description:
      'Find hexproof creatures on MTG Arena. Discover untargetable threats for voltron and aggro strategies.',
  },
  {
    slug: 'haste-creatures',
    query: 'aggressive creatures with haste',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Haste Creatures',
    description:
      'Find the best haste creatures on MTG Arena. Discover fast threats that attack immediately.',
  },
  {
    slug: 'protection-spells',
    query: 'protection spells that give hexproof or indestructible',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Protection Spells',
    description:
      'Find protection spells on MTG Arena. Discover ways to shield your creatures from removal.',
  },
  {
    slug: 'energy-cards',
    query: 'energy counter cards and energy payoffs',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Energy Cards',
    description:
      'Find the best energy cards on MTG Arena. Discover energy generators and powerful energy payoffs.',
  },
  {
    slug: 'sagas',
    query: 'powerful saga enchantments',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Best Sagas',
    description:
      'Find the best saga enchantments on MTG Arena. Discover multi-chapter enchantments with powerful incremental effects.',
  },
  {
    slug: 'tribal-lords',
    query: 'tribal lords and creature type payoffs',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Tribal Lords',
    description:
      'Find the best tribal lords on MTG Arena. Discover creature type synergies and tribal anthem effects.',
  },
  {
    slug: 'cheap-creatures',
    query: 'efficient low mana cost creatures one and two drops',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Best Cheap Creatures',
    description:
      'Find the most efficient cheap creatures on MTG Arena. Discover powerful one and two-mana threats.',
  },
  {
    slug: 'finishers',
    query: 'game ending finisher creatures and spells',
    searchType: 'ai',
    filters: { isArena: true },
    title: 'MTG Arena Best Finishers',
    description:
      'Find the best finisher cards on MTG Arena. Discover game-ending threats and win conditions.',
  },
];

// ─── MTGO Searches ───────────────────────────────────────────────
export const mtgoQueries: SeoQuery[] = [
  {
    slug: 'best-legacy-cards',
    query: 'best legacy staples and format all-stars',
    searchType: 'ai',
    filters: {
      isMTGO: true,
      selectedCardFormats: [{ format: 'Legacy', status: 'Legal' }],
    },
    title: 'Best MTGO Legacy Staples',
    description:
      'Find the best Legacy staples on MTGO. Discover format-defining cards, combo pieces, and tournament all-stars.',
  },
  {
    slug: 'best-vintage-cards',
    query: 'best vintage restricted and power cards',
    searchType: 'ai',
    filters: {
      isMTGO: true,
      selectedCardFormats: [{ format: 'Vintage', status: 'Legal' }],
    },
    title: 'Best MTGO Vintage Cards',
    description:
      'Find the best Vintage cards on MTGO. Discover restricted cards, power pieces, and format staples.',
  },
  {
    slug: 'best-pauper-cards',
    query: 'best pauper staples and common cards',
    searchType: 'ai',
    filters: {
      isMTGO: true,
      selectedCardFormats: [{ format: 'Pauper', status: 'Legal' }],
    },
    title: 'Best MTGO Pauper Staples',
    description:
      'Find the best Pauper staples on MTGO. Discover powerful commons for the most accessible competitive format.',
  },
  {
    slug: 'black-removal',
    query: 'black removal spells that destroy or exile creatures',
    searchType: 'ai',
    filters: {
      isMTGO: true,
      selectedColors: ['Black'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTGO Black Removal Spells',
    description:
      'Find the best black removal spells on MTGO. Discover destroy effects, exile spells, and efficient creature removal.',
  },
  {
    slug: 'blue-card-draw',
    query: 'blue card draw spells that draw multiple cards',
    searchType: 'ai',
    filters: {
      isMTGO: true,
      selectedColors: ['Blue'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTGO Blue Card Draw',
    description:
      'Find the best blue card draw spells on MTGO. Discover cantrips, draw engines, and card advantage for Legacy, Vintage, and more.',
  },
  {
    slug: 'combo-pieces',
    query: 'combo pieces and infinite combo enablers',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Combo Pieces',
    description:
      'Find the best combo pieces on MTGO. Discover infinite combos, two-card combos, and combo enablers for competitive play.',
  },
  {
    slug: 'board-wipes',
    query: 'board wipes and mass removal spells',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Board Wipes',
    description:
      'Find the best board wipes on MTGO. Discover mass removal, sweepers, and destroy all effects across all formats.',
  },
  {
    slug: 'counterspells',
    query: 'counterspells and counter magic instants',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Counterspells',
    description:
      'Find the best counterspells on MTGO. Discover free counters, hard counters, and permission spells for competitive play.',
  },
  {
    slug: 'mana-acceleration',
    query: 'fast mana and mana acceleration artifacts and spells',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Fast Mana & Acceleration',
    description:
      'Find the best mana acceleration on MTGO. Discover fast mana, rituals, mana rocks, and ramp spells.',
  },
  {
    slug: 'graveyard-strategies',
    query: 'graveyard strategies reanimation and recursion',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Graveyard Strategies',
    description:
      'Find the best graveyard strategy cards on MTGO. Discover reanimation, dredge, recursion, and graveyard payoffs.',
  },
  {
    slug: 'land-destruction',
    query: 'land destruction and mana denial cards',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Land Destruction Cards',
    description:
      'Find land destruction cards on MTGO. Discover mana denial, land hate, and resource denial strategies.',
  },
  {
    slug: 'dual-lands',
    query: 'dual lands and best mana fixing lands',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Dual Lands & Mana Fixing',
    description:
      'Find the best dual lands and mana fixing on MTGO. Discover original duals, fetch lands, shock lands, and more.',
  },
  {
    slug: 'planeswalkers',
    query: 'best planeswalkers for competitive play',
    searchType: 'ai',
    filters: { isMTGO: true, selectedCardTypes: ['Planeswalker'] },
    title: 'MTGO Best Planeswalkers',
    description:
      'Find the best planeswalkers on MTGO. Discover format-defining planeswalkers for Legacy, Vintage, and Pauper.',
  },
  {
    slug: 'storm-cards',
    query: 'storm cards and cards that reward casting many spells',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Storm Cards',
    description:
      'Find the best storm cards on MTGO. Discover storm spells, rituals, and spell-chaining enablers.',
  },
  {
    slug: 'delver-cards',
    query: 'tempo creatures and cheap threats like delver of secrets',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Tempo Threats',
    description:
      'Find the best tempo threats on MTGO. Discover cheap aggressive creatures for Delver-style strategies.',
  },
  {
    slug: 'cantrips',
    query: 'cantrips that draw cards and filter',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Best Cantrips',
    description:
      'Find the best cantrips on MTGO. Discover efficient card draw, selection, and library manipulation for competitive decks.',
  },
  {
    slug: 'removal-spells',
    query: 'best removal spells across all colors',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Best Removal Spells',
    description:
      'Find the best removal spells on MTGO. Discover efficient creature answers, exile effects, and versatile removal.',
  },
  {
    slug: 'discard-spells',
    query: 'hand disruption and discard spells',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Hand Disruption',
    description:
      'Find the best discard spells on MTGO. Discover hand disruption, targeted discard, and information warfare.',
  },
  {
    slug: 'artifact-hate',
    query: 'artifact destruction and artifact hate cards',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Artifact Hate',
    description:
      'Find the best artifact hate on MTGO. Discover artifact destruction, null rod effects, and anti-artifact sideboard cards.',
  },
  {
    slug: 'enchantment-hate',
    query: 'enchantment removal and enchantment hate cards',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Enchantment Hate',
    description:
      'Find enchantment removal on MTGO. Discover answers to problematic enchantments for competitive sideboards.',
  },
  {
    slug: 'prison-effects',
    query: 'prison and lock pieces that prevent opponents from playing',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Prison Effects',
    description:
      'Find prison and lock effects on MTGO. Discover stax pieces, Chalice effects, and game-locking cards.',
  },
  {
    slug: 'dredge-cards',
    query: 'dredge cards and self-mill enablers',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Dredge Cards',
    description:
      'Find dredge cards on MTGO. Discover self-mill, dredge mechanics, and graveyard-filling strategies.',
  },
  {
    slug: 'equipment',
    query: 'best equipment cards for competitive play',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Best Equipment',
    description:
      'Find the best equipment on MTGO. Discover powerful artifacts that boost creatures for competitive formats.',
  },
  {
    slug: 'tutor-effects',
    query: 'tutor effects and library search cards',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Best Tutors',
    description:
      'Find the best tutors on MTGO. Discover library search effects across all colors for competitive play.',
  },
  {
    slug: 'free-spells',
    query: 'free spells that cost zero mana or have alternate costs',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Free Spells',
    description:
      'Find free spells on MTGO. Discover zero-mana cards, pitch spells, and alternate cost effects.',
  },
  {
    slug: 'creature-lands',
    query: 'creature lands and manlands that become creatures',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Creature Lands',
    description:
      'Find the best creature lands on MTGO. Discover manlands that double as threats and mana sources.',
  },
  {
    slug: 'burn-spells',
    query: 'burn spells and direct damage',
    searchType: 'ai',
    filters: {
      isMTGO: true,
      selectedColors: ['Red'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'MTGO Burn Spells',
    description:
      'Find the best burn spells on MTGO. Discover efficient direct damage for aggressive and combo strategies.',
  },
  {
    slug: 'hatebears',
    query: 'hatebear creatures that disrupt opponents strategies',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Hatebears',
    description:
      'Find the best hatebears on MTGO. Discover disruptive creatures that tax and restrict opponents.',
  },
  {
    slug: 'protection-creatures',
    query: 'creatures with protection from colors or types',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Protection Creatures',
    description:
      'Find creatures with protection on MTGO. Discover hard-to-remove threats with color protection.',
  },
  {
    slug: 'reanimation-targets',
    query: 'best reanimation targets and big creatures to cheat into play',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Reanimation Targets',
    description:
      'Find the best reanimation targets on MTGO. Discover powerful creatures to cheat into play from the graveyard.',
  },
  {
    slug: 'card-selection',
    query: 'card selection and library manipulation effects',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Card Selection',
    description:
      'Find the best card selection on MTGO. Discover scry, surveil, and top-of-library manipulation.',
  },
  {
    slug: 'tribal-staples',
    query: 'tribal lords and creature type synergies',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Tribal Staples',
    description:
      'Find the best tribal cards on MTGO. Discover tribal lords, creature type payoffs, and synergy pieces.',
  },
  {
    slug: 'tokens-strategies',
    query: 'token generation cards and token strategies',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Token Strategies',
    description:
      'Find the best token cards on MTGO. Discover token generators, anthem effects, and go-wide strategies.',
  },
  {
    slug: 'infect-cards',
    query: 'infect creatures and poison counter strategies',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Infect Cards',
    description:
      'Find infect cards on MTGO. Discover poison-based strategies, infect creatures, and pump spells.',
  },
  {
    slug: 'cascade-cards',
    query: 'cascade spells and free spell effects',
    searchType: 'ai',
    filters: { isMTGO: true },
    title: 'MTGO Cascade Cards',
    description:
      'Find cascade cards on MTGO. Discover spells that chain into free casts from your library.',
  },
];

// ─── Modern Searches ─────────────────────────────────────────────
export const modernQueries: SeoQuery[] = [
  {
    slug: 'best-creatures',
    query: 'best creatures in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Creatures',
    description:
      'Find the best creatures in Modern. Discover format staples, efficient beaters, and tournament-winning creatures.',
  },
  {
    slug: 'best-removal',
    query: 'best removal spells in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Removal Spells',
    description:
      'Find the best removal spells in Modern. Discover efficient removal, exile effects, and format staples.',
  },
  {
    slug: 'best-counterspells',
    query: 'best counterspells in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Counterspells',
    description:
      'Find the best counterspells in Modern. Discover efficient permission spells and counter magic for control decks.',
  },
  {
    slug: 'burn-spells',
    query: 'best burn spells and direct damage in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedColors: ['Red'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'Best Modern Burn Spells',
    description:
      'Find the best burn spells in Modern. Discover efficient direct damage, face burn, and aggressive red spells.',
  },
  {
    slug: 'sideboard-cards',
    query: 'best sideboard hate cards in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Sideboard Cards',
    description:
      'Find the best sideboard cards in Modern. Discover format-specific hate cards, silver bullets, and tech choices.',
  },
  {
    slug: 'mana-base',
    query: 'best lands and mana fixing for modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Lands & Mana Base',
    description:
      'Find the best lands for Modern. Discover fetch lands, shock lands, utility lands, and mana fixing for your deck.',
  },
  {
    slug: 'combo-pieces',
    query: 'combo pieces and combo enablers in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Combo Pieces',
    description:
      'Find the best combo pieces in Modern. Discover two-card combos, combo enablers, and synergy powerhouses.',
  },
  {
    slug: 'card-draw',
    query: 'best card draw and card advantage spells in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Card Draw',
    description:
      'Find the best card draw in Modern. Discover cantrips, card advantage engines, and draw spells across all colors.',
  },
  {
    slug: 'graveyard-hate',
    query: 'graveyard hate and graveyard removal in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Graveyard Hate',
    description:
      'Find the best graveyard hate in Modern. Discover exile effects, anti-recursion cards, and sideboard tech.',
  },
  {
    slug: 'planeswalkers',
    query: 'best planeswalkers in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedCardTypes: ['Planeswalker'],
    },
    title: 'Best Modern Planeswalkers',
    description:
      'Find the best planeswalkers in Modern. Discover format-legal planeswalkers for control, midrange, and combo decks.',
  },
  {
    slug: 'artifact-strategies',
    query: 'best artifact synergy cards in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Artifact Cards',
    description:
      'Find the best artifact cards in Modern. Discover artifact synergies, affinity pieces, and powerful artifacts.',
  },
  {
    slug: 'tokens-and-go-wide',
    query: 'token generation and go wide strategies in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Token & Go-Wide Cards',
    description:
      'Find the best token and go-wide cards in Modern. Discover token generators, anthem effects, and swarm strategies.',
  },
  {
    slug: 'one-mana-spells',
    query: 'best one mana spells in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern One-Mana Spells',
    description:
      'Find the best one-mana spells in Modern. Discover efficient instant, sorcery, and creature options at one mana.',
  },
  {
    slug: 'enchantments',
    query: 'best enchantments in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Enchantments',
    description:
      'Find the best enchantments in Modern. Discover powerful enchantments for control, aggro, and combo decks.',
  },
  {
    slug: 'discard-spells',
    query: 'hand disruption and discard spells in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedColors: ['Black'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'Best Modern Discard Spells',
    description:
      'Find the best discard spells in Modern. Discover hand disruption and targeted discard for black decks.',
  },
  {
    slug: 'cantrips',
    query: 'best cantrips and card selection in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Cantrips',
    description:
      'Find the best cantrips in Modern. Discover one-mana card draw, selection, and deck filtering.',
  },
  {
    slug: 'tribal-cards',
    query: 'best tribal synergy cards and lords in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Tribal Cards',
    description:
      'Find the best tribal cards in Modern. Discover creature lords, tribal payoffs, and synergy pieces.',
  },
  {
    slug: 'energy-cards',
    query: 'energy counter cards and energy payoffs in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Energy Cards',
    description:
      'Find the best energy cards in Modern. Discover energy generators and powerful energy synergies.',
  },
  {
    slug: 'flash-creatures',
    query: 'creatures with flash in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Flash Creatures',
    description:
      'Find the best flash creatures in Modern. Discover instant-speed threats for tempo and control strategies.',
  },
  {
    slug: 'protection-spells',
    query: 'protection spells and hexproof effects in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Protection Spells',
    description:
      'Find the best protection spells in Modern. Discover ways to shield your creatures and permanents from removal.',
  },
  {
    slug: 'reanimation',
    query: 'reanimation and graveyard to battlefield effects in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Reanimation',
    description:
      'Find the best reanimation spells in Modern. Discover ways to cheat creatures from the graveyard into play.',
  },
  {
    slug: 'mill-cards',
    query: 'mill cards and library depletion in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Mill Cards',
    description:
      'Find the best mill cards in Modern. Discover library depletion, self-mill, and mill win conditions.',
  },
  {
    slug: 'lifegain-cards',
    query: 'lifegain cards and life gain payoffs in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Lifegain Cards',
    description:
      'Find the best lifegain cards in Modern. Discover life gain synergies, soul sisters, and life payoffs.',
  },
  {
    slug: 'sacrifice-synergy',
    query: 'sacrifice synergy and aristocrats cards in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Sacrifice Synergy',
    description:
      'Find sacrifice synergy cards in Modern. Discover aristocrats payoffs, sacrifice outlets, and death triggers.',
  },
  {
    slug: 'multicolor-lands',
    query: 'best multicolor lands and mana fixers in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Multicolor Lands',
    description:
      'Find the best multicolor lands in Modern. Discover fetch lands, shock lands, triomes, and pain lands.',
  },
  {
    slug: 'green-creatures',
    query: 'best green creatures in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedColors: ['Green'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'Best Modern Green Creatures',
    description:
      'Find the best green creatures in Modern. Discover efficient green beaters, value creatures, and mana dorks.',
  },
  {
    slug: 'white-creatures',
    query: 'best white creatures in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedColors: ['White'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'Best Modern White Creatures',
    description:
      'Find the best white creatures in Modern. Discover efficient white threats, hatebears, and value creatures.',
  },
  {
    slug: 'blue-instants',
    query: 'best blue instant spells in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedColors: ['Blue'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'Best Modern Blue Instants',
    description:
      'Find the best blue instants in Modern. Discover counter magic, card draw, and instant-speed interaction.',
  },
  {
    slug: 'black-creatures',
    query: 'best black creatures in modern format',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
      selectedColors: ['Black'],
      selectedColorFilterOption: 'Match Exactly',
    },
    title: 'Best Modern Black Creatures',
    description:
      'Find the best black creatures in Modern. Discover efficient black threats, value creatures, and recursive creatures.',
  },
  {
    slug: 'equipment',
    query: 'best equipment cards in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Equipment',
    description:
      'Find the best equipment in Modern. Discover powerful artifact equipment for creature-based strategies.',
  },
  {
    slug: 'colorless-cards',
    query: 'best colorless and artifact cards in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Colorless Cards',
    description:
      'Find the best colorless and artifact cards in Modern. Discover format staples that fit in any deck.',
  },
  {
    slug: 'ramp-spells',
    query: 'best ramp and mana acceleration in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Ramp',
    description:
      'Find the best ramp spells in Modern. Discover mana acceleration, land search, and mana creatures.',
  },
  {
    slug: 'saga-cards',
    query: 'best saga enchantments in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Sagas',
    description:
      'Find the best sagas in Modern. Discover powerful multi-chapter enchantments for competitive play.',
  },
  {
    slug: 'hatebears',
    query: 'best hatebear creatures in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Hatebears',
    description:
      'Find the best hatebears in Modern. Discover disruptive creatures that tax and restrict opponents.',
  },
  {
    slug: 'cascade-cards',
    query: 'cascade spells and free cast effects in modern',
    searchType: 'ai',
    filters: {
      selectedCardFormats: [{ format: 'Modern', status: 'Legal' }],
    },
    title: 'Best Modern Cascade Cards',
    description:
      'Find the best cascade cards in Modern. Discover free-cast spells and cascade synergies.',
  },
];

// ─── AI Searches (generic) ───────────────────────────────────────
export const aiQueries: SeoQuery[] = [
  {
    slug: 'best-card-draw',
    query: 'best card draw spells in magic',
    searchType: 'ai',
    title: 'Best MTG Card Draw Spells',
    description:
      'Find the best card draw spells in Magic: The Gathering. Discover powerful draw engines, cantrips, and card advantage across all colors.',
  },
  {
    slug: 'best-removal',
    query: 'best creature removal spells in magic the gathering',
    searchType: 'ai',
    title: 'Best MTG Removal Spells',
    description:
      'Find the best removal spells in Magic: The Gathering. Discover efficient creature removal, exile effects, and board wipes across all colors.',
  },
  {
    slug: 'best-mana-rocks',
    query: 'best mana rocks and artifact ramp',
    searchType: 'ai',
    title: 'Best MTG Mana Rocks',
    description:
      'Find the best mana rocks in Magic: The Gathering. Discover artifact ramp, mana acceleration, and cost-efficient rocks.',
  },
  {
    slug: 'best-board-wipes',
    query: 'best board wipes and mass removal spells',
    searchType: 'ai',
    title: 'Best MTG Board Wipes',
    description:
      'Find the best board wipes in Magic: The Gathering. Discover mass removal spells, destroy all effects, and sweepers.',
  },
  {
    slug: 'best-counterspells',
    query: 'best counterspells and counter magic',
    searchType: 'ai',
    title: 'Best MTG Counterspells',
    description:
      'Find the best counterspells in Magic: The Gathering. Discover efficient counter magic for control decks across all formats.',
  },
  {
    slug: 'best-tutor-effects',
    query: 'best tutor effects that search your library',
    searchType: 'ai',
    title: 'Best MTG Tutor Effects',
    description:
      'Find the best tutor effects in Magic: The Gathering. Discover cards that search your library across all colors.',
  },
  {
    slug: 'best-graveyard-hate',
    query: 'best graveyard hate and graveyard removal',
    searchType: 'ai',
    title: 'Best MTG Graveyard Hate',
    description:
      'Find the best graveyard hate in Magic: The Gathering. Discover exile effects, graveyard removal, and anti-recursion cards.',
  },
  {
    slug: 'best-ramp-spells',
    query: 'best ramp spells and mana acceleration in green',
    searchType: 'ai',
    title: 'Best MTG Ramp Spells',
    description:
      'Find the best ramp spells in Magic: The Gathering. Discover land search, mana dorks, and green mana acceleration.',
  },
  {
    slug: 'best-planeswalkers',
    query: 'most powerful planeswalkers',
    searchType: 'ai',
    filters: { selectedCardTypes: ['Planeswalker'] },
    title: 'Best MTG Planeswalkers',
    description:
      'Find the best planeswalkers in Magic: The Gathering. Discover the most powerful planeswalkers across all colors and formats.',
  },
  {
    slug: 'best-land-cards',
    query: 'best utility lands and lands with powerful abilities',
    searchType: 'ai',
    title: 'Best MTG Utility Lands',
    description:
      'Find the best utility lands in Magic: The Gathering. Discover lands with powerful abilities beyond just mana production.',
  },
  {
    slug: 'best-equipment',
    query: 'best equipment cards for creatures',
    searchType: 'ai',
    title: 'Best MTG Equipment Cards',
    description:
      'Find the best equipment in Magic: The Gathering. Discover powerful artifacts that attach to and boost your creatures.',
  },
  {
    slug: 'best-enchantments',
    query: 'most powerful enchantments in magic',
    searchType: 'ai',
    title: 'Best MTG Enchantments',
    description:
      'Find the best enchantments in Magic: The Gathering. Discover powerful enchantments across all colors for any format.',
  },
  {
    slug: 'best-commanders',
    query: 'best commanders and legendary creatures for edh',
    searchType: 'ai',
    title: 'Best MTG Commanders',
    description:
      'Find the best commanders in Magic: The Gathering. Discover the most popular and powerful legendary creatures for EDH.',
  },
  {
    slug: 'best-creatures',
    query: 'most powerful creatures in magic the gathering',
    searchType: 'ai',
    title: 'Best MTG Creatures',
    description:
      'Find the best creatures in Magic: The Gathering. Discover the most powerful and efficient creatures across all formats.',
  },
  {
    slug: 'best-instants',
    query: 'best instant spells in magic the gathering',
    searchType: 'ai',
    title: 'Best MTG Instants',
    description:
      'Find the best instants in Magic: The Gathering. Discover powerful instant-speed spells for any deck or format.',
  },
  {
    slug: 'best-sorceries',
    query: 'best sorcery spells in magic the gathering',
    searchType: 'ai',
    title: 'Best MTG Sorceries',
    description:
      'Find the best sorceries in Magic: The Gathering. Discover game-changing sorcery spells across all colors.',
  },
  {
    slug: 'best-artifacts',
    query: 'most powerful artifacts in magic',
    searchType: 'ai',
    title: 'Best MTG Artifacts',
    description:
      'Find the best artifacts in Magic: The Gathering. Discover colorless powerhouses, mana rocks, and artifact synergies.',
  },
  {
    slug: 'best-sagas',
    query: 'best saga enchantments in magic the gathering',
    searchType: 'ai',
    title: 'Best MTG Sagas',
    description:
      'Find the best saga enchantments in Magic: The Gathering. Discover multi-chapter enchantments with cumulative value.',
  },
  {
    slug: 'best-tribal-cards',
    query: 'best tribal synergy cards and tribal lords',
    searchType: 'ai',
    title: 'Best MTG Tribal Cards',
    description:
      'Find the best tribal cards in Magic: The Gathering. Discover creature type lords, tribal synergies, and anthem effects.',
  },
  {
    slug: 'best-reanimation',
    query: 'best reanimation spells that bring creatures back from the dead',
    searchType: 'ai',
    title: 'Best MTG Reanimation Spells',
    description:
      'Find the best reanimation spells in Magic: The Gathering. Discover graveyard-to-battlefield effects across all colors.',
  },
  {
    slug: 'best-token-generators',
    query: 'best token generating cards and token payoffs',
    searchType: 'ai',
    title: 'Best MTG Token Generators',
    description:
      'Find the best token generators in Magic: The Gathering. Discover cards that create creature tokens and token synergies.',
  },
  {
    slug: 'best-combo-pieces',
    query: 'best combo pieces and infinite combo enablers',
    searchType: 'ai',
    title: 'Best MTG Combo Pieces',
    description:
      'Find the best combo pieces in Magic: The Gathering. Discover infinite combos, two-card combos, and synergy engines.',
  },
  {
    slug: 'best-discard',
    query: 'best discard and hand disruption spells',
    searchType: 'ai',
    title: 'Best MTG Discard Spells',
    description:
      'Find the best discard spells in Magic: The Gathering. Discover targeted discard, hand disruption, and information warfare.',
  },
  {
    slug: 'best-protection',
    query: 'best protection spells that grant hexproof or indestructible',
    searchType: 'ai',
    title: 'Best MTG Protection Spells',
    description:
      'Find the best protection spells in Magic. Discover ways to shield your permanents from removal and board wipes.',
  },
  {
    slug: 'best-sacrifice-outlets',
    query: 'best sacrifice outlets and aristocrats payoffs',
    searchType: 'ai',
    title: 'Best MTG Sacrifice Outlets',
    description:
      'Find the best sacrifice outlets in Magic: The Gathering. Discover aristocrats synergies, death triggers, and sac payoffs.',
  },
  {
    slug: 'best-stax-cards',
    query: 'best stax and resource denial cards',
    searchType: 'ai',
    title: 'Best MTG Stax Cards',
    description:
      'Find the best stax cards in Magic: The Gathering. Discover resource denial, tax effects, and lock pieces.',
  },
  {
    slug: 'best-cantrips',
    query: 'best cantrips and cheap card draw spells',
    searchType: 'ai',
    title: 'Best MTG Cantrips',
    description:
      'Find the best cantrips in Magic: The Gathering. Discover efficient one-mana card draw, scry, and card selection.',
  },
  {
    slug: 'best-treasure-cards',
    query: 'best treasure token generators and treasure synergy',
    searchType: 'ai',
    title: 'Best MTG Treasure Cards',
    description:
      'Find the best treasure cards in Magic: The Gathering. Discover treasure generators and powerful treasure synergies.',
  },
  {
    slug: 'best-energy-cards',
    query: 'best energy counter cards and energy payoffs',
    searchType: 'ai',
    title: 'Best MTG Energy Cards',
    description:
      'Find the best energy cards in Magic: The Gathering. Discover energy generators and powerful energy synergies.',
  },
  {
    slug: 'best-lifegain-cards',
    query: 'best lifegain cards and life gain payoffs',
    searchType: 'ai',
    title: 'Best MTG Lifegain Cards',
    description:
      'Find the best lifegain cards in Magic: The Gathering. Discover life gain synergies, soul sisters, and life payoffs.',
  },
  {
    slug: 'best-voltron-cards',
    query: 'best voltron cards equipment and auras for commander damage',
    searchType: 'ai',
    title: 'Best MTG Voltron Cards',
    description:
      'Find the best voltron cards in Magic: The Gathering. Discover equipment, auras, and buff effects for one-shot strategies.',
  },
  {
    slug: 'best-proliferate-cards',
    query: 'best proliferate cards and counter synergies',
    searchType: 'ai',
    title: 'Best MTG Proliferate Cards',
    description:
      'Find the best proliferate cards in Magic: The Gathering. Discover counter multipliers and proliferate synergies.',
  },
  {
    slug: 'best-modal-spells',
    query: 'best modal and versatile spells with multiple modes',
    searchType: 'ai',
    title: 'Best MTG Modal Spells',
    description:
      'Find the best modal spells in Magic: The Gathering. Discover versatile cards with multiple options and flexibility.',
  },
  {
    slug: 'best-eldrazi',
    query: 'best Eldrazi creatures and Eldrazi support cards',
    searchType: 'ai',
    title: 'Best MTG Eldrazi Cards',
    description:
      'Find the best Eldrazi in Magic: The Gathering. Discover massive colorless titans, annihilator threats, and Eldrazi support.',
  },
  {
    slug: 'best-dragons',
    query: 'best dragon creatures in magic the gathering',
    searchType: 'ai',
    title: 'Best MTG Dragons',
    description:
      'Find the best dragons in Magic: The Gathering. Discover powerful dragon creatures across all colors.',
  },
];

// ─── Lookup Maps ─────────────────────────────────────────────────

function buildMap(queries: SeoQuery[]): Map<string, SeoQuery> {
  return new Map(queries.map((q) => [q.slug, q]));
}

export const similarMap = buildMap(similarQueries);
export const keywordMap = buildMap(keywordQueries);
export const commanderMap = buildMap(commanderQueries);
export const arenaMap = buildMap(arenaQueries);
export const mtgoMap = buildMap(mtgoQueries);
export const modernMap = buildMap(modernQueries);
export const aiMap = buildMap(aiQueries);

// ─── Unified Lookup ──────────────────────────────────────────────

import type { Platform } from '~/utils/platformConfig';

type SearchType = 'ai' | 'similarity' | 'keyword' | 'commander';

/**
 * Mapping from (platform, searchType) to the corresponding query array / map.
 * Arena, MTGO, Modern slug pages are all AI search type.
 * Generic slug pages map to platform "all".
 */
const seoRegistry: Record<
  string,
  { queries: SeoQuery[]; map: Map<string, SeoQuery> }
> = {
  'arena:ai': { queries: arenaQueries, map: arenaMap },
  'mtgo:ai': { queries: mtgoQueries, map: mtgoMap },
  'modern:ai': { queries: modernQueries, map: modernMap },
  'all:ai': { queries: aiQueries, map: aiMap },
  'all:keyword': { queries: keywordQueries, map: keywordMap },
  'all:commander': { queries: commanderQueries, map: commanderMap },
  'all:similarity': { queries: similarQueries, map: similarMap },
};

/** Look up an SEO entry by platform + searchType + slug. */
export function getSeoEntry(
  platform: Platform,
  searchType: SearchType,
  slug: string,
): SeoQuery | undefined {
  const key = `${platform}:${searchType}`;
  return seoRegistry[key]?.map.get(slug);
}

/** All slugs for sitemap generation, grouped by platform and search type. */
export function getAllSeoSlugs() {
  const result: {
    platform: Platform;
    searchType: SearchType;
    slugs: string[];
  }[] = [];
  for (const [key, { queries }] of Object.entries(seoRegistry)) {
    const [platform, searchType] = key.split(':') as [Platform, SearchType];
    result.push({ platform, searchType, slugs: queries.map((q) => q.slug) });
  }
  return result;
}
