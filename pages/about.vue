<template>
  <div class="flex items-center flex-col py-8 w-full">
    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🔮 What is <b class="title">CardMystic</b>?
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          CardMystic is a powerful Open Source AI Search engine for Magic: The
          Gathering cards. We trained custom models on MTG data to provide the best possible search results. We
          are dedicated to providing only the best tools for the
          amazing MTG community!
        </p>
      </UCardContent>
    </UCard>

    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🧙‍♂️ Why <b class="title">CardMystic</b>?
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          Magic: The Gathering is a complex and intricate game, but finding cards
          shouldn't be. Our developers decided that traditional keywork search
          engines fall short. They require exact wording and an intimate knowledge
          of Magic terms.
        </p>
        <p class="mt-4">
          CardMystic makes card discovery effortless with natural language search.
          Just type what you're thinking: "a blue creature that draws cards" or "a
          cheap red burn spell" and let CardMystic handle the rest. Whether you're
          a seasoned deckbuilder or brand new to the game, CardMystic helps you
          find the perfect card without the guesswork.
        </p>
        <p class="mt-4">
          We aren't another website using generic AI models, our team's AI experts have meticulously trained custom
          models specifically on Magic: The Gathering data to ensure the most accurate and relevant search results
          possible.
        </p>
      </UCardContent>
    </UCard>

    <UCard class="p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        💬 Contact Us
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          Have questions, feedback, or ideas for CardMystic? We'd love to hear
          from you!
        </p>
        <p class="mt-4">
          👾 Discord:
          <NuxtLink to="https://discord.gg/GmPZ3e7tZH" target="_blank" class="text-primary hover:underline">Join our
            server</NuxtLink>
        </p>
        <p>
          📧 Email:
          <a href="mailto:thecardmystic@gmail.com" class="text-primary hover:underline"> thecardmystic@gmail.com </a>
        </p>
      </UCardContent>
    </UCard>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'About CardMystic - AI Magic: The Gathering Search Engine',
  description: 'Learn about CardMystic, an AI search engine for Magic: The Gathering cards. Custom trained models for accurate MTG card search using natural language.',
  ogTitle: 'About CardMystic - AI Magic: The Gathering Search Engine',
  ogDescription: 'Learn about CardMystic, an AI search engine for Magic: The Gathering cards.',
  ogType: 'website'
})

const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/about',
  page_name: 'About Page',
  query: '',
  card_name: '',
  filters: undefined,
});
</script>

<style scoped style="scss"></style>
