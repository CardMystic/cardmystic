import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, test } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

/**
 * Phase 9 — Lighthouse performance/SEO/best-practices/PWA scans.
 *
 * Lighthouse is **informational only**: scores are written to
 * `lighthouse-report/` for CI artifact upload but never fail the
 * suite. The user's stated policy: "I dont want lighthouse giving any
 * hard gates for e2e success, just run the tests and display the
 * results somewhere."
 *
 * Implementation notes:
 *   - playwright-lighthouse needs Chromium launched with a fixed
 *     `--remote-debugging-port` flag, so we spin up our own browser
 *     here instead of using Playwright's default fixture.
 *   - We run sequentially (one page at a time) — Lighthouse is heavy
 *     and concurrent runs interfere with each other's measurements.
 *   - Thresholds are set to 0 (so the audit never fails); use the
 *     emitted JSON/HTML reports to track scores over time.
 */

const PORT = 9222;

const PAGES: Array<{ name: string; path: string }> = [
  { name: 'homepage', path: '/' },
  { name: 'ai-search-landing', path: '/search/all/ai' },
  { name: 'about', path: '/about' },
];

const REPORT_DIR = join(process.cwd(), 'lighthouse-report');
if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });

test.describe('Lighthouse (informational)', () => {
  // Lighthouse runs are slow; allow up to 3 minutes per page.
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  for (const { name, path } of PAGES) {
    test(`audits ${name} (${path})`, async ({ baseURL }) => {
      const browser = await chromium.launch({
        args: [`--remote-debugging-port=${PORT}`],
      });
      try {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const url = new URL(
          path,
          baseURL ?? 'http://localhost:5173',
        ).toString();
        await page.goto(url, { waitUntil: 'networkidle' });

        const result = await playAudit({
          page,
          port: PORT,
          // Set thresholds to 0 so the audit reports but never fails.
          thresholds: {
            performance: 0,
            accessibility: 0,
            'best-practices': 0,
            seo: 0,
          },
          reports: {
            formats: { html: true, json: true },
            name: `lighthouse-${name}`,
            directory: REPORT_DIR,
          },
        });

        // Surface scores in CI logs alongside the saved reports.
        const scores: Record<string, number | null> = {};
        for (const [k, v] of Object.entries(result.lhr.categories)) {
          scores[k] = v.score === null ? null : Math.round(v.score * 100);
        }
        // eslint-disable-next-line no-console
        console.log(
          `[lighthouse:${name}] ${JSON.stringify(scores)} ` +
            `→ ${REPORT_DIR}/lighthouse-${name}.{html,json}`,
        );

        // Persist a tiny summary file too — easier to scan in CI than
        // the full HTML report.
        writeFileSync(
          join(REPORT_DIR, `lighthouse-${name}-summary.json`),
          JSON.stringify({ url, scores }, null, 2),
        );
      } finally {
        await browser.close();
      }
    });
  }
});
