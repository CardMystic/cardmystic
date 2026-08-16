import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Any call to `useSupabase()` that runs during SSR constructs
// `@supabase/realtime-js`, which crashes on Node runtimes that don't expose a
// native `WebSocket` (Azure SWA's Nitro function among them). Every call in a
// composable or page must be guarded with `process.server ? null : useSupabase()`.
//
// The whitelist below lists files where the call is provably client-only
// (inside `onMounted`, inside a `.client.ts` plugin, or inside an event
// handler). Add to it only after verifying the call cannot run on the server.
const CLIENT_ONLY_WHITELIST = new Set<string>([
  'pages/user/reset-password.vue', // wrapped in onMounted
  'plugins/auth.client.ts', // .client.ts plugin, never runs on server
]);

const GUARD_PATTERN = /process\.server\s*\?\s*null\s*:\s*useSupabase\(\)/;
const CALL_PATTERN = /\buseSupabase\(\)/;

const repoRoot = resolve(fileURLToPath(import.meta.url), '../../..');

function collectFiles(): string[] {
  const roots = [
    { dir: 'composables', ext: /\.ts$/ },
    { dir: 'pages', ext: /\.vue$/ },
    { dir: 'plugins', ext: /\.ts$/ },
  ];
  const out: string[] = [];
  for (const { dir, ext } of roots) {
    const entries = readdirSync(resolve(repoRoot, dir), {
      recursive: true,
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (!entry.isFile() || !ext.test(entry.name)) continue;
      out.push(resolve(entry.parentPath ?? entry.path, entry.name));
    }
  }
  return out;
}

function findViolations(): string[] {
  const violations: string[] = [];

  for (const filePath of collectFiles()) {
    const rel = relative(repoRoot, filePath);
    if (CLIENT_ONLY_WHITELIST.has(rel)) continue;

    const source = readFileSync(filePath, 'utf8');
    const lines = source.split('\n');

    lines.forEach((line, i) => {
      if (!CALL_PATTERN.test(line)) return;
      if (GUARD_PATTERN.test(line)) return;
      violations.push(`${rel}:${i + 1}  ${line.trim()}`);
    });
  }

  return violations;
}

describe('useSupabase() SSR guard', () => {
  it('every call in composables and pages is guarded with process.server', () => {
    const violations = findViolations();
    expect(
      violations,
      violations.length
        ? [
            'Unguarded useSupabase() call detected. Wrap with',
            '  process.server ? null : useSupabase()',
            'or add the file to CLIENT_ONLY_WHITELIST if the call is provably client-only.',
            '',
            ...violations,
          ].join('\n')
        : undefined,
    ).toEqual([]);
  });

  it('whitelisted files still exist and still reference useSupabase()', () => {
    for (const rel of CLIENT_ONLY_WHITELIST) {
      const source = readFileSync(resolve(repoRoot, rel), 'utf8');
      expect(
        CALL_PATTERN.test(source),
        `${rel} is whitelisted but no longer calls useSupabase() — remove it from the list.`,
      ).toBe(true);
    }
  });
});
