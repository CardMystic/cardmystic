import { expect, it } from 'vitest';
import { parseColoredMarkdown } from '~/utils/markdownTextColor';

const card = 'CARDIMGTOKEN0CARDIMGTOKEN';
const otherCard = 'CARDIMGTOKEN1CARDIMGTOKEN';

it.each([' ', '\n'])(
  'separates embedded cards from prose with %j spacing',
  (space) => {
    const html = parseColoredMarkdown(`Before.${space}${card}\nAfter.`);
    expect(html.replace(/ +<\/p>/g, '</p>')).toBe(
      `<p>Before.</p>\n<p>${card}</p>\n<p>After.</p>\n`,
    );
  },
);

it('keeps adjacent cards together inside a collapsible primer section', () => {
  const html = parseColoredMarkdown(
    `<details>\n<summary>Cards</summary>\n\nBefore.\n${card} ${otherCard}\nAfter.\n\n</details>`,
    true,
  );
  expect(html).toContain(`<p>${card} ${otherCard}</p>`);
  expect(html).toContain('<p>Before.</p>');
  expect(html).toContain('<p>After.</p>');
});

it('does not split code blocks or inline code into card rows', () => {
  const html = parseColoredMarkdown('```\n' + card + '\n```\n\n`' + card + '`');
  expect(html).toContain(`<pre><code>${card}\n</code></pre>`);
  expect(html).toContain(`<p><code>${card}</code></p>`);
});
