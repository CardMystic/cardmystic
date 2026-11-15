import { describe, expect, it } from 'vitest';
import { parseColoredMarkdown } from '../../utils/markdownTextColor';
import { sanitizeMarkdownHtml } from '../../utils/sanitizeMarkdown';
import { restorePrimerDeckEmbeds } from '../../utils/primerDeckEmbeds';

const render = (source: string, primer = true) =>
  restorePrimerDeckEmbeds(
    sanitizeMarkdownHtml(parseColoredMarkdown(source, primer)),
  );

describe('primer deck blocks', () => {
  it('renders supported blocks only in primer mode, including inside details', () => {
    const source =
      '<details open>\n<summary>Stats</summary>\n\n@[deck](mana-curve)\n\n@[deck](color-chart)\n\n@[deck](deck-stats)\n\n</details>';
    const html = render(source);
    expect(html).toContain('data-primer-deck="mana-curve"');
    expect(html).toContain('data-primer-deck="color-chart"');
    expect(html).toContain('data-primer-deck="deck-stats"');
    expect(render(source, false)).not.toContain('data-primer-deck');
  });
  it('leaves code examples and unsupported blocks inert', () => {
    const html = render(
      '`@[deck](mana-curve)`\n\n```\n@[deck](color-chart)\n```\n\n@[deck](other)',
    );
    expect(html).not.toContain('data-primer-deck');
    expect(html).toContain('@[deck](mana-curve)');
  });
});
