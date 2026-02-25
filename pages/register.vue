<template>
  <SpaceBackground>
    <Register />
  </SpaceBackground>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'home',
  middleware: (to) => {
    // Redirect if already logged in
    const { userProfile } = useUserProfile()
    if (userProfile.value?.id) {
      return navigateTo('/profile')
    }
  }
})

useHead({
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow' // Don't index signup pages
    }
  ]
})

useSeoMeta({
  title: () => 'Create Account - CardMystic',
  description: () => 'Create a free CardMystic account to save your favorite MTG cards, build custom lists, track search history, and get personalized Magic: The Gathering card recommendations.',
  ogTitle: () => 'Create Account - CardMystic',
  ogDescription: () => 'Create a free CardMystic account to save your favorite MTG cards, build custom lists, and get personalized Magic: The Gathering card recommendations.',
  ogType: 'website',
  ogImage: () => 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'CardMystic - Magic: The Gathering card search',
  twitterCard: 'summary',
  twitterTitle: () => 'Create Account - CardMystic',
  twitterDescription: () => 'Create a free CardMystic account to save MTG cards, build custom lists, and get personalized recommendations.',
  twitterImage: () => 'https://cardmystic.io/cardmystic_cards.png'
})

const { userProfile } = useUserProfile()
</script>
