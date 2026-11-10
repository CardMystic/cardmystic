import type { TransferBoard } from './deckTransfer';

const headings: Record<TransferBoard, RegExp> = {
  Mainboard: /^(?:mainboard|deck)\s*:?(?:\s*\(\d+\))?$/i,
  Sideboard: /^sideboard\s*:?(?:\s*\(\d+\))?$/i,
  Considering: /^(?:considering|maybeboard)\s*:?(?:\s*\(\d+\))?$/i,
};

export function parseBulkEditBoard(text: string, board: TransferBoard) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !headings[board].test(line))
    .map((line) => {
      const match = line.match(/^(\d+)x?\s+(.+)$/i);
      return match
        ? { name: match[2].trim(), num_copies: parseInt(match[1], 10) }
        : { name: line, num_copies: 1 };
    });
}
