/** Build an inline color edit while keeping Markdown block markers outside spans. */
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
  // Applying another color to the selection left by this action replaces the
  // existing wrapper, instead of accumulating nested spans.
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

  const open = `<span style="color: ${color.toLowerCase()}">`;
  const close = '</span>';
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
      const body = line
        .slice(prefix.length)
        .replace(/<span style="color: #[0-9a-f]{6}">/gi, open);
      if (!body) {
        offset += line.length + 1;
        return line;
      }
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
