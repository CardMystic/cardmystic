type Legalities = Record<string, string>;

export type LegalityResult = {
  legal: boolean;
  reason?: string;
};

/**
 * Checks if a card is legal in a given format considering its legality status and quantity.
 * Does NOT check color identity — use `isColorIdentityLegal` for that.
 */
export function isLegal(
  legalities: Legalities | undefined,
  format: string,
  quantity: number = 1,
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

export function colorLetterToName(letter: string): string {
  const map: Record<string, string> = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
  };
  return map[letter.toUpperCase()] || letter;
}
