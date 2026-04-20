type Legalities = Record<string, string>;

export type LegalityResult = {
  legal: boolean;
  reason?: string;
};

/** Formats where decks are singleton (1 copy max, except basics/exemptions) */
const singletonFormats = new Set([
  'commander',
  'duel',
  'brawl',
  'standardbrawl',
  'oathbreaker',
  'paupercommander',
  'predh',
]);

/** Default max copies for non-singleton constructed formats */
const DEFAULT_MAX_COPIES = 4;

/**
 * Map a display format name (e.g. "Pauper Commander") to the Scryfall legality key (e.g. "paupercommander").
 */
export function formatToLegalityKey(format: string): string {
  return format.toLowerCase().replace(/\s+/g, '');
}

/**
 * Returns true if the card is exempt from copy limits
 * (basic lands, or cards with "A deck can have any number of cards named" text).
 */
function isUnlimitedCopies(typeLine?: string, oracleText?: string): boolean {
  if (typeLine && /\bBasic\b/.test(typeLine) && /\bLand\b/.test(typeLine)) {
    return true;
  }
  if (
    oracleText &&
    /a deck can have any number of cards named/i.test(oracleText)
  ) {
    return true;
  }
  return false;
}

/**
 * Checks if a card is legal in a given format considering its legality status and quantity.
 * Does NOT check color identity — use `isColorIdentityLegal` for that.
 *
 * @param legalities - The card's legality map from Scryfall
 * @param format - The Scryfall legality key (e.g. "commander", "modern")
 * @param quantity - Number of copies in the deck (default 1)
 * @param typeLine - The card's type line (for basic land detection)
 * @param oracleText - The card's oracle text (for "any number" detection)
 */
export function isLegal(
  legalities: Legalities | undefined,
  format: string,
  quantity: number = 1,
  typeLine?: string,
  oracleText?: string,
): LegalityResult {
  if (!legalities) {
    return { legal: true };
  }

  const status = legalities[format];
  if (!status || status === 'not_legal') {
    return { legal: false, reason: `Not legal in ${format}` };
  }
  if (status === 'banned') {
    return { legal: false, reason: `Banned in ${format}` };
  }
  if (status === 'restricted' && quantity > 1) {
    return { legal: false, reason: `Restricted to 1 copy in ${format}` };
  }

  // Check quantity limits (skip for unlimited-copies cards)
  if (quantity > 1 && !isUnlimitedCopies(typeLine, oracleText)) {
    if (singletonFormats.has(format) && quantity > 1) {
      return { legal: false, reason: `Only 1 copy allowed in ${format}` };
    }
    if (!singletonFormats.has(format) && quantity > DEFAULT_MAX_COPIES) {
      return {
        legal: false,
        reason: `Max ${DEFAULT_MAX_COPIES} copies allowed in ${format}`,
      };
    }
  }

  return { legal: true };
}

/**
 * Checks if a card's color identity fits within a commander's color identity.
 * Basic lands are always allowed.
 */
export function isColorIdentityLegal(
  cardColorIdentity: string[],
  commanderColorIdentity: string[],
  typeLine: string,
): LegalityResult {
  // Basic lands are always legal regardless of color identity
  if (isBasicLand(typeLine)) {
    return { legal: true };
  }

  // Colorless cards are always within any commander's color identity
  if (cardColorIdentity.length === 0) {
    return { legal: true };
  }

  // Check each color in the card's identity is in the commander's identity
  const commanderColors = new Set(
    commanderColorIdentity.map((c) => c.toUpperCase()),
  );
  const invalidColors = cardColorIdentity.filter(
    (c) => !commanderColors.has(c.toUpperCase()),
  );

  if (invalidColors.length > 0) {
    return {
      legal: false,
      reason: `Outside commander's color identity`,
    };
  }

  return { legal: true };
}

function isBasicLand(typeLine: string): boolean {
  if (!typeLine) return false;
  return /\bBasic\b/.test(typeLine) && /\bLand\b/.test(typeLine);
}

function colorLetterToName(letter: string): string {
  const map: Record<string, string> = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
  };
  return map[letter.toUpperCase()] || letter;
}
