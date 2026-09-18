import { describe, expect, it } from 'vitest';
import sanitizeHtml from 'sanitize-html';
import {
  markdownTextColorEdit,
  parseColoredMarkdown,
} from '~/utils/markdownTextColor';

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
    ).toBe('Keep this [important phrase]{color=#dc2626} visible.');
  });

  it('keeps heading, list and quote markers and blank paragraphs outside color spans', () => {
    const source = '# Title\n\nFirst **paragraph**.\n\n- Item\n> Quote';
    const edit = markdownTextColorEdit(
      source,
      { from: 0, to: source.length },
      '#dc2626',
    )!;
    const saved = sanitizeHtml(edit.text, {
      allowedTags: ['details', 'summary'],
      allowedAttributes: { details: ['open'] },
      disallowedTagsMode: 'discard',
    });
    expect(saved).toContain('[Title]{color=#dc2626}');
    expect(parseColoredMarkdown(saved)).toContain(
      '<span style="color: #dc2626">Title</span>',
    );
    const html = parseColoredMarkdown(edit.text);
    expect(html).toContain(
      '<h1><span style="color: #dc2626">Title</span></h1>',
    );
    expect(html).toContain('<strong>paragraph</strong>');
    expect(html).toContain('<li><span style="color: #dc2626">Item</span></li>');
    expect(html).toContain('<blockquote>');
    expect(edit.text).toContain(']{color=#dc2626}\n\n[');
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
    ).toBe('# [Title]{color=#2563eb}');
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
    const html = parseColoredMarkdown(second.text);
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

  it('renders inline Markdown while leaving code examples and ordinary links intact', () => {
    const source = '[**bold** and [link](https://example.com)]{color=#DC2626}';
    expect(parseColoredMarkdown(source)).toContain(
      '<span style="color: #dc2626"><strong>bold</strong> and <a href="https://example.com">link</a></span>',
    );
    const tick = String.fromCharCode(96);
    expect(parseColoredMarkdown(tick + source + tick)).not.toContain('<span');
    expect(
      parseColoredMarkdown(
        tick.repeat(3) + '\n' + source + '\n' + tick.repeat(3),
      ),
    ).not.toContain('<span');
    expect(
      parseColoredMarkdown('[bad]{color=red;position:fixed}'),
    ).not.toContain('<span');
    expect(parseColoredMarkdown('[normal](https://example.com)')).toContain(
      '<a href="https://example.com">normal</a>',
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
