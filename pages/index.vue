<template>
  <navbar></navbar>
  <v-container
    class="fill-height d-flex"
    :class="{
      'align-center': $vuetify.display.mdAndUp,
      'align-start': $vuetify.display.mdAndDown,
    }"
    style="padding-top: 0px"
  >
    <v-col class="col-container px-0">
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

      <!-- Basic Search Component -->
      <BasicSearch
        ref="basicSearchRef"
        max-width="768px"
        :is-home-page="true"
        :searching="searching"
        @search="search"
      />

      <!-- Example Query -->
      <ExampleQuery class="mt-4" style="max-width: 768px" />

      <!-- Top Queries -->
      <TopQueries class="mt-4" style="max-width: 768px" />
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
// Remove local chipSelectedIndex, use store instead
const searching = ref(false);
const basicSearchRef = ref();

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

async function search(selectedIndex: number) {
  // Update store with selected index
  searchStore.selectedChipIndex = selectedIndex;

  // Navigate to search page with query parameters
  const queryParams: any = {
    q: searchStore.query,
    endpoint: selectedIndex,
    filters: JSON.stringify(searchStore.filters),
  };

  // If image file is selected, we'll handle it differently
  if (selectedIndex === 2 && searchStore.imageFile) {
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
  @media (max-width: 768px)
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
  left: 0px
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
  position: relative
  right: 13px
  @media (max-width: 768px)
    min-width: 0px
    align-items: center
    text-align: center
    right: 0px

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
  left: 50%
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

.filters-btn
  width: 40px
  height: 56px
  border-radius: 4px
  margin-left: 12px
</style>
