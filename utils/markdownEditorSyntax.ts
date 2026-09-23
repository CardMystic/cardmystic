import { matchMarkdownTextColor } from './markdownTextColor';
import { Tag } from '@lezer/highlight';
import type { MarkdownConfig } from '@lezer/markdown';

export const cardImageTag = Tag.define();
export const cardLinkTag = Tag.define();
export const manaSymbolTag = Tag.define();
export const emojiTag = Tag.define();
export const youtubeTag = Tag.define();
export const searchEmbedTag = Tag.define();
export const textColorTag = Tag.define();

// Extend Markdown's incremental inline parser. Code spans and fenced code
// retain Markdown's own precedence, so token-looking examples stay code.
export const cardMysticMarkdown: MarkdownConfig = {
  defineNodes: [
    { name: 'CardImage', style: cardImageTag },
    { name: 'CardLink', style: cardLinkTag },
    { name: 'ManaSymbol', style: manaSymbolTag },
    { name: 'MysticEmoji', style: emojiTag },
    { name: 'YouTubeEmbed', style: youtubeTag },
    { name: 'SearchEmbed', style: searchEmbedTag },
    { name: 'TextColorMark', style: textColorTag },
  ],
  parseInline: [
    {
      name: 'CardMysticTokens',
      before: 'Link',
      parse(cx, next, pos) {
        if (next === 91 && matchMarkdownTextColor(cx.slice(pos, cx.end))) {
          return cx.addElement(cx.elt('TextColorMark', pos, pos + 1));
        }
        if (next === 93) {
          const closing = cx
            .slice(pos, cx.end)
            .match(/^\]\{color=#[0-9a-f]{6}\}/i);
          if (closing)
            return cx.addElement(
              cx.elt('TextColorMark', pos, pos + closing[0].length),
            );
        }
        let name: string;
        let match: RegExpMatchArray | null;
        // Only slice the inline text at plausible token starts.
        if (next === 91 && cx.char(pos + 1) === 91) {
          name = 'CardLink';
          match = cx.slice(pos, cx.end).match(/^\[\[[^\]\n]+\]\]/);
        } else if (next === 40 && cx.char(pos + 1) === 40) {
          name = 'CardImage';
          match = cx.slice(pos, cx.end).match(/^\(\([^\)\n]+\)\)/);
        } else if (next === 123) {
          name = 'ManaSymbol';
          match = cx.slice(pos, cx.end).match(/^\{[^{}\n]+\}/);
        } else if (next === 58) {
          name = 'MysticEmoji';
          match = cx.slice(pos, cx.end).match(/^:[a-z0-9_+-]+:/);
        } else if (next === 64) {
          const text = cx.slice(pos, cx.end);
          match = text.match(/^@\[search\]\([^\n]+\)/);
          name = 'SearchEmbed';
          if (!match) {
            name = 'YouTubeEmbed';
            match = text.match(/^@\[youtube\]\([A-Za-z0-9_-]{11}\)/);
          }
        } else {
          return -1;
        }
        return match
          ? cx.addElement(cx.elt(name, pos, pos + match[0].length))
          : -1;
      },
    },
  ],
};

export interface MarkdownSourceEditorHandle {
  focus(): void;
  getSelection(): { from: number; to: number };
  replaceSelection(
    text: string,
    selection?: { anchor: number; head: number },
    range?: { from: number; to: number },
  ): void;
}

export interface EditorCardHover {
  name: string;
  left: number;
  top: number;
  bottom: number;
}
