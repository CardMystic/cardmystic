// import { defineStore } from 'pinia';
// import { ref, computed } from 'vue';
// import type { Card } from '~/models/cardModel';

// interface CacheEntry {
//   results: Card[];
//   timestamp: number;
//   filters: any;
//   endpoint: number;
// }

// export const useCacheStore = defineStore('cache', () => {
//   const cache = ref(new Map<string, CacheEntry>());
//   const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
//   const MAX_CACHE_SIZE = 100;

//   // Reactive computed properties
//   const cacheSize = computed(() => cache.value.size);

//   const cacheEntries = computed(() => {
//     return Array.from(cache.value.entries()).map(([key, entry]) => {
//       const [endpoint, query] = key.split(':');
//       const ageMinutes = Math.floor(
//         (Date.now() - entry.timestamp) / (1000 * 60),
//       );
//       return {
//         query: query.substring(0, 30) + (query.length > 30 ? '...' : ''),
//         endpoint: parseInt(endpoint),
//         timestamp: entry.timestamp,
//         size: entry.results.length,
//         age: ageMinutes < 1 ? 'Just now' : `${ageMinutes}m ago`,
//       };
//     });
//   });

//   const cacheStats = computed(() => {
//     const entries = Array.from(cache.value.values());
//     const totalResults = entries.reduce(
//       (sum, entry) => sum + entry.results.length,
//       0,
//     );
//     const avgResults =
//       entries.length > 0 ? Math.round(totalResults / entries.length) : 0;

//     return {
//       totalQueries: cache.value.size,
//       totalResults,
//       avgResults,
//       oldestEntry:
//         entries.length > 0
//           ? Math.min(...entries.map((e) => e.timestamp))
//           : null,
//     };
//   });

//   function generateCacheKey(
//     query: string,
//     endpoint: number,
//     filters: any,
//   ): string {
//     return `${endpoint}:${query}:${JSON.stringify(filters)}`;
//   }

//   function get(
//     query: string,
//     endpoint: number,
//     filters: any,
//   ): Card[] | null {
//     if (!query) return null;

//     const key = generateCacheKey(query, endpoint, filters);
//     const entry = cache.value.get(key);

//     if (!entry) {
//       return null;
//     }

//     // Check if cache entry is still valid
//     if (Date.now() - entry.timestamp > CACHE_DURATION) {
//       console.log(
//         `CACHE EXPIRED: "${query}" (endpoint ${endpoint}) - entry expired, removing from cache`,
//       );
//       cache.value.delete(key);
//       // Trigger reactivity
//       cache.value = new Map(cache.value);
//       return null;
//     }

//     // Move to end (LRU) - create new map to trigger reactivity
//     const newCache = new Map(cache.value);
//     newCache.delete(key);
//     newCache.set(key, entry);
//     cache.value = newCache;

//     const ageMinutes = Math.floor((Date.now() - entry.timestamp) / (1000 * 60));
//     console.log(
//       `CACHE RETRIEVED: "${query}" (endpoint ${endpoint}) - ${entry.results.length} results, age: ${ageMinutes}m`,
//     );

//     return entry.results;
//   }

//   function set(
//     query: string,
//     endpoint: number,
//     filters: any,
//     results: Card[],
//   ): void {
//     if (!query) return;

//     const key = generateCacheKey(query, endpoint, filters);
//     const newCache = new Map(cache.value);

//     // Remove oldest entries if cache is full
//     if (newCache.size >= MAX_CACHE_SIZE) {
//       const firstKey = newCache.keys().next().value;
//       if (firstKey) {
//         const [oldEndpoint, oldQuery] = firstKey.split(':');
//         console.log(
//           `CACHE EVICTED: "${oldQuery}" (endpoint ${oldEndpoint}) - cache full, removing oldest entry`,
//         );
//         newCache.delete(firstKey);
//       }
//     }

//     newCache.set(key, {
//       results: [...results], // Deep copy to prevent mutations
//       timestamp: Date.now(),
//       filters: JSON.parse(JSON.stringify(filters)), // Deep copy filters
//       endpoint,
//     });

//     cache.value = newCache;

//     console.log(
//       `CACHE STORED: "${query}" (endpoint ${endpoint}) - ${results.length} results cached (${cache.value.size}/${MAX_CACHE_SIZE} slots used)`,
//     );
//   }

//   function clear(): void {
//     const size = cache.value.size;
//     cache.value = new Map();
//     console.log(`CACHE CLEARED: ${size} entries removed from memory`);
//   }

//   return {
//     cache: computed(() => cache.value),
//     cacheSize,
//     cacheEntries,
//     cacheStats,
//     get,
//     set,
//     clear,
//   };
// });
