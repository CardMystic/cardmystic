import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize the HTML produced by marked with the same policy during SSR and
 * browser preview. Custom card / YouTube tokens are restored after this step.
 */
export function sanitizeMarkdownHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'del',
      'details',
      'summary',
      'img',
      'input',
    ],
    allowedAttributes: {
      '*': ['class', 'title', 'style'],
      a: ['href'],
      img: ['src', 'alt', { name: 'loading', values: ['lazy', 'eager'] }],
      details: ['open'],
      ol: ['start'],
      th: [{ name: 'align', values: ['left', 'center', 'right'] }],
      td: [{ name: 'align', values: ['left', 'center', 'right'] }],
      input: [{ name: 'type', values: ['checkbox'] }, 'checked', 'disabled'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto'],
      img: ['http', 'https'],
    },
    allowProtocolRelative: false,
    // Raw embeds are not a supported shortcut around the validated YouTube
    // token renderer. Also discard foreign/raw-text containers completely.
    nonTextTags: [
      'script',
      'style',
      'textarea',
      'option',
      'xmp',
      'iframe',
      'object',
      'embed',
      'noscript',
      'template',
      'svg',
      'math',
    ],
    // Only text color is author-controlled; positioning, URLs and other CSS
    // stay disallowed. Use the same policy for previews and public SSR.
    allowedStyles: {
      '*': { color: [/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i, /^[a-z]+$/i] },
    },
    parseStyleAttributes: true,
    nestingLimit: 100,
    // marked emits disabled inputs for task lists. Preserve their appearance
    // without admitting interactive form controls from authored HTML.
    transformTags: {
      input: (tagName, attributes) => ({
        tagName,
        attribs: {
          ...attributes,
          type: attributes.type?.toLowerCase() ?? '',
          disabled: '',
        },
      }),
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'input' && frame.attribs.type !== 'checkbox',
  });
}
