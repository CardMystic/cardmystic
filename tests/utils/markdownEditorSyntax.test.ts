import { describe, expect, it } from 'vitest';
import { parser, GFM } from '@lezer/markdown';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { ensureSyntaxTree } from '@codemirror/language';
import { cardMysticMarkdown } from '../../utils/markdownEditorSyntax';

const customTypes = new Set([
  'CardLink',
  'CardImage',
  'ManaSymbol',
  'MysticEmoji',
  'YouTubeEmbed',
  'SearchEmbed',
]);
const markdownParser = parser.configure([GFM, cardMysticMarkdown]);
function tokens(source: string) {
  const found: { type: string; text: string }[] = [];
  markdownParser.parse(source).iterate({
    enter(node) {
      if (customTypes.has(node.name))
        found.push({ type: node.name, text: source.slice(node.from, node.to) });
    },
  });
  return found;
}

describe('CardMystic editor syntax', () => {
  it('recognizes custom tokens inside ordinary Markdown', () => {
    expect(
      tokens(
        '**[[Sol Ring]]** ((Lightning Bolt)) {W/U} :+1: @[youtube](abcdefghijk)',
      ),
    ).toEqual([
      { type: 'CardLink', text: '[[Sol Ring]]' },
      { type: 'CardImage', text: '((Lightning Bolt))' },
      { type: 'ManaSymbol', text: '{W/U}' },
      { type: 'MysticEmoji', text: ':+1:' },
      { type: 'YouTubeEmbed', text: '@[youtube](abcdefghijk)' },
    ]);
  });

  it('leaves code examples and unfinished tokens alone', () => {
    expect(
      tokens(
        '`[[Sol Ring]] {R} :smile:`\n\n```md\n((Lightning Bolt))\n```\n\n[[unfinished\n((unfinished\n{R\n:smile',
      ),
    ).toEqual([]);
  });

  it('highlights explicit search syntax but leaves code examples literal', () => {
    const syntax =
      '@[search](https://cardmystic.com/search/all/smart?query=draw%20cards)';
    const tick = String.fromCharCode(96);
    expect(tokens(syntax)).toEqual([{ type: 'SearchEmbed', text: syntax }]);
    expect(tokens(tick + syntax + tick)).toEqual([]);
    expect(
      tokens(tick.repeat(3) + 'md\n' + syntax + '\n' + tick.repeat(3)),
    ).toEqual([]);
  });

  it('updates the syntax tree when a token is completed and undone', () => {
    const state = EditorState.create({
      doc: 'Before [[Sol Ring]',
      extensions: [markdown({ extensions: [GFM, cardMysticMarkdown] })],
    });
    const completed = state.update({
      changes: { from: state.doc.length, insert: ']' },
    }).state;
    expect(
      ensureSyntaxTree(completed, completed.doc.length)?.toString(),
    ).toContain('CardLink');
    const incomplete = completed.update({
      changes: { from: completed.doc.length - 1, to: completed.doc.length },
    }).state;
    expect(
      ensureSyntaxTree(incomplete, incomplete.doc.length)?.toString(),
    ).not.toContain('CardLink');
  });
});
