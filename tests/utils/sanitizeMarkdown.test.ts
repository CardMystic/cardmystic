import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import { sanitizeMarkdownHtml } from '~/utils/sanitizeMarkdown';

describe('sanitizeMarkdownHtml', () => {
  it('runs without a browser or a DOM shim', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(
      sanitizeMarkdownHtml('<p>Server-rendered <strong>text</strong></p>'),
    ).toBe('<p>Server-rendered <strong>text</strong></p>');
  });

  it('preserves standard markdown, aligned tables, and collapsible sections', () => {
    const source = [
      '# Strategy',
      '',
      '> Cast **spells**, then *attack*. ~~Outdated plan~~.',
      '',
      '3. First choice',
      '4. Second choice',
      '',
      '| Card | Role |',
      '| :--- | ---: |',
      '| Bolt | Removal |',
      '',
      '<details open><summary>Plan</summary><p>Keep <code>{R}</code>.</p></details>',
    ].join('\n');
    const output = sanitizeMarkdownHtml(marked.parse(source, { async: false }));
    expect(output).toContain('<h1>Strategy</h1>');
    expect(output).toContain('<blockquote>');
    expect(output).toContain('<strong>spells</strong>');
    expect(output).toContain('<em>attack</em>');
    expect(output).toContain('<del>Outdated plan</del>');
    expect(output).toContain('<ol start="3">');
    expect(output).toContain('<th align="left">Card</th>');
    expect(output).toContain('<td align="right">Removal</td>');
    expect(output).toContain('<details open><summary>Plan</summary>');
    expect(output).toContain('<code>{R}</code>');
  });

  it('preserves classes, titles, lazy images, and literal escaped code', () => {
    const output = sanitizeMarkdownHtml(
      '<p class="lead" title="A &amp; B"><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></p>' +
        '<img src="/card.webp" alt="A &amp; B" loading="lazy">',
    );
    expect(output).toContain('<p class="lead" title="A &amp; B">');
    expect(output).toContain(
      '<code>&lt;script&gt;alert(1)&lt;/script&gt;</code>',
    );
    expect(output).toContain(
      '<img src="/card.webp" alt="A &amp; B" loading="lazy"',
    );
  });

  it.each([
    'https://example.com/card?q=draw&amp;type=instant',
    'http://example.com/card',
    'mailto:author@example.com',
    '/card/4457ed35-7c10-48c8-9776-456485fdf070',
    '../articles',
    '#mulligans',
  ])('preserves safe links: %s', (href) => {
    expect(sanitizeMarkdownHtml(`<a href="${href}">Card</a>`)).toBe(
      `<a href="${href}">Card</a>`,
    );
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java&#x73;cript:alert(1)',
    'java&#000000115;cript:alert(1)',
    'java&#x09;script:alert(1)',
    'java&#x0a;script:alert(1)',
    'java\u0000script:alert(1)',
    'data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://example.com/file',
    '//example.com/card',
  ])('removes unsafe or unsupported link schemes: %s', (href) => {
    expect(sanitizeMarkdownHtml(`<a href="${href}">Card</a>`)).toBe(
      '<a>Card</a>',
    );
  });

  it.each([
    'javascript:alert(1)',
    'java&#x09;script:alert(1)',
    'data:image/svg+xml,&lt;svg onload=alert(1)&gt;',
    'mailto:author@example.com',
    '//example.com/card.png',
  ])('removes unsafe image sources: %s', (src) => {
    const output = sanitizeMarkdownHtml(`<img src="${src}" alt="Card">`);
    expect(output).not.toContain('src=');
    expect(output).toContain('alt="Card"');
  });

  it('removes event handlers, inline styles, form attributes, and DOM-clobbering names', () => {
    const output = sanitizeMarkdownHtml(
      '<p onclick="alert(1)" style="position:fixed" id="__nuxt" name="attributes">Text</p>' +
        '<img src="/card.png" onerror="alert(1)" srcset="javascript:alert(1) 2x">' +
        '<a href="/safe" target="_blank" ping="https://tracker.test">Link</a>',
    );
    expect(output).toBe(
      '<p>Text</p><img src="/card.png" /><a href="/safe">Link</a>',
    );
  });

  it('discards scripts, styles, raw embeds, and foreign markup without executing or preserving their bodies', () => {
    const output = sanitizeMarkdownHtml(
      '<script>alert(1)</script><style>body{display:none}</style>' +
        '<iframe src="https://www.youtube.com/embed/abcdefghijk" srcdoc="<script>alert(1)</script>">Iframe text</iframe>' +
        '<object data="https://example.com">Object text</object>' +
        '<svg><a href="javascript:alert(1)">SVG text</a></svg>' +
        '<math><mtext>Math text</mtext></math><p>Safe</p>',
    );
    expect(output).toBe('<p>Safe</p>');
  });

  it.each([
    '<svg><textarea><img src=x onerror=alert(1)></textarea></svg>',
    '<math><mtext><textarea></textarea/><img src=x onerror=alert(1)></mtext></math>',
    '<textarea></textarea/><img src=x onerror=alert(1)>',
    '<xmp></xmp/><img src=x onerror=alert(1)>',
    '<svg><animate attributeName="href" values="javascript:alert(1)" /></svg>',
  ])('does not admit mutation-XSS markup: %s', (html) => {
    const output = sanitizeMarkdownHtml(html);
    expect(output).not.toMatch(/<(?:svg|math|textarea|xmp|script|animate)\b/i);
    expect(output).not.toMatch(/onerror|javascript:/i);
    expect(sanitizeMarkdownHtml(output)).toBe(output);
  });

  it('retains checked and unchecked markdown tasks as disabled checkboxes', () => {
    const output = sanitizeMarkdownHtml(
      marked.parse('- [x] Add removal\n- [ ] Add lands', { async: false }),
    );
    expect(output.match(/<input\b/g)).toHaveLength(2);
    expect(output.match(/\bdisabled(?:\s|\/>)/g)).toHaveLength(2);
    expect(output.match(/\bchecked(?:\s|\/>)/g)).toHaveLength(1);
    expect(output.match(/type="checkbox"/g)).toHaveLength(2);
    expect(output).toContain('Add removal');
    expect(output).toContain('Add lands');
  });

  it('disables authored checkboxes and strips other form controls', () => {
    const output = sanitizeMarkdownHtml(
      '<form action="https://attacker.test"><input type="text" name="password">' +
        '<input type="CHECKBOX" checked onclick="alert(1)">' +
        '<button formaction="https://attacker.test">Submit</button></form>',
    );
    expect(output).toContain('type="checkbox"');
    expect(output).toContain('disabled');
    expect(output).not.toMatch(
      /<form|<button|type="text"|onclick|action=|name=/,
    );
  });

  it('keeps card and validated-embed placeholders unchanged for the later rendering stage', () => {
    const html =
      '<p>CARDLINKTOKEN0CARDLINKTOKEN CARDIMGTOKEN1CARDIMGTOKEN YTEMBEDTOKEN2YTEMBEDTOKEN</p>';
    expect(sanitizeMarkdownHtml(html)).toBe(html);
  });
});
