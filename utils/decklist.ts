/**
 * Parse a raw decklist string into an array of card names.
 * Handles quantity prefixes like "2x Sol Ring" or "4 Lightning Bolt".
 */
export function parseDecklist(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\d+x?\s+/i, '').trim())
    .filter((name) => name.length > 0);
}
