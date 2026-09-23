import { writeFile } from 'node:fs/promises';

const source = 'https://api.cardmystic.com/bulkdata/card-oracle-ids.min.json';
const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
if (!response.ok)
  throw new Error(`Card ID download failed: HTTP ${response.status}`);

const ids = await response.json();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
if (
  !Array.isArray(ids) ||
  ids.length < 10_000 ||
  ids.some((id) => typeof id !== 'string' || !uuid.test(id)) ||
  new Set(ids).size !== ids.length
) {
  throw new Error(
    'Invalid or incomplete oracle ID feed; sitemap data was not changed',
  );
}

// Catch accidentally downloading the printing-ID feed: both feeds contain UUIDs.
if (
  !ids.includes('1de1b591-a73f-4974-b507-8c63e07a0868') ||
  ids.includes('726e8b29-13e9-4138-b6a9-d2a0d8188d1c')
) {
  throw new Error(
    "Expected oracle IDs, including Thassa's Oracle, not printing IDs",
  );
}

await writeFile(
  new URL('../public/card-oracle-ids.min.json', import.meta.url),
  JSON.stringify(ids.sort(), null, 2) + '\n',
);
console.log(
  `Updated sitemap data with ${ids.length} oracle IDs from ${source}`,
);
