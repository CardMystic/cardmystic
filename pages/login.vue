<template>
  <SpaceBackground>
    <Login />
  </SpaceBackground>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'fullscreen',
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
      content: 'noindex, nofollow' // Don't index login pages
    }
  ]
})

useSeoMeta({
  title: () => 'Login - CardMystic',
  description: () => 'Sign in to your CardMystic account to access your saved card lists, search history, and personalized Magic: The Gathering card search experience.',
  ogTitle: () => 'Login - CardMystic',
  ogDescription: () => 'Sign in to your CardMystic account to access your saved card lists, search history, and personalized Magic: The Gathering card search experience.',
  ogType: 'website',
  ogImage: () => 'https://cardmystic.io/cardmystic_cards.png',
  ogImageAlt: () => 'CardMystic - Magic: The Gathering card search',
  twitterCard: 'summary',
  twitterTitle: () => 'Login - CardMystic',
  twitterDescription: () => 'Sign in to your CardMystic account to access your saved card lists and personalized MTG search.',
  twitterImage: () => 'https://cardmystic.io/cardmystic_cards.png'
})

const { userProfile } = useUserProfile()
</script>
