<template>
  <navbar></navbar>
  <v-container class="fill-height d-flex align-start justify-center pt-0">
    <v-col justify="center" align="center" class="col-container pt-0">
      <!-- Search bar and filters -->
      <v-row class="mt-0 pb-0 px-0" justify="center" style="max-width: 705px">
        <v-col class="py-0 px-0">
          <v-text-field
            v-model="searchStore.query"
            label="Search..."
            variant="solo"
            elevation="5"
            @keyup.enter="search"
            :loading="searching"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row class="mt-0 pb-0 px-0" style="max-width: 705px">
        <v-col class="d-flex flex-grow-1 align-center py-0 px-0">
          <filters
            ref="filterRef"
            :search-text="searchStore.query"
            @search="search"
          ></filters>
        </v-col>
      </v-row>

      <v-row class="pa-3 mt-6" justify="center">
        <v-card style="max-width: 400px" elevation="5">
          <v-card-text class="d-flex flex-row text-left align-center">
            <v-icon color="primary">mdi-help-circle</v-icon>
            <p class="ml-2">
              The <b class="important-text">%</b> under each card represents the
              model's <b class="important-text">confidence</b> that the result
              is relevant.
            </p>
          </v-card-text>
        </v-card>
      </v-row>

      <!-- Results, show image with properties.url -->
      <!-- TODO: return more results and paginate -->
      <div style="max-width: 1072px" class="mt-4">
        <template v-if="searchStore.results.length > 0">
          <v-row>
            <v-col
              class="mt-4 px-0 py-0 flex-grow-1"
              v-for="result in searchStore.results"
              :key="result.uuid"
            >
              <card
                :card="result"
                @click="
                  cardStore.card = result;
                  router.push({ name: 'cardDetails' });
                "
              />
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <div class="no-results-container">
            <h2>No Results Found</h2>
          </div>
        </template>
      </div>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSearchStore } from '~/stores/searchStore';
const router = useRouter();

const searchStore = useSearchStore();
const cardStore = useCardStore();

const fullTitle = 'CardMystic';
const typedTitle = ref('');

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

onMounted(() => {
  let i = 0;
  const typingInterval = setInterval(() => {
    if (i < fullTitle.length) {
      typedTitle.value += fullTitle[i];
      i++;
    } else {
      clearInterval(typingInterval);
    }
  }, 200); // typing speed
});

const filterRef: any = ref(null);
const searching = ref(false);

async function search() {
  filterRef.value?.closePanel();
  searching.value = true;

  const body = {
    query: searchStore.query,
    limit: 80,
    filters: searchStore.filters,
  };
  console.log('body: ', body);

  const { data } = await useFetch<any>('/api/proxy', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (data.value) {
    const resultsWithConfidence = data.value.objects.map((result: any) => {
      result.metadata.confidence = 1 - result.metadata.distance;
      return result;
    });
    const sortedResults = resultsWithConfidence.sort(
      (a: any, b: any) => b.metadata.confidence - a.metadata.confidence,
    );

    searchStore.results = sortedResults;
    console.log('Results:', searchStore.results);
  } else {
    searchStore.results = [];
    // TODO: give a message
  }
  searching.value = false;
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
  height: calc(100vh - 150px)
  display: flex
  align-items: center
  justify-content: center
  text-align: center
  color: white
  font-size: 1.5rem
  opacity: 0.7
</style>
