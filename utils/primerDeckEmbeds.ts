import type { TokenizerAndRendererExtension } from 'marked';

export const primerDeckBlocks = [
  { type: 'mana-curve', label: 'Mana curve', icon: 'i-lucide-chart-column' },
  { type: 'color-chart', label: 'Color pie chart', icon: 'i-lucide-chart-pie' },
  {
    type: 'deck-stats',
    label: 'Deck stats',
    icon: 'i-lucide-chart-no-axes-combined',
  },
] as const;
export type PrimerDeckBlock = (typeof primerDeckBlocks)[number]['type'];

export function isPrimerDeckBlock(value: string): value is PrimerDeckBlock {
  return primerDeckBlocks.some((block) => block.type === value);
}

// A block extension keeps tokens inside code examples literal and supports
// normal Markdown nesting. The renderer only accepts these three fixed values.
export const primerDeckExtension: TokenizerAndRendererExtension = {
  name: 'primerDeck',
  level: 'block',
  start: (source) => source.indexOf('@[deck]('),
  tokenizer(source) {
    const match = source.match(
      /^ {0,3}@\[deck\]\((mana-curve|color-chart|deck-stats)\)[ \t]*(?:\n|$)/,
    );
    if (match) return { type: 'primerDeck', raw: match[0], block: match[1] };
  },
  renderer(token) {
    return `<div class="primer-deck-slot">CMDECKTOKEN${token.block}CMDECKTOKEN</div>\n`;
  },
};

export function restorePrimerDeckEmbeds(html: string): string {
  return html.replace(
    /<div class="primer-deck-slot">CMDECKTOKEN(mana-curve|color-chart|deck-stats)CMDECKTOKEN<\/div>/g,
    '<div class="primer-deck-slot" data-primer-deck="$1"></div>',
  );
}
