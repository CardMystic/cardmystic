<template>
  <div class="min-h-screen w-full flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md mx-auto">
      <Register />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
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
