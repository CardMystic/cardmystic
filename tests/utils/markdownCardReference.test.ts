import { describe, expect, it } from 'vitest';
import {
  parseMarkdownCardReference,
  formatMarkdownCardReference,
  markdownCardTokens,
} from '../../utils/markdownCardReference';

describe('Markdown card printing references', () => {
  const id = '10000000-0000-4000-8000-000000000001';
  it('keeps existing card names and validates printing IDs', () => {
    expect(parseMarkdownCardReference(' Sol Ring ')).toEqual({
      name: 'Sol Ring',
      printingId: null,
      finish: null,
    });
    expect(
      parseMarkdownCardReference('Sol Ring|printing=invalid').printingId,
    ).toBeNull();
  });
  it('round-trips a selected printing and finish', () => {
    expect(
      parseMarkdownCardReference(
        formatMarkdownCardReference('Sol Ring', id, 'foil'),
      ),
    ).toEqual({ name: 'Sol Ring', printingId: id, finish: 'foil' });
    expect(formatMarkdownCardReference('Sol Ring', null)).toBe('Sol Ring');
  });
  it('identifies individual occurrences without changing adjacent cards', () => {
    const source = '((Sol Ring)) ((Sol Ring)) [[Sol Ring]]';
    const token = markdownCardTokens(source)[1];
    expect(
      source.slice(0, token.from) + '((Selected))' + source.slice(token.to),
    ).toBe('((Sol Ring)) ((Selected)) [[Sol Ring]]');
    expect(markdownCardTokens(source).map((token) => token.image)).toEqual([
      true,
      true,
      false,
    ]);
  });
});
