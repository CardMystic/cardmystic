<template>
  <UContainer class="flex items-center flex-col py-8 w-full max-w-[800px]">
    <!-- What is CardMystic -->
    <div
      class="mb-6 w-full p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent">
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-primary">
        🔮 What is <span class="text-primary">CardMystic</span>?
      </h2>
      <p class="text-base md:text-lg leading-relaxed">
        CardMystic is a powerful Open Source AI Search engine for Magic: The
        Gathering cards. We trained custom models on MTG data to provide the best possible search results. We
        are dedicated to providing only the best tools for the
        amazing MTG community!
      </p>
    </div>

    <!-- Why CardMystic -->
    <div
      class="mb-6 w-full p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent">
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-primary">
        🤔 Why <span class="text-primary">CardMystic</span>?
      </h2>
      <p class="text-base md:text-lg leading-relaxed">
        Magic: The Gathering is complex and intricate, but finding cards
        shouldn't be. Our developers decided that traditional keyword search
        engines fall short.
      </p>
      <p class="text-base md:text-lg leading-relaxed">
        CardMystic makes card discovery effortless with semantic AI search.
        Just describe what you're looking for and let CardMystic handle the rest!
      </p>
    </div>

    <!-- What Sets Us Apart -->
    <div
      class="mb-6 w-full p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent">
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-primary">
        ⭐ What Sets Us Apart
      </h2>
      <p class="text-base md:text-lg leading-relaxed">
        Unlike similar tools, we are NOT a generic AI wrapper. Our team's AI experts have meticulously trained
        custom
        models specifically on Magic: The Gathering data to ensure the most accurate and relevant search results
        possible.
      </p>
    </div>

    <!-- Contact Us -->
    <div
      class="w-full p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent">
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-primary">💬 Contact Us</h2>
      <p class="text-base md:text-lg leading-relaxed">
        Have questions, feedback, or ideas for CardMystic? We'd love to hear
        from you!
      </p>
      <p class="mt-4 text-base md:text-lg leading-relaxed">
        👾 Discord:
        <NuxtLink to="https://discord.gg/GmPZ3e7tZH" target="_blank" class="text-primary hover:underline font-semibold">
          Join our
          server</NuxtLink>
      </p>
      <p class="text-base md:text-lg leading-relaxed">
        📧 Email:
        <a href="mailto:thecardmystic@gmail.com"
          class="text-primary hover:underline font-semibold">thecardmystic@gmail.com</a>
      </p>
    </div>
  </UContainer>
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
