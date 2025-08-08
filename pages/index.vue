<template>
  <div class="col-container px-0 w-full">
    <!-- Header with image and title side by side -->
    <div class="header-layout">
      <div>
        <img src="/CardMystic.webp" class="image w-[240px] h-[264px] object-cover" alt="CardMystic Logo" />
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

    <!-- Search Component -->
    <SearchForm />

    <!-- Example Queries -->
    <ExampleQueries />

    <!-- Top Queries -->
    <TopQueries />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomePage' });

import { onMounted, ref } from 'vue';
import SearchForm from '~/components/search/Search.vue';

const fullTitle = 'CardMystic';
const typedTitle = ref('');

// Use search type composable to check if AI search is active
const { isAiSearch } = useSearchType();

useHead({
  title: 'CardMystic',
});

const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/',
  page_name: 'Home Page',
  query: '',
  card_name: '',
  filters: undefined,
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
    width: 100px !important
    height: 100px !important
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
  margin-top: 16px
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
  color: rgb(var(--color-primary-500))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  html.light & 
    text-shadow: none
  margin: 0
  line-height: 1
  @media (max-width: 768px)
    font-size: 3.3rem
    text-align: center

.subtitle
  font-size: 1.1rem
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  html.light & 
    text-shadow: none
  margin: 4px 0 0 0
  line-height: 1.2
  width: 100%
  @media (max-width: 768px)
    font-size: 1.0rem
    text-align: center

.important-text
  color: rgb(var(--color-primary-500))
  font-style: italic

.chip-selector
  position: relative
  margin-bottom: 20px

.help-container
  position: relative
  top: -20px

.primary
  color: rgb(var(--color-primary-500))

.filters-btn
  width: 40px
  height: 56px
  border-radius: 4px
  margin-left: 12px
</style>
