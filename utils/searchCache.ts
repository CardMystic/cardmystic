import type { ICardResult } from '~/types/IColbert';

interface CacheEntry {
  results: ICardResult[];
  timestamp: number;
  filters: any;
  endpoint: number;
}

class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for search queries
  private readonly MAX_CACHE_SIZE = 100; // Store more search results

  private generateCacheKey(
    query: string,
    endpoint: number,
    filters: any,
  ): string {
    return `${endpoint}:${query}:${JSON.stringify(filters)}`;
  }

  get(query: string, endpoint: number, filters: any): ICardResult[] | null {
    if (!query) return null;

    const key = this.generateCacheKey(query, endpoint, filters);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      console.log(
        `CACHE EXPIRED: "${query}" (endpoint ${endpoint}) - entry expired, removing from cache`,
      );
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    const ageMinutes = Math.floor((Date.now() - entry.timestamp) / (1000 * 60));
    console.log(
      `CACHE RETRIEVED: "${query}" (endpoint ${endpoint}) - ${entry.results.length} results, age: ${ageMinutes}m`,
    );
    return entry.results;
  }

  set(
    query: string,
    endpoint: number,
    filters: any,
    results: ICardResult[],
  ): void {
    if (!query) return;

    const key = this.generateCacheKey(query, endpoint, filters);

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const [oldEndpoint, oldQuery] = firstKey.split(':');
        console.log(
          `CACHE EVICTED: "${oldQuery}" (endpoint ${oldEndpoint}) - cache full, removing oldest entry`,
        );
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      results: [...results], // Deep copy to prevent mutations
      timestamp: Date.now(),
      filters: JSON.parse(JSON.stringify(filters)), // Deep copy filters
      endpoint,
    });

    console.log(
      `CACHE STORED: "${query}" (endpoint ${endpoint}) - ${results.length} results cached (${this.cache.size}/${this.MAX_CACHE_SIZE} slots used)`,
    );
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`CACHE CLEARED: ${size} entries removed from memory`);
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheInfo(): Array<{
    query: string;
    endpoint: number;
    timestamp: number;
    size: number;
    age: string;
  }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => {
      const [endpoint, query] = key.split(':');
      const ageMinutes = Math.floor(
        (Date.now() - entry.timestamp) / (1000 * 60),
      );
      return {
        query: query.substring(0, 30) + (query.length > 30 ? '...' : ''),
        endpoint: parseInt(endpoint),
        timestamp: entry.timestamp,
        size: entry.results.length,
        age: ageMinutes < 1 ? 'Just now' : `${ageMinutes}m ago`,
      };
    });
  }

  // Get cache stats for debugging
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalResults = entries.reduce(
      (sum, entry) => sum + entry.results.length,
      0,
    );
    const avgResults =
      entries.length > 0 ? Math.round(totalResults / entries.length) : 0;

    return {
      totalQueries: this.cache.size,
      totalResults,
      avgResults,
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.timestamp))
          : null,
    };
  }
}

export const searchCache = new SearchCache();
