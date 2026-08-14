/**
 * Serializes a value as JSON safe to embed inside an HTML <script> element
 * (typically `application/ld+json`).
 *
 * `JSON.stringify` leaves `<`, `>`, `&`, and the U+2028 / U+2029 line
 * terminators untouched. When any of those come from user-controlled fields
 * (article titles, deck descriptions, usernames, etc.) an attacker can embed
 * a literal `</script>` to break out of the JSON-LD element and inject
 * arbitrary markup during SSR. Escaping the offending characters keeps the
 * output byte-for-byte valid JSON while preventing that escape.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (c) =>
      ({
        '<': '\\u003c',
        '>': '\\u003e',
        '&': '\\u0026',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
      })[c] as string,
  );
}
