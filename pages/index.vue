<template>
  <navbar></navbar>
  <v-container
    class="fill-height container d-flex align-center justify-center"
    style="padding-top: 0"
  >
    <v-col justify="center" align="center" class="col-container px-0">
      <!-- Header with image and title side by side -->
      <div class="header-layout">
        <div class="glow-wrapper">
          <v-img src="/public/crystall_ball.png" class="image"></v-img>
        </div>

        <div class="title-container">
          <h1 class="title">
            {{ typedTitle }}
          </h1>
          <h2 class="subtitle">
            <b class="important-text">A.I. Search Engine</b> for Magic: The
            Gathering
          </h2>
        </div>
      </div>

      <ChipSelector
        class="chip-selector"
        :options="chipSelectorOptions"
        :tooltips="chipSelectorTooltips"
        :selected-index="chipSelectedIndex"
        @update:selectedIndex="chipSelectedIndex = $event"
      />

      <!-- Search bar and filters -->
      <div style="max-width: 768px">
        <v-text-field
          v-if="chipSelectedIndex !== 2"
          v-model="searchStore.query"
          label="Search..."
          variant="solo"
          elevation="5"
          @keyup.enter="search"
          :loading="searching"
          prepend-inner-icon="mdi-magnify"
        ></v-text-field>

        <v-file-input
          v-else
          v-model="uploadedFile"
          label="Upload an image"
          accept="image/*"
          variant="solo"
          prepend-icon="mdi-camera"
        />
        <filters
          ref="filterRef"
          :search-text="searchStore.query"
          @search="search"
        ></filters>
        <ExampleQuery class="mt-6" />
      </div>
    </v-col>
  </v-container>

  <Footer></Footer>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
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

  // Navigate to search page with query parameters
  const queryParams: any = {
    q: searchStore.query,
    endpoint: chipSelectedIndex.value,
    filters: JSON.stringify(searchStore.filters),
  };

  // If image file is selected, we'll handle it differently
  if (chipSelectedIndex.value === 2 && uploadedFile.value) {
    // For image search, we need to store the file and navigate
    searchStore.imageFile = uploadedFile.value;
    queryParams.hasImage = 'true';
  }

  router.push({
    name: 'search',
    query: queryParams,
  });
}
</script>

<style lang="sass" scoped>
.title::after
  content: '|'
  animation: blink 3s infinite
  margin-left: 5px
  position: relative
  top: -10px
  font-size: 2.6rem
  @media (max-width: 600px)
    top: -10px
    font-size: 2.4rem

@keyframes blink
  0%, 100%
    opacity: 1
  50%
    opacity: 0

.image
  width: 120px
  height: 120px
  position: relative
  bottom: 10px
  left: 20px

  @media (max-width: 768px)
    width: 100px
    height: 100px
    bottom: -15px
    left: 0px

.col-container
  position: relative

.header-layout
  display: flex
  align-items: center
  justify-content: center
  gap: 24px
  margin-bottom: 16px
  @media (max-width: 768px)
    flex-direction: column
    gap: 12px

.title-container
  display: flex
  flex-direction: column
  align-items: flex-start
  justify-content: center
  min-width: 372px
  @media (max-width: 768px)
    min-width: 0px
    align-items: center
    text-align: center

.title
  font-family: "Alfa Slab One", serif
  font-weight: 400
  font-style: normal
  font-size: 3.6rem
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  margin: 0
  line-height: 1
  @media (max-width: 768px)
    font-size: 3.3rem
    text-align: center

.subtitle
  font-size: 1.1rem
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  color: white
  margin: 4px 0 0 0
  line-height: 1.2
  width: 100%
  @media (max-width: 768px)
    font-size: 1.0rem
    text-align: center

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
  margin-bottom: 20px

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
  top: 50%
  left: 66%
  width: 50px
  height: 50px
  background: radial-gradient(circle at center, rgba(147,114,255,0.6) 0%, rgba(147,114,255,0.3) 40%, rgba(147,114,255,0) 70%, rgba(147,114,255,0) 100%)
  border-radius: 50%
  transform: translate(-50%, -50%)
  animation: glowPulse 5s ease-in-out infinite
  pointer-events: none
  z-index: 1
  @media (max-width: 768px)
    width: 40px
    height: 40px
    top: 58%
    left: 49.5%

@keyframes glowPulse
  0%, 100%
    opacity: 0.6
    transform: translate(-50%, -50%) scale(1)
  50%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.5)
</style>
