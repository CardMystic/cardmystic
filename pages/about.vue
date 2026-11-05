<template>
  <article class="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
    <header class="mb-10">
      <img
        src="/wizard_black.svg"
        alt="CardMystic logo"
        width="96"
        height="96"
        class="mb-6 size-24 dark:hidden"
      />
      <img
        src="/wizard.svg"
        alt="CardMystic logo"
        width="96"
        height="96"
        class="mb-6 hidden size-24 dark:block"
      />
      <h1 class="mb-4 text-3xl font-bold sm:text-4xl">What is CardMystic?</h1>
      <p class="text-base leading-8 sm:text-lg">
        CardMystic is a powerful Open Source Smart Search engine for Magic: The
        Gathering cards. We trained custom models on MTG data to provide the
        best possible search results. We are dedicated to providing only the
        best tools for the amazing MTG community!
      </p>
    </header>

    <section class="mb-10">
      <h2 class="mb-4 text-2xl font-semibold">Why CardMystic?</h2>
      <p class="mb-4 text-base leading-8 sm:text-lg">
        Magic: The Gathering is complex and intricate, but finding cards
        shouldn't be! Our developers decided that traditional keyword search
        engines fall short.
      </p>
      <p class="text-base leading-8 sm:text-lg">
        CardMystic makes card discovery effortless with semantic search. Just
        describe what you're looking for and let CardMystic handle the rest!
      </p>
    </section>

    <section class="mb-10">
      <h2 class="mb-4 text-2xl font-semibold">What Sets Us Apart</h2>
      <p class="text-base leading-8 sm:text-lg">
        Unlike similar tools, we are NOT a generic AI wrapper. Our team has
        meticulously trained custom semantic search models specifically on
        Magic: The Gathering data to ensure the most accurate and relevant
        search results possible.
      </p>
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-semibold">Contact Us</h2>
      <p class="mb-4 text-base leading-8 sm:text-lg">
        Have questions, feedback, or ideas for CardMystic? We'd love to hear
        from you!
      </p>
      <p class="text-base leading-8 sm:text-lg">
        Discord:
        <NuxtLink
          to="https://discord.gg/Qhcg87q88r"
          target="_blank"
          class="text-primary hover:underline font-semibold"
        >
          Join our server</NuxtLink
        >
      </p>
      <p class="text-base leading-8 sm:text-lg">
        Email:
        <a
          href="mailto:thecardmystic@gmail.com"
          class="text-primary hover:underline font-semibold"
          >thecardmystic@gmail.com</a
        >
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'About CardMystic - Smart Magic: The Gathering Search Engine',
  description:
    'Learn about CardMystic, a smart search engine for Magic: The Gathering cards. Custom trained models for accurate MTG card search using natural language.',
  ogTitle: 'About CardMystic - Smart Magic: The Gathering Search Engine',
  ogDescription:
    'Learn about CardMystic, a smart search engine for Magic: The Gathering cards.',
  ogType: 'website',
  ogImage: () => 'https://cardmystic.com/cardmystic_preview.png',
  ogImageAlt: () => 'CardMystic - About',
});

const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/about',
  page_name: 'About Page',
  query: '',
  card_name: '',
  filters: undefined,
});
</script>
