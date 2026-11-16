import type { Finish } from './printings';

export function parseMarkdownCardReference(value: string) {
  const match = value
    .trim()
    .match(
      /^(.*?)\|printing=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\|finish=(nonfoil|foil|etched))?$/i,
    );
  return match
    ? {
        name: match[1].trim(),
        printingId: match[2].toLowerCase(),
        finish: (match[3]?.toLowerCase() ?? 'nonfoil') as Finish,
      }
    : { name: value.trim(), printingId: null, finish: null };
}

export function formatMarkdownCardReference(
  name: string,
  printingId?: string | null,
  finish?: Finish | null,
) {
  return printingId
    ? `${name}|printing=${printingId}|finish=${finish ?? 'nonfoil'}`
    : name;
}

export function markdownCardTokens(source: string) {
  return [...source.matchAll(/\(\(([^)\n]+)\)\)|\[\[([^\]\n]+)\]\]/g)].map(
    (match) => ({
      from: match.index,
      to: match.index + match[0].length,
      value: (match[1] ?? match[2]).trim(),
      image: match[1] !== undefined,
    }),
  );
}
