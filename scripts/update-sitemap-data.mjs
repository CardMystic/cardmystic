import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DEFAULT_SITEMAP_DATA_URL,
  parseSitemapData,
  readSitemapResponse,
} from '../utils/sitemapData.ts';

export async function updateSitemapData({
  url = process.env.NUXT_SITEMAP_DATA_URL || DEFAULT_SITEMAP_DATA_URL,
  output = fileURLToPath(
    new URL('../.cache/sitemap/data.json', import.meta.url),
  ),
  request = fetch,
} = {}) {
  try {
    const response = await request(url, {
      signal: AbortSignal.timeout(30_000),
    });
    const data = await readSitemapResponse(response);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(`${output}.tmp`, JSON.stringify(data));
    await rename(`${output}.tmp`, output);
    console.log(
      `Prepared sitemap fallback: ${data.oracleIds.length} cards, ${data.collectionPaths.length} collections.`,
    );
  } catch {
    // Never turn a transient HF outage into an empty sitemap or a bad deploy.
    try {
      parseSitemapData(JSON.parse(await readFile(output, 'utf8')));
    } catch {
      throw new Error(
        'No valid sitemap fallback. Publish sitemap-data.json to the public HF dataset before building the frontend.',
      );
    }
    console.warn(
      'Sitemap refresh failed; using the last validated build copy.',
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await updateSitemapData();
}
