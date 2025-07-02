<template>
  <navbar></navbar>
  <v-container class="fill-height d-flex align-start justify-center pt-0">
    <v-col justify="center" align="center" class="col-container pt-4">
      <!-- Basic Search Component -->
      <BasicSearch
        ref="basicSearchRef"
        max-width="705px"
        :is-home-page="false"
        :searching="searching"
        @search="search"
      />

      <!-- Results -->
      <div style="max-width: 1072px" class="mt-6">
        <template v-if="searchStore.results.length > 0">
          <v-row>
            <v-col
              class="px-0 py-0 flex-grow-1 mb-2"
              v-for="result in searchStore.results"
              :key="result.card_data.id"
            >
              <!-- TODO: use http GET and query params to go to cardDetails page -->
              <card
                :card="result"
                @click="
                  router.push({
                    name: 'cardDetails',
                    query: { id: result.card_data.id },
                  })
                "
              />
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <div class="no-results-container">
            <v-btn to="/" class="mt-4" color="primary">Home</v-btn>
          </div>
        </template>
      </div>

      <div v-if="showFilters" class="mt-0">
        <filters
          ref="filterRef"
          :search-text="searchStore.query"
          @search="search"
          @close="toggleFilters"
        ></filters>
      </div>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSearchStore } from '~/stores/searchStore';
const router = useRouter();
const route = useRoute();

const searchStore = useSearchStore();
const searching = ref(false);
const basicSearchRef = ref();
const showFilters = ref(false);

useHead({
  title: 'CardMystic',
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
  ],
});

onMounted(async () => {
  // Check if we have query parameters to perform a search
  const query = route.query.q as string;
  const endpoint = parseInt(route.query.endpoint as string) || 0;
  const filtersParam = route.query.filters as string;
  const hasImage = route.query.hasImage === 'true';

  if (query || hasImage) {
    // Set the search parameters and update store
    searchStore.query = query || '';
    searchStore.selectedChipIndex = endpoint;

    // Set the chip index in the BasicSearch component
    basicSearchRef.value?.setChipIndex(endpoint);

    // Parse and apply filters if provided
    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(filtersParam);
        Object.assign(searchStore.filters, parsedFilters);
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }

    // Perform the search
    await performSearch();
  }
});

async function search(selectedIndex: number) {
  // Update store with selected index
  searchStore.selectedChipIndex = selectedIndex;

  // Update URL with new search parameters
  const queryParams: any = {
    q: searchStore.query,
    endpoint: selectedIndex,
    filters: JSON.stringify(searchStore.filters),
  };

  // Update the URL without triggering navigation
  await router.replace({
    name: 'search',
    query: queryParams,
  });

  await performSearch();
}

async function performSearch() {
  searching.value = true;
  try {
    await searchStore.search(searchStore.selectedChipIndex);
  } catch (error) {
    console.error('Search failed:', error);
  }
  searching.value = false;
}

function toggleFilters() {
  showFilters.value = !showFilters.value;
}
</script>

<style lang="sass" scoped>
.title::after
  content: '|'
  animation: blink 1s infinite
  margin-left: 5px

@keyframes blink
  0%, 100%
    opacity: 1
  50%
    opacity: 0

.image
  position: relative
  bottom: -35px

.col-container
  position: relative

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  top: 160px
  left: 0
  right: 0
  margin: auto

.title
  font-size: 3.5rem
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)

.subtitle
  font-size: 1.05rem
  color: white
  position: relative
  top: -14px

.subtitle2
  font-size: 1.01rem
  color: white
  position: relative
  top: -14px


.important-text
  color: rgb(var(--v-theme-primary))
  font-style: italic

.chip
  display: flex
  justify-content: center
  align-content: center
  background-color: black

.primary
  color: rgb(var(--v-theme-primary))

.glow-wrapper
  position: relative
  display: inline-block

.glow-wrapper::after
  content: ''
  position: absolute
  top: 72%
  left: 49%
  width: 100px
  height: 100px
  background: radial-gradient(circle at center, rgba(147,114,255,0.6) 0%, rgba(147,114,255,0.3) 40%, rgba(147,114,255,0.1) 70%, rgba(147,114,255,0) 100%)
  border-radius: 50%
  transform: translate(-50%, -50%)
  animation: glowPulse 5s ease-in-out infinite
  pointer-events: none
  z-index: 1

@keyframes glowPulse
  0%, 100%
    opacity: 0.6
    transform: translate(-50%, -50%) scale(1)
  50%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.4)

.no-results-container
  margin-top: 40px
  display: flex
  align-items: center
  justify-content: center
  text-align: center
  color: white
  font-size: 1.5rem
  display: flex
  flex-direction: column

.filters-btn
  width: 40px
  height: 56px
  border-radius: 4px
  margin-left: 12px
</style>
