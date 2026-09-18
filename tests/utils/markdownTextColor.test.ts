import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import { markdownTextColorEdit } from '~/utils/markdownTextColor';

describe('Markdown text colors', () => {
  it('colors selected paragraph text without changing the surrounding text', () => {
    const source = 'Keep this important phrase visible.';
    const edit = markdownTextColorEdit(
      source,
      { from: 10, to: 26 },
      '#DC2626',
    )!;
    expect(
      source.slice(0, edit.range.from) +
        edit.text +
        source.slice(edit.range.to),
    ).toBe(
      'Keep this <span style="color: #dc2626">important phrase</span> visible.',
    );
  });

  it('keeps heading, list and quote markers and blank paragraphs outside color spans', () => {
    const source = '# Title\n\nFirst **paragraph**.\n\n- Item\n> Quote';
    const edit = markdownTextColorEdit(
      source,
      { from: 0, to: source.length },
      '#dc2626',
    )!;
    const html = marked.parse(edit.text, { async: false });
    expect(html).toContain(
      '<h1><span style="color: #dc2626">Title</span></h1>',
    );
    expect(html).toContain('<strong>paragraph</strong>');
    expect(html).toContain('<li><span style="color: #dc2626">Item</span></li>');
    expect(html).toContain('<blockquote>');
    expect(edit.text).toContain('</span>\n\n<span');
  });

  it('recolors the retained selection without nesting another wrapper', () => {
    const first = markdownTextColorEdit(
      '# Title',
      { from: 0, to: 7 },
      '#dc2626',
    )!;
    const second = markdownTextColorEdit(
      first.text,
      { from: first.selection.anchor, to: first.selection.head },
      '#2563eb',
    )!;
    expect(
      first.text.slice(0, second.range.from) +
        second.text +
        first.text.slice(second.range.to),
    ).toBe('# <span style="color: #2563eb">Title</span>');
  });

  it('keeps multiline selections valid when applying another color', () => {
    const first = markdownTextColorEdit(
      '# Title\n\nParagraph',
      { from: 0, to: 18 },
      '#dc2626',
    )!;
    const second = markdownTextColorEdit(
      first.text,
      { from: first.selection.anchor, to: first.selection.head },
      '#2563eb',
    )!;
    const html = marked.parse(second.text, { async: false });
    expect(html).toContain('<h1>');
    expect(html).toContain('<p>');
    expect(html).not.toContain('#dc2626');
    expect((html.match(/<span /g) ?? []).length).toBe(
      (html.match(/<\/span>/g) ?? []).length,
    );
  });

  it('inserts selected placeholder text at an empty caret', () => {
    const edit = markdownTextColorEdit(
      'Intro ',
      { from: 6, to: 6 },
      '#dc2626',
    )!;
    const result = 'Intro ' + edit.text;
    expect(result.slice(edit.selection.anchor, edit.selection.head)).toBe(
      'colored text',
    );
  });

  it('rejects a color value that could inject HTML or CSS', () => {
    expect(
      markdownTextColorEdit('Text', { from: 0, to: 4 }, 'red; position:fixed'),
    ).toBeNull();
    expect(
      markdownTextColorEdit('Text', { from: 0, to: 4 }, '"><img src=x>'),
    ).toBeNull();
  });
});
