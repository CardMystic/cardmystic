<template>
  <v-container class="fill-height d-flex align-center justify-center">

    <v-col justify="center" align="center" class="col-container">
      <v-img width="360" height="360" src="/public/mysticsearch_ai4_nobg.png" v-if="searchResults.length === 0"></v-img>
      <!-- Title container -->
      <v-row class="title-container" v-if="searchResults.length === 0">
        <h1 class="title">CardMystic</h1>
        <h2 class="subtitle">Vector and Similarity Search For Trading Card Games</h2>
      </v-row>

      <!-- Search bar and filters -->
      <v-row class="mt-0 pb-0" justify="center" style="max-width: 800px">
        <v-col class="pb-0">
          <v-text-field v-model="searchText" label="Search..." variant="solo" elevation="5"></v-text-field>
        </v-col>
        <v-col class="d-flex flex-grow-0 pt-3">
          <v-btn style="height: 56px" @click="search()" color="primary" elevation="3" :loading="searching">Search</v-btn>
        </v-col>
      </v-row>

      <v-row v-if="searchFilters.length > 0" class="mt-0 pb-0" justify="center" style="max-width: 800px">
        <!-- Current filters chips -->
        <v-chip-group class="mb-2">
          <v-chip class="chip" v-for="(filter, index) in searchFilters" :key="index">
            <span style="position: relative; top: -1.3px"><b class="primary">{{ filter.type }}</b>: {{ filter.value }}</span>
            <template #append>
              <v-icon @click="removeFilter(index)">mdi-close</v-icon>
            </template>
          </v-chip>
        </v-chip-group>
      </v-row>

      <v-row style="max-width: 800px">
        <v-col class="d-flex flex-grow-1 align-center pt-0">
          <filters ref="filterRef" @newFilter="(newFilter: IFilter) => addFilter(newFilter)"></filters>
        </v-col>
      </v-row>

      <!-- Help container -->
      <v-row class="mt-16" justify="center" v-if="searchResults.length === 0">
        <v-card style="max-width: 500px" elevation="5">
          <v-card-text class="d-flex flex-row text-left align-center">
            <v-icon color="primary">mdi-help-circle</v-icon>
            <p class="ml-2">Our algorithm uses Machine Learning to search by <b class="important-text">meaning</b> instead of keywords. 
              Simply describe what you want the card to do!</p>
          </v-card-text>
        </v-card>
      </v-row>

      <!-- Results, show image with properties.url -->
      <!-- TODO: return more results and paginate -->
      <v-row>
        <v-col class="mt-10 px-0 py-0 flex-grow-1" v-for="result in searchResults" :key="result.id">
            <v-img
              width="250px"
              :src="result.properties.url"
              alt="Card Image"
              style="border-radius: 12px;"
            ></v-img>
        </v-col>
      </v-row>


    </v-col>
    
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type IFilter, type IMagicCardsSearchFilters, type IMagicCardsSearch, type Legalities } from '@/types/IVectorBackend';
import { cardFormats } from '@/utils/mtgCommon';
const config = useRuntimeConfig();

const filterRef: any = ref(null);
const searchText = ref('');
const searchFilters: Ref<IFilter[]> = ref([]);
const searchResults: Ref<any[]> = ref([]);
const searching = ref(false);

async function search() {
  console.log('url: ', `https://api.cardmystic.io/search`)
  filterRef.value?.closePanel();
  searching.value = true;

  const { data } = await useFetch<any>('/api/proxy', {
    method: 'POST',
    body: JSON.stringify({
      query: searchText.value,
      limit: 80,
      filters: formatFilters()
    })
  });

  if(data.value) {
    searchResults.value = data.value.objects;
  } else {
    searchResults.value = [];
    // TODO: give a message
  }
  searching.value = false;
}

function formatFilters() {
  const filters: IMagicCardsSearchFilters = { legalities: {}};
  searchFilters.value.forEach(filter => {
  let filterKey = filter.type // as keyof IMagicCardsSearchFilters; // Type assertion here
    if(filterKey == 'powers' || filterKey == 'toughnesses') {
      if (!filters[filterKey]) {
          filters[filterKey] = [filter.value as number];
        } else {
          (filters[filterKey] as number[]).push(filter.value as number);
        }
    } else if(filterKey == 'types' || filterKey == 'colors' || filterKey =='rarities' || filterKey == 'sets' || filterKey =='artists' || filterKey =='manaCosts') {
      if (!filters[filterKey]) {
          filters[filterKey] = [filter.value as string];
        } else {
          (filters[filterKey] as string[]).push(filter.value as string);
        }
    } else if(cardFormats.includes(filterKey)) {
      const legalityKey = filterKey as keyof Legalities;
      filters['legalities']![legalityKey] = filter.value as string;
    } 
  });
  return filters;
}

function addFilter(newFilter: IFilter) {
  searchFilters.value.push(newFilter);
}

function removeFilter(index: number) {
  searchFilters.value.splice(index, 1);
}

</script>

<style lang="sass" scoped>
.col-container
  position: relative

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  position: absolute
  top: 230px
  left: 0
  right: 0
  margin: auto

.title
  font-size: 4rem
  color: black
  text-shadow: -3px 0 #FF68FF, 0 3px #FF68FF, 3px 0 #FF68FF, 0 -3px #FF68FF


.subtitle
  font-size: 1rem
  color: white
  position: relative
  top: -14px
  text-shadow: -2px 0 black, 0 2px black, 2px 0 black, 0 -2px black

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
</style>