import { describe, expect, it } from 'vitest';
import { safeJsonLd } from '~/utils/safeJsonLd';

describe('safeJsonLd', () => {
  it('escapes < so a value containing </script> cannot break out of a JSON-LD element', () => {
    const output = safeJsonLd({
      headline: 'Nice article</script><script>alert(1)',
    });
    expect(output).not.toContain('</script>');
    expect(output).toContain('\\u003c/script\\u003e\\u003cscript\\u003e');
    expect(JSON.parse(output)).toEqual({
      headline: 'Nice article</script><script>alert(1)',
    });
  });

  it('escapes >, &, and the U+2028/U+2029 line terminators', () => {
    const output = safeJsonLd({
      value: 'a>b&c\u2028\u2029',
    });
    expect(output).toContain('\\u003e');
    expect(output).toContain('\\u0026');
    expect(output).toContain('\\u2028');
    expect(output).toContain('\\u2029');
    expect(JSON.parse(output)).toEqual({ value: 'a>b&c\u2028\u2029' });
  });

  it('leaves ordinary JSON untouched aside from the escaped chars', () => {
    const output = safeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'hello',
      name: null,
    });
    expect(JSON.parse(output)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'hello',
      name: null,
    });
  });
});
