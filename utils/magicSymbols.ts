export interface MagicSymbol {
  token: string;
  label: string;
  category: string;
  iconClass: string;
}

const mana = (token: string, label: string, icon: string): MagicSymbol => ({
  token,
  label,
  category: 'Mana',
  iconClass: `ms ms-${icon} ms-cost ms-shadow`,
});

const symbol = (
  token: string,
  label: string,
  category: string,
  icon: string,
): MagicSymbol => ({ token, label, category, iconClass: `ms ms-${icon}` });

export const magicSymbols: MagicSymbol[] = [
  mana('W', 'White mana', 'w'),
  mana('U', 'Blue mana', 'u'),
  mana('B', 'Black mana', 'b'),
  mana('R', 'Red mana', 'r'),
  mana('G', 'Green mana', 'g'),
  mana('C', 'Colorless mana', 'c'),
  ...Array.from({ length: 21 }, (_, value) =>
    mana(String(value), `${value} generic mana`, String(value)),
  ),
  mana('X', 'Variable mana', 'x'),
  mana('S', 'Snow mana', 's'),
  ...[
    ['W/U', 'White or blue mana', 'wu'],
    ['U/B', 'Blue or black mana', 'ub'],
    ['B/R', 'Black or red mana', 'br'],
    ['R/G', 'Red or green mana', 'rg'],
    ['G/W', 'Green or white mana', 'gw'],
    ['W/B', 'White or black mana', 'wb'],
    ['U/R', 'Blue or red mana', 'ur'],
    ['B/G', 'Black or green mana', 'bg'],
    ['R/W', 'Red or white mana', 'rw'],
    ['G/U', 'Green or blue mana', 'gu'],
    ['2/W', 'Two generic or white mana', '2w'],
    ['2/U', 'Two generic or blue mana', '2u'],
    ['2/B', 'Two generic or black mana', '2b'],
    ['2/R', 'Two generic or red mana', '2r'],
    ['2/G', 'Two generic or green mana', '2g'],
    ['W/P', 'White Phyrexian mana', 'wp'],
    ['U/P', 'Blue Phyrexian mana', 'up'],
    ['B/P', 'Black Phyrexian mana', 'bp'],
    ['R/P', 'Red Phyrexian mana', 'rp'],
    ['G/P', 'Green Phyrexian mana', 'gp'],
  ].map(([token, label, icon]) => mana(token, label, icon)),
  symbol('T', 'Tap', 'Actions & resources', 'tap'),
  symbol('Q', 'Untap', 'Actions & resources', 'untap'),
  symbol('E', 'Energy', 'Actions & resources', 'energy'),
  symbol('+1/+1', '+1/+1 counter', 'Counters', 'counter-plus'),
  symbol('-1/-1', '-1/-1 counter', 'Counters', 'counter-minus'),
  symbol('STUN', 'Stun counter', 'Counters', 'counter-stun'),
  symbol('SHIELD', 'Shield counter', 'Counters', 'counter-shield'),
  symbol('LORE', 'Lore counter', 'Counters', 'counter-lore'),
  symbol('LOYALTY', 'Loyalty counter', 'Counters', 'counter-loyalty'),
  symbol('TIME', 'Time counter', 'Counters', 'counter-time'),
  symbol('FINALITY', 'Finality counter', 'Counters', 'counter-finality'),
  symbol('FLYING', 'Flying', 'Abilities', 'ability-flying'),
  symbol('FIRST-STRIKE', 'First strike', 'Abilities', 'ability-first-strike'),
  symbol(
    'DOUBLE-STRIKE',
    'Double strike',
    'Abilities',
    'ability-double-strike',
  ),
  symbol('DEATHTOUCH', 'Deathtouch', 'Abilities', 'ability-deathtouch'),
  symbol('HASTE', 'Haste', 'Abilities', 'ability-haste'),
  symbol('HEXPROOF', 'Hexproof', 'Abilities', 'ability-hexproof'),
  symbol(
    'INDESTRUCTIBLE',
    'Indestructible',
    'Abilities',
    'ability-indestructible',
  ),
  symbol('LIFELINK', 'Lifelink', 'Abilities', 'ability-lifelink'),
  symbol('MENACE', 'Menace', 'Abilities', 'ability-menace'),
  symbol('REACH', 'Reach', 'Abilities', 'ability-reach'),
  symbol('TRAMPLE', 'Trample', 'Abilities', 'ability-trample'),
  symbol('VIGILANCE', 'Vigilance', 'Abilities', 'ability-vigilance'),
  symbol('COMMANDER', 'Commander', 'Cards & zones', 'commander'),
  symbol('PLANESWALKER', 'Planeswalker', 'Cards & zones', 'planeswalker'),
  symbol('CREATURE', 'Creature', 'Cards & zones', 'creature'),
  symbol('ARTIFACT', 'Artifact', 'Cards & zones', 'artifact'),
  symbol('ENCHANTMENT', 'Enchantment', 'Cards & zones', 'enchantment'),
  symbol('INSTANT', 'Instant', 'Cards & zones', 'instant'),
  symbol('SORCERY', 'Sorcery', 'Cards & zones', 'sorcery'),
  symbol('LAND', 'Land', 'Cards & zones', 'land'),
  symbol('HAND', 'Hand', 'Cards & zones', 'hand'),
  symbol('LIBRARY', 'Library', 'Cards & zones', 'library'),
  symbol('GRAVEYARD', 'Graveyard', 'Cards & zones', 'graveyard'),
  symbol('EXILE', 'Exile', 'Cards & zones', 'exile'),
];

const symbolsByToken = new Map(
  magicSymbols.map((entry) => [entry.token.toUpperCase(), entry]),
);

export const magicSymbolTokenPattern = /\{([^{}\n]+)\}/g;

export function extractMagicSymbols(source: string): {
  text: string;
  symbols: MagicSymbol[];
} {
  const symbols: MagicSymbol[] = [];
  const text = source.replace(magicSymbolTokenPattern, (match, token) => {
    const entry = symbolsByToken.get(String(token).trim().toUpperCase());
    if (!entry) return match;
    const index = symbols.push(entry) - 1;
    return `MAGICSYMBOLTOKEN${index}MAGICSYMBOLTOKEN`;
  });
  return { text, symbols };
}

export function restoreMagicSymbols(
  html: string,
  symbols: MagicSymbol[],
): string {
  return html.replace(
    /MAGICSYMBOLTOKEN(\d+)MAGICSYMBOLTOKEN/g,
    (match, index) => {
      const entry = symbols[Number(index)];
      if (!entry) return match;
      return `<span class="magic-symbol ${entry.iconClass}" role="img" aria-label="${entry.label}" title="${entry.label}"></span>`;
    },
  );
}
