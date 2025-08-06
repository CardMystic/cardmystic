import { h } from 'vue';
import ManaIcon from '~/components/manaIcon.vue';

/**
 * Convert symbols (mana, tap, etc) in a string to ManaIcon components
 */
export const formatSymbols = (text: string | undefined) => {
  if (!text) return [];

  const symbols = text.match(/\{([^}]+)\}/g);

  if (!symbols) return [text];

  // Split text into parts and symbols while preserving newlines
  const parts: (string | ReturnType<typeof h>)[] = [];
  let lastIndex = 0;

  symbols.forEach((symbol) => {
    const symbolIndex = text.indexOf(symbol, lastIndex);

    // Add text before the symbol (preserving newlines)
    if (symbolIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, symbolIndex);
      // Split by newlines and add each part with line breaks
      const lines = textBefore.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) {
          parts.push(h('br')); // Add line break for newlines
        }
        if (line) {
          parts.push(line);
        }
      });
    }

    let symbolForUrl = symbol.slice(1, -1); // Remove { and }

    // Handle hybrid mana (e.g., W/U becomes wu)
    if (symbolForUrl.includes('/')) {
      symbolForUrl = symbolForUrl.replace('/', '').toLowerCase();
    }

    // Handle special symbols
    const specialSymbols: Record<string, string> = {
      t: 'tap',
      T: 'tap',
      q: 'untap',
      Q: 'untap',
      e: 'energy',
      E: 'energy',
      s: 'snow',
      S: 'snow',
      chaos: 'chaos',
      pw: 'planeswalker',
      loyalty: 'loyalty',
      '∞': 'infinity',
    };

    if (specialSymbols[symbolForUrl]) {
      symbolForUrl = specialSymbols[symbolForUrl];
    }

    // Create ManaIcon component
    parts.push(h(ManaIcon, { type: symbolForUrl }));

    lastIndex = symbolIndex + symbol.length;
  });

  // Add remaining text (preserving newlines)
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    const lines = remainingText.split('\n');
    lines.forEach((line, index) => {
      if (index > 0) {
        parts.push(h('br')); // Add line break for newlines
      }
      if (line) {
        parts.push(line);
      }
    });
  }

  return parts;
};
