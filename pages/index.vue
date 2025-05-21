<template>
  <navbar :show-actions="false"></navbar>
  <v-container
    class="container fill-height d-flex align-center justify-center pt-0"
  >
    <v-col justify="center" align="center" class="col-container">
      <div class="glow-wrapper">
        <v-img src="/public/crystall_ball.png" class="image"></v-img>
      </div>

      <!-- Title container -->
      <v-row class="title-container">
        <h1 class="title">
          {{ typedTitle }}
        </h1>

        <h2 class="subtitle mt-2">
          Vector Search For MTG
          <!-- <b class="important-text">Open Source</b> -->
        </h2>
        <h2 class="subtitle2">
          You Can <b class="important-text">Support Us</b> With The Links Below!
        </h2>
        <div class="icon-container d-flex align-center" style="gap: 8px">
          <!-- GitHub Button -->
          <v-btn
            icon
            color="black"
            variant="flat"
            elevation="3"
            href="https://github.com/imdarkmode?tab=repositories"
            target="_blank"
            rel="noopener"
            class="link-btn"
          >
            <v-icon size="26" color="white">mdi-github</v-icon>
          </v-btn>

          <!-- Patreon Button -->
          <v-btn
            icon
            color="black"
            variant="flat"
            elevation="3"
            href="https://patreon.com/ImDarkMode"
            target="_blank"
            rel="noopener"
            class="link-btn"
          >
            <v-icon size="26" color="white">mdi-patreon</v-icon>
          </v-btn>

          <!-- Discord Button -->
          <v-btn
            icon
            color="black"
            variant="flat"
            elevation="3"
            href="https://discord.gg/GmPZ3e7tZH"
            target="_blank"
            rel="noopener"
            class="link-btn"
          >
            <v-img
              src="@/public/discord-icon.png"
              width="26"
              height="26"
              alt="Discord"
              contain
            />
          </v-btn>

          <!-- YouTube Button -->
          <v-btn
            icon
            color="black"
            variant="flat"
            elevation="3"
            href="https://www.youtube.com/@imdarkmode"
            target="_blank"
            rel="noopener"
            class="link-btn"
          >
            <v-icon size="26" color="white">mdi-youtube</v-icon>
          </v-btn>
        </div>
      </v-row>

      <!-- Search bar and filters -->
      <v-row class="mt-0 pb-0" justify="center" style="max-width: 800px">
        <v-col class="py-0">
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

      <v-row style="max-width: 800px">
        <v-col class="d-flex flex-grow-1 align-center pt-0">
          <filters
            ref="filterRef"
            :search-text="searchStore.query"
            @search="search"
          ></filters>
        </v-col>
      </v-row>

      <!-- Help container -->
      <v-row class="pa-3" justify="center">
        <v-card density="compact" style="max-width: 500px" elevation="5">
          <v-card-text class="d-flex flex-row text-left align-center">
            <v-icon color="primary">mdi-help-circle</v-icon>
            <p class="ml-2">
              Our algorithm uses AI to search by
              <b class="important-text">meaning</b>. The more descriptive the
              prompt, the better the results!
            </p>
          </v-card-text>
        </v-card>
      </v-row>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSearchStore } from '~/stores/searchStore';
const router = useRouter();

const searchStore = useSearchStore();
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

    // Go To Search Page
    searching.value = false;
    router.push({ name: 'search' });
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
  width: 250px
  height: 250px

  @media (max-width: 600px)
    width: 150px
    height: 150px

.col-container
  position: relative

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  position: relative
  top: -30px
  @media (max-width: 600px)
    top: -23px

.title
  font-size: 3.3rem
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  margin-top: 6px
  @media (max-width: 600px)
    font-size: 2.5rem

.subtitle
  font-size: 1.65rem
  color: white
  position: relative
  top: -14px
  @media (max-width: 600px)
    font-size: 1.25rem

.subtitle2
  font-size: 0.9rem
  color: white
  position: relative
  top: -14px
  @media (max-width: 600px)
    font-size: 0.68rem

.link-btn
  color: white
  background-color: black
  border-radius: 50%
  padding: 0px
  min-width: 0px
  width: 40px
  height: 40px

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
  top: 58%
  left: 49.5%
  width: 100px
  height: 100px
  background: radial-gradient(circle at center, rgba(147,114,255,0.6) 0%, rgba(147,114,255,0.3) 40%, rgba(147,114,255,0) 70%, rgba(147,114,255,0) 100%)
  border-radius: 50%
  transform: translate(-50%, -50%)
  animation: glowPulse 5s ease-in-out infinite
  pointer-events: none
  z-index: 1
  @media (max-width: 600px)
    width: 70px
    height: 70px

@keyframes glowPulse
  0%, 100%
    opacity: 0.6
    transform: translate(-50%, -50%) scale(1)
  50%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.5)
</style>
