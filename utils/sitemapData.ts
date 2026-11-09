export const DEFAULT_SITEMAP_DATA_URL =
  'https://huggingface.co/datasets/cardmystic/sitemap/resolve/main/sitemap-data.json';

export interface SitemapData {
  version: 1;
  oracleIds: string[];
  collectionPaths: string[];
}

export function parseSitemapData(value: unknown): SitemapData {
  if (!value || typeof value !== 'object')
    throw new Error('Missing sitemap data');
  const data = value as Record<string, unknown>;
  const ids = data.oracleIds;
  const paths = data.collectionPaths;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (
    data.version !== 1 ||
    !Array.isArray(ids) ||
    ids.length < 10_000 ||
    ids.length > 100_000 ||
    ids.some((id) => typeof id !== 'string' || !uuid.test(id)) ||
    new Set(ids).size !== ids.length ||
    !ids.includes('1de1b591-a73f-4974-b507-8c63e07a0868') ||
    ids.includes('726e8b29-13e9-4138-b6a9-d2a0d8188d1c') ||
    !Array.isArray(paths) ||
    paths.length > 20_000 ||
    paths.some(
      (path) =>
        typeof path !== 'string' ||
        !/^\/(sets|themes|roles)\/[a-z0-9-]{1,100}$/.test(path),
    ) ||
    new Set(paths).size !== paths.length ||
    ['sets', 'themes', 'roles'].some(
      (kind) => !paths.some((path) => path.startsWith(`/${kind}/`)),
    )
  )
    throw new Error('Invalid or incomplete sitemap data');
  return { version: 1, oracleIds: ids, collectionPaths: paths };
}

export async function readSitemapResponse(
  response: Response,
): Promise<SitemapData> {
  if (!response.ok)
    throw new Error(`Sitemap download failed (${response.status})`);
  const text = await response.text();
  if (text.length > 6_000_000) throw new Error('Sitemap data is too large');
  return parseSitemapData(JSON.parse(text));
}
