import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { gotoHydrated } from './utils/mocks';

/**
 * Phase 9 — Axe accessibility scans (HARD GATE on critical issues).
 *
 * Pages selected to cover the major surface areas:
 *   /                      — homepage (landing + lazy panels)
 *   /search/all/ai         — search landing + tabs + filters
 *   /about                 — static prerendered content
 *   /privacyPolicy         — static prerendered content
 *
 * Gating policy
 * -------------
 * `critical`-impact violations FAIL the suite. These are the most
 * objective and severe issues (e.g. icon-only buttons with no
 * accessible name, form inputs with no label) — they're either
 * outright broken or trivially fixable with an `aria-label`.
 *
 * `serious`-impact violations (predominantly color-contrast on themed
 * brand colors and the rainbow accent text) are surfaced via console
 * output but do NOT fail the build. Fixing them properly requires
 * design-system changes; we surface them so they stay visible and
 * regressions are obvious in CI logs. Tighten the gate when the design
 * system is updated.
 *
 * `minor` and `moderate` violations are informational only.
 *
 * Add new pages to `PAGES` to expand coverage.
 */

const PAGES: Array<{ name: string; path: string }> = [
  { name: 'homepage', path: '/' },
  { name: 'AI search landing', path: '/search/all/ai' },
  { name: 'about', path: '/about' },
  { name: 'privacy policy', path: '/privacyPolicy' },
];

const GATING_IMPACTS = new Set(['critical']);
const SURFACED_IMPACTS = new Set(['serious', 'moderate', 'minor']);

test.describe('Accessibility (Axe)', () => {
  for (const { name, path } of PAGES) {
    test(`${name} (${path}) has no critical Axe violations`, async ({
      page,
    }) => {
      await gotoHydrated(page, path);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter((v) =>
        GATING_IMPACTS.has(v.impact ?? ''),
      );
      const surfaced = results.violations.filter((v) =>
        SURFACED_IMPACTS.has(v.impact ?? ''),
      );

      if (surfaced.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[axe:${name}] ${surfaced.length} non-blocking violations ` +
            `(impact <= serious):\n` +
            surfaced
              .map(
                (v) =>
                  `  - [${v.impact}] ${v.id} ×${v.nodes.length}: ${v.help}`,
              )
              .join('\n'),
        );
      }

      if (blocking.length > 0) {
        // Verbose details so CI logs are actionable without re-running.
        // eslint-disable-next-line no-console
        console.log(
          `[axe:${name}] BLOCKING (critical) violations:\n` +
            blocking
              .map(
                (v) =>
                  `  - [${v.impact}] ${v.id}: ${v.help}\n` +
                  `    ${v.helpUrl}\n` +
                  v.nodes
                    .slice(0, 3)
                    .map((n) => `    target: ${n.target.join(' ')}`)
                    .join('\n'),
              )
              .join('\n\n'),
        );
      }

      expect(blocking, `Axe found ${blocking.length} critical issues`).toEqual(
        [],
      );
    });
  }
});
