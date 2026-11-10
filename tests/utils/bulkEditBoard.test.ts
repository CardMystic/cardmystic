import { describe, expect, it } from 'vitest';
import { parseBulkEditBoard } from '../../utils/bulkEditBoard';

describe('bulk edit board text', () => {
  it('does not send a pasted Mainboard heading to the card lookup', () => {
    expect(
      parseBulkEditBoard('Mainboard\r\n7 Island\n\nSol Ring', 'Mainboard'),
    ).toEqual([
      { name: 'Island', num_copies: 7 },
      { name: 'Sol Ring', num_copies: 1 },
    ]);
  });

  it.each([
    ['Mainboard', ' MAINBOARD: (8) '],
    ['Mainboard', 'Deck'],
    ['Sideboard', 'Sideboard (8)'],
    ['Considering', 'Considering:'],
    ['Considering', 'Maybeboard'],
  ] as const)('recognizes %s headings: %s', (board, heading) => {
    expect(parseBulkEditBoard(`${heading}\n8x Island`, board)).toEqual([
      { name: 'Island', num_copies: 8 },
    ]);
    expect(parseBulkEditBoard(heading, board)).toEqual([]);
  });

  it('preserves card names containing heading words and explicit quantities', () => {
    expect(
      parseBulkEditBoard('The Deck of Many Things\n1 Mainboard', 'Mainboard'),
    ).toEqual([
      { name: 'The Deck of Many Things', num_copies: 1 },
      { name: 'Mainboard', num_copies: 1 },
    ]);
  });

  it('does not silently merge another board into the selected tab', () => {
    expect(parseBulkEditBoard('Sideboard\n2 Negate', 'Mainboard')[0].name).toBe(
      'Sideboard',
    );
  });
});
