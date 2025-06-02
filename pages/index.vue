<template>
  <navbar></navbar>
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
          <b class="important-text">Open Source</b> MTG Vector Search Engine
        </h2>
      </v-row>

      <ChipSelector
        class="chip-selector"
        :options="chipSelectorOptions"
        :tooltips="chipSelectorTooltips"
        :selected-index="chipSelectedIndex"
        @update:selectedIndex="chipSelectedIndex = $event"
      />

      <!-- Search bar and filters -->
      <v-row class="mt-0 pb-0 px-0" justify="center" style="max-width: 705px">
        <v-col class="py-0 px-0">
          <v-text-field
            v-if="chipSelectedIndex !== 2"
            v-model="searchStore.query"
            label="Search..."
            variant="solo"
            elevation="5"
            @keyup.enter="search"
            :loading="searching"
          ></v-text-field>

          <v-file-input
            v-else
            v-model="uploadedFile"
            label="Upload an image"
            accept="image/*"
            variant="solo"
            prepend-icon="mdi-camera"
          />
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
    </v-col>
  </v-container>
  <Footer></Footer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSearchStore } from '~/stores/searchStore';
const router = useRouter();

const searchStore = useSearchStore();
const fullTitle = 'CardMystic';
const typedTitle = ref('');

// Chip Selector component
const chipSelectorOptions = searchStore.endpoints.map((e: any) => e.name);
const chipSelectorTooltips = searchStore.endpoints.map((e: any) => e.tooltip);
const chipSelectedIndex = ref(0);

const uploadedFile = ref<File | null>(null);

watch(uploadedFile, (file) => {
  if (file) {
    searchStore.imageFile = file;
    searchStore.query = '';
    search();
  }
});

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
  try {
    await searchStore.search(chipSelectedIndex.value);
    if (searchStore.results.length > 0) {
      router.push('/search');
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
  searching.value = false;
  router.push({ name: 'search' });
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
    width: 190px
    height: 190px

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
  font-family: "Alfa Slab One", serif
  font-weight: 400
  font-style: normal
  font-size: 3.2rem
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  margin-top: 6px
  @media (max-width: 600px)
    font-size: 3.0rem

.subtitle
  font-size: 1.05rem
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  color: white
  position: relative
  top: -20px
  @media (max-width: 600px)
    font-size: 1.0rem

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

.chip-selector
  position: relative
  top: -20px

.help-container
  position: relative
  top: -20px

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
