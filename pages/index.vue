<template>
  <div class="hero px-0 h-full w-full justify-center flex flex-col items-center">
    <div class="hero-bg"></div>
    <UContainer class="flex flex-col items-center justify-center text-center max-w-[1000px] h-full">
      <div class="header-layout">
        <div class="title-container">
          <img src="/wizard2.png" class="image w-[120px] h-[120px] object-cover" alt="Wizard" />
          <h2 class="subtitle">
            Bringing The <b class="text-primary">Power Of AI</b> To <b class="text-primary">Magic</b>
          </h2>
        </div>
      </div>

      <!-- Search -->
      <SearchForm />

      <!-- Explore text + icon -->
      <div class="explore mt-6 mb-2 flex flex-col items-center gap-1">
        <span class="text-md opacity-100">Explore More</span>
        <UIcon name="i-lucide-chevron-down" class="text-xl opacity-100" />
      </div>

    </UContainer>
  </div>

  <!-- Everything below the fold -->
  <UContainer class="mt-6">
    <ExampleQueries class="mb-2" />
    <TopQueries class="mb-4" />
    <ProductPromotionButtons class="mb-0" />
  </UContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomePage' });
definePageMeta({
  layout: 'home'
});
import SearchForm from '~/components/search/Search.vue';
import ProductPromotionButtons from '~/components/ProductPromotionButtons.vue';

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

</script>

<style lang="sass" scoped>
.secondary
  color: rgb(var(--color-secondary-500))

.hero
  position: relative
  min-height:  100vh
  padding-top: 0px
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-bottom: 3px solid white
  background-color: black

.hero-bg
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  background-image: url('/space.jpg')
  opacity: 0.10

.image
  width: 200px
  height: 200px
  position: relative
  bottom: 10px
  left: 0px
  @media (max-width: 768px)
    width: 120px
    height: 120px

.header-layout
  display: flex
  align-items: center
  justify-content: center
  gap: 24px
  margin-bottom: 48px
  @media (max-width: 768px)
    margin-bottom: 24px
    flex-direction: column
    gap: 12px

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  text-align: center
  min-width: 372px
  position: relative

.subtitle
  font-size: 2.0rem
  font-style: italic
  line-height: 1.2
  @media (max-width: 768px)
    font-size: 1.2rem
    text-align: center
</style>
