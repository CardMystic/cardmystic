import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SitemapDataCache } from '~/server/utils/sitemapDataCache';
import { parseSitemapData } from '~/utils/sitemapData';
import { updateSitemapData } from '../../scripts/update-sitemap-data.mjs';

const data = {
  version: 1,
  oracleIds: [
    ...Array.from(
      { length: 10_000 },
      (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    ),
    '1de1b591-a73f-4974-b507-8c63e07a0868',
  ],
  collectionPaths: ['/sets/lea', '/themes/artifacts', '/roles/ramp'],
};
const updated = {
  ...data,
  collectionPaths: [...data.collectionPaths, '/sets/new'],
};
const DAY = 86_400_000;
const directories: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('sitemap runtime data', () => {
  it('serves the build copy during an outage, coalesces requests, and refreshes after a day', async () => {
    let now = 0;
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(Response.json(updated));
    const cache = new SitemapDataCache(
      async () => data,
      'https://hf.test/data.json',
      request,
      () => now,
      vi.fn(),
    );
    const responses = await Promise.all([
      cache.get(),
      cache.get(),
      cache.get(),
    ]);
    expect(responses).toEqual([data, data, data]);
    expect(request).toHaveBeenCalledTimes(1);
    now = DAY - 1;
    expect(await cache.get()).toEqual(data);
    expect(request).toHaveBeenCalledTimes(1);
    now = DAY;
    expect(await cache.get()).toEqual(updated);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('keeps the latest valid download on invalid responses and handles unchanged ETags', async () => {
    let now = 0;
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(updated, { headers: { etag: '"v2"' } }),
      )
      .mockResolvedValueOnce(Response.json({ ...data, collectionPaths: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const cache = new SitemapDataCache(
      async () => data,
      'https://hf.test/data.json',
      request,
      () => now,
      vi.fn(),
    );
    expect(await cache.get()).toEqual(updated);
    now += DAY;
    expect(await cache.get()).toEqual(updated);
    now += DAY;
    expect(await cache.get()).toEqual(updated);
    expect(request.mock.calls[2][1]?.headers).toEqual({
      'If-None-Match': '"v2"',
    });
  });

  it('rejects printing IDs and unsafe paths before exposing URLs in XML', () => {
    expect(() =>
      parseSitemapData({
        ...data,
        oracleIds: [...data.oracleIds, '726e8b29-13e9-4138-b6a9-d2a0d8188d1c'],
      }),
    ).toThrow();
    expect(() =>
      parseSitemapData({
        ...data,
        collectionPaths: [...data.collectionPaths, '/sets/<bad>'],
      }),
    ).toThrow();
    expect(() =>
      parseSitemapData({ ...data, oracleIds: data.oracleIds.slice(0, 10) }),
    ).toThrow();
  });
});

describe('sitemap build fallback', () => {
  it('validates before replacing the saved file and retains it on download failure', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sitemap-test-'));
    directories.push(dir);
    const output = join(dir, 'data.json');
    await writeFile(output, JSON.stringify(data));
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(updated))
      .mockResolvedValueOnce(
        Response.json({ version: 1, oracleIds: [], collectionPaths: [] }),
      );
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await updateSitemapData({ output, request });
    await updateSitemapData({ output, request });
    expect(JSON.parse(await readFile(output, 'utf8'))).toEqual(updated);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('fails a fresh build clearly when neither HF nor a valid cached file is available', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sitemap-test-'));
    directories.push(dir);
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      updateSitemapData({ output: join(dir, 'data.json'), request }),
    ).rejects.toThrow('No valid sitemap fallback');
  });
});
