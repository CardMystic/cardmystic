import { describe, it, expect } from 'vitest';
import { parseDecklist } from '~/utils/decklist';

describe('parseDecklist', () => {
  it('strips numeric quantity prefix', () => {
    expect(parseDecklist('4 Lightning Bolt')).toEqual(['Lightning Bolt']);
  });

  it('strips "x" quantity prefix', () => {
    expect(parseDecklist('2x Counterspell')).toEqual(['Counterspell']);
  });

  it('handles a card name with no quantity prefix', () => {
    expect(parseDecklist('Sol Ring')).toEqual(['Sol Ring']);
  });

  it('parses multiple lines', () => {
    expect(
      parseDecklist('4 Lightning Bolt\n2x Counterspell\nSol Ring'),
    ).toEqual(['Lightning Bolt', 'Counterspell', 'Sol Ring']);
  });

  it('ignores empty lines', () => {
    expect(parseDecklist('Sol Ring\n\n\nCounterspell')).toEqual([
      'Sol Ring',
      'Counterspell',
    ]);
  });

  it('returns empty array for blank input', () => {
    expect(parseDecklist('')).toEqual([]);
    expect(parseDecklist('   \n  \n')).toEqual([]);
  });

  it('preserves commas and apostrophes in card names', () => {
    expect(parseDecklist('1 Ragavan, Nimble Pilferer')).toEqual([
      'Ragavan, Nimble Pilferer',
    ]);
  });

  it('handles large quantity prefixes', () => {
    expect(parseDecklist('99 Forest')).toEqual(['Forest']);
  });
});
