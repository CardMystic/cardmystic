import {
  parseSitemapData,
  readSitemapResponse,
  type SitemapData,
} from '../../utils/sitemapData';

const DAY = 24 * 60 * 60 * 1000;

/** One refresh per day per server instance, including after failed downloads. */
export class SitemapDataCache {
  private current?: SitemapData;
  private nextCheck = 0;
  private pending?: Promise<SitemapData>;
  private etag?: string;

  constructor(
    private fallback: () => Promise<unknown>,
    private url: string,
    private request: typeof fetch = fetch,
    private now = Date.now,
    private warn = () =>
      console.warn('Sitemap refresh failed; serving the last valid copy.'),
  ) {}

  async get(): Promise<SitemapData> {
    if (this.pending) return this.pending;
    if (this.current && this.now() < this.nextCheck) return this.current;
    this.pending = this.refresh();
    try {
      return await this.pending;
    } finally {
      this.pending = undefined;
    }
  }

  private async refresh(): Promise<SitemapData> {
    if (!this.current) this.current = parseSitemapData(await this.fallback());
    try {
      const response = await this.request(this.url, {
        headers: this.etag ? { 'If-None-Match': this.etag } : {},
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status !== 304) {
        const data = await readSitemapResponse(response);
        this.current = data;
        this.etag = response.headers.get('etag') ?? undefined;
      }
    } catch {
      this.warn();
    }
    this.nextCheck = this.now() + DAY;
    return this.current;
  }
}
