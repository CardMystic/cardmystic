import { describe, expect, it } from 'vitest';
import { censorUserText } from '../../utils/textModeration';

describe('censorUserText', () => {
  it.each([
    ['That FUCKING card is sh1t.', 'That ••• card is •••.'],
    ['A f.u.c.k and a fu\u200bck.', 'A ••• and a •••.'],
    ['KILL ALL MUSLIMS!', '•••!'],
    ['All trans people should die.', '•••.'],
    [
      'Our gay players love Assassin’s Trophy and Damnation.',
      'Our gay players love Assassin’s Trophy and Damnation.',
    ],
    [
      'Remove all black creatures. Draw a card.',
      'Remove all black creatures. Draw a card.',
    ],
    ['Class assignment 👩‍👩‍👧', 'Class assignment 👩‍👩‍👧'],
  ])('reviews %s', (input, expected) => {
    expect(censorUserText(input)).toBe(expected);
    expect(censorUserText(expected)).toBe(expected);
  });
});
