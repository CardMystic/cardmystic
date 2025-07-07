// import { defineStore } from 'pinia';
// import { ref } from 'vue';
// import type { Card } from "~/models/cardModel";
// import type { CardSearchFilters } from "~/models/searchModel";
// import { useCacheStore } from './cacheStore';

// export const useSearchStore = defineStore('search', () => {
//   const query = ref('');
//   const results: Ref<Card[]> = ref<Card[]>([]);
//   const loading = ref(false);

//   // Filters
//   const filters: Ref<CardSearchFilters> = ref({
//     selectedCardTypes: [],
//     selectedColorFilterOption: 'Contains At Most',
//     selectedColors: {
//       Red: true,
//       Blue: true,
//       Green: true,
//       White: true,
//       Black: true,
//     },
//     selectedRarities: {
//       Common: false,
//       Uncommon: false,
//       Rare: false,
//       Mythic: false,
//     },
//     selectedCMCOption: 'Equal To',
//     selectedPowerOption: 'Equal To',
//     selectedToughnessOption: 'Equal To',
//     selectedCMC: '',
//     selectedPower: '',
//     selectedToughness: '',
//     selectedCardFormats: [],
//   });

//   const endpoints = [
//     {
//       name: 'A.I.',
//       tooltip: 'Search by Meaning using AI',
//       url: '/search/colbert',
//     },
//     {
//       name: 'Similar Search',
//       tooltip: 'Search For Similar Cards',
//       url: '/search/similarity',
//     },
//   ];

//   // Set selectedChipIndex to 0 (AI search) by default
//   const selectedChipIndex = ref(0);

//   // Add a flag to track if results came from cache
//   const lastResultsFromCache = ref(false);

//   // Add a reactive property to trigger cache indicator - initialize to avoid hydration mismatch
//   const cacheHitTriggered = ref(0);

//   // Add a trigger for when queries are cached
//   const queryCachedTriggered = ref(0);

//   function clearFilters() {
//     // Reset all filters to their default values
//     filters.value = {
//       selectedCardTypes: [],
//       selectedColorFilterOption: 'Contains At Most',
//       selectedColors: {
//         Red: true,
//         Blue: true,
//         Green: true,
//         White: true,
//         Black: true,
//       },
//       selectedRarities: {
//         Common: false,
//         Uncommon: false,
//         Rare: false,
//         Mythic: false,
//       },
//       selectedCMCOption: 'Equal To',
//       selectedPowerOption: 'Equal To',
//       selectedToughnessOption: 'Equal To',
//       selectedCMC: '',
//       selectedPower: '',
//       selectedToughness: '',
//       selectedCardFormats: [],
//     };
//     // Don't reset selectedChipIndex when clearing filters
//   }

//   async function search(endpointIndex: number) {
//     if (!query.value) {
//       results.value = [];
//       return;
//     }

//     loading.value = true;
//     const cacheStore = useCacheStore();

//     const endpoint = endpoints[endpointIndex];
//     if (!endpoint) {
//       loading.value = false;
//       throw new Error('Invalid endpoint index');
//     }

//     // Check cache first for text-based searches
//     const cachedResults = cacheStore.get(
//       query.value,
//       endpointIndex,
//       filters.value,
//     );
//     if (cachedResults) {
//       console.log(
//         `CACHE HIT: "${query.value}" (${endpoint.name}) - ${cachedResults.length} results served from memory`,
//       );
//       results.value = cachedResults;
//       // Increment cache hit counter to trigger indicator
//       cacheHitTriggered.value++;
//       loading.value = false;
//       return;
//     }

//     console.log(
//       `SERVER REQUEST: "${query.value}" (${endpoint.name}) - fetching from server...`,
//     );

//     try {
//       let body: any;

//       // Different body format for similarity search vs other searches
//       if (endpointIndex === 1) {
//         // Similar Search
//         body = {
//           card_name: query.value,
//           limit: 80,
//           filters: filters.value,
//           exclude_card_data: false,
//         };
//       } else {
//         // A.I. Search
//         body = {
//           query: query.value,
//           limit: 80,
//           filters: filters.value,
//           exclude_card_data: false,
//         };
//       }

//       console.log(`SEARCH BODY: ${JSON.stringify(body)}`);

//       const response = await fetch(`/api/proxy${endpoint.url}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(body),
//       });

//       if (!response.ok) {
//         loading.value = false;
//         throw new Error(`Search failed: ${response.statusText}`);
//       }

//       const data = await response.json();
//       results.value = data || [];

//       // Cache the results for text-based searches
//       if (query.value && results.value.length > 0) {
//         console.log(
//           `CACHED: "${query.value}" (${endpoint.name}) - ${results.value.length} results stored in memory`,
//         );
//         cacheStore.set(
//           query.value,
//           endpointIndex,
//           filters.value,
//           results.value,
//         );
//         // Trigger the "Query Cached" indicator
//         queryCachedTriggered.value++;
//       } else if (results.value.length === 0) {
//         console.log(
//           `NO RESULTS: "${query.value}" (${endpoint.name}) - query returned no results`,
//         );
//       }
//     } catch (error) {
//       console.error(
//         `SEARCH ERROR: "${query.value}" (${endpoint.name}) -`,
//         error,
//       );
//       results.value = [];
//       throw error;
//     } finally {
//       loading.value = false;
//     }
//   }

//   function clearCache() {
//     const cacheStore = useCacheStore();
//     cacheStore.clear();
//   }

//   function getCacheInfo() {
//     const cacheStore = useCacheStore();
//     return {
//       size: cacheStore.cacheSize,
//       entries: cacheStore.cacheEntries,
//       stats: cacheStore.cacheStats,
//     };
//   }

//   function findSimilarCards(cardName: string) {
//     // Clear filters for clean similarity search
//     clearFilters();

//     // Set the query to the card name
//     query.value = cardName;

//     // Set to Similar Search endpoint (index 1)
//     selectedChipIndex.value = 1;

//     return {
//       q: cardName,
//       endpoint: 1,
//       filters: JSON.stringify(filters.value),
//     };
//   }

//   return {
//     clearFilters,
//     search,
//     endpoints,
//     query,
//     results,
//     loading,
//     filters,
//     selectedChipIndex,
//     clearCache,
//     getCacheInfo,
//     lastResultsFromCache,
//     cacheHitTriggered,
//     queryCachedTriggered,
//     findSimilarCards,
//   };
// });
