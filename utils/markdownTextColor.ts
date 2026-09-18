import { Marked, type TokenizerAndRendererExtension } from 'marked';

/** Match one inline color, including nested Markdown links and escaped brackets. */
export function matchMarkdownTextColor(source: string) {
  if (!source.startsWith('[')) return null;
  let depth = 1;
  for (let i = 1; i < source.length; i++) {
    const char = source[i];
    if (char === '\n' || char === '\r') return null;
    if (char === '\\') {
      i++;
      continue;
    }
    if (char.charCodeAt(0) === 96) {
      let length = 1;
      while (source[i + length] === char) length++;
      const end = source.indexOf(char.repeat(length), i + length);
      if (end !== -1) {
        i = end + length - 1;
        continue;
      }
    }
    if (char === '[') depth++;
    if (char !== ']') continue;
    depth--;
    if (depth !== 0) continue;
    const suffix = source.slice(i + 1).match(/^\{color=(#[0-9a-f]{6})\}/i);
    if (!suffix) return null;
    return {
      raw: source.slice(0, i + 1 + suffix[0].length),
      text: source.slice(1, i),
      color: suffix[1].toLowerCase(),
    };
  }
  return null;
}

const colorExtension: TokenizerAndRendererExtension = {
  name: 'textColor',
  level: 'inline',
  start: (source) => source.indexOf('['),
  tokenizer(source) {
    const color = matchMarkdownTextColor(source);
    if (!color) return;
    return {
      type: 'textColor',
      ...color,
      tokens: this.lexer.inlineTokens(color.text),
    };
  },
  renderer(token) {
    return (
      '<span style="color: ' +
      token.color +
      '">' +
      this.parser.parseInline(token.tokens ?? []) +
      '</span>'
    );
  },
};

const coloredMarkdown = new Marked({ extensions: [colorExtension] });

/** Output still goes through the normal HTML sanitizer before display. */
export function parseColoredMarkdown(source: string): string {
  return coloredMarkdown.parse(source, { async: false });
}

/** Keep Markdown block markers outside the inline color syntax. */
export function markdownTextColorEdit(
  source: string,
  selection: { from: number; to: number },
  color: string,
) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return null;
  const { from, to } = selection;
  const selected = source.slice(from, to) || 'colored text';
  let replaceFrom = from;
  let replaceTo = to;
  const closing = source.slice(to).match(/^\]\{color=#[0-9a-f]{6}\}/i);
  if (!selected.includes('\n') && source[from - 1] === '[' && closing) {
    replaceFrom--;
    replaceTo += closing[0].length;
  } else {
    // Convert the old HTML wrapper when recoloring a still-open draft.
    const opening = source
      .slice(0, from)
      .match(/<span style="color: #[0-9a-f]{6}">$/i);
    if (
      !selected.includes('\n') &&
      opening &&
      source.slice(to).startsWith('</span>')
    ) {
      replaceFrom -= opening[0].length;
      replaceTo += '</span>'.length;
    }
  }

  const open = '[';
  const close = ']{color=' + color.toLowerCase() + '}';
  let firstTextOffset = 0;
  let lastTextEnd = 0;
  let offset = 0;
  const text = selected
    .split('\n')
    .map((line, index) => {
      if (!line.trim()) {
        offset += line.length + 1;
        return line;
      }
      const atLineStart = index > 0 || from === 0 || source[from - 1] === '\n';
      const prefix = atLineStart
        ? (line.match(/^(\s*(?:(?:#{1,6}|>|[-+*]|\d+[.)])\s+)*)/)?.[0] ?? '')
        : '';
      let body = line
        .slice(prefix.length)
        .replace(/\]\{color=#[0-9a-f]{6}\}/gi, close);
      if (!body) {
        offset += line.length + 1;
        return line;
      }
      const existing = matchMarkdownTextColor(body);
      if (existing?.raw === body) body = existing.text;
      const result = prefix + open + body + close;
      if (!firstTextOffset)
        firstTextOffset = offset + prefix.length + open.length;
      lastTextEnd = offset + prefix.length + open.length + body.length;
      offset += result.length + 1;
      return result;
    })
    .join('\n');

  return {
    text,
    range: { from: replaceFrom, to: replaceTo },
    selection: selected.includes('\n')
      ? { anchor: replaceFrom, head: replaceFrom + text.length }
      : {
          anchor: replaceFrom + firstTextOffset,
          head: replaceFrom + lastTextEnd,
        },
  };
}
