<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import ClipboardMenu from '~/components/ClipboardMenu.vue'
import { useUserProfile } from '~/composables/useUserProfile'

const isOpen = ref(false)
const isMobileProfilePopoverOpen = ref(false)
const isDesktopProfilePopoverOpen = ref(false)
const colorMode = useColorMode()

const wizardImage = computed(() => {
  return colorMode.value === 'dark' ? '/wizard.webp' : '/wizard_darkmode.webp'
})
const { userProfile, initAuthListener, profileIconUrl, username, signOut, loading } = useUserProfile()

// Initialize auth listener on component mount
onMounted(() => {
  initAuthListener()
})

const handleLogout = async () => {
  await signOut()
  navigateTo('/')
}

const props = defineProps<{
  isFixed?: boolean
}>();

function closePopover() {
  isOpen.value = false
}

const mainItems: NavigationMenuItem[] = [
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/'
  },
  {
    label: 'Search',
    icon: 'i-lucide-search',
    children: [
      {
        label: 'AI Search',
        description: 'Search for cards using AI',
        icon: 'i-lucide-brain',
        to: '/search',
      },
      {
        label: 'Similarity Search',
        description: 'Search for similar cards by name',
        icon: 'i-mdi-cards-outline',
        to: '/search/similarity',
      },
      {
        label: 'Commander Search',
        description: 'Search for commanders using AI',
        icon: 'i-mdi-crown',
        to: '/search/commander',
      },
      {
        label: 'Keyword Search',
        description: 'Search for cards by keywords and filters',
        icon: 'i-lucide-whole-word',
        to: '/search/keyword',
      }
    ]
  },
  {
    label: 'About',
    icon: 'i-lucide-info',
    to: '/about'
  }
]

const mainItemsMobile: NavigationMenuItem[] = [
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/'
  },
  {
    label: 'AI Search',
    description: 'Search for cards using AI',
    icon: 'i-lucide-brain',
    to: '/search',
  },
  {
    label: 'Similarity Search',
    description: 'Search for similar cards by name',
    icon: 'i-mdi-cards-outline',
    to: '/search/similarity',
  },
  {
    label: 'Commander Search',
    description: 'Search for commanders using AI',
    icon: 'i-mdi-crown',
    to: '/search/commander',
  },
  {
    label: 'Keyword Search',
    description: 'Search for cards by keywords and filters',
    icon: 'i-lucide-whole-word',
    to: '/search/keyword',
  },
  {
    label: 'About',
    icon: 'i-lucide-info',
    to: '/about'
  }
]

const externalItems: NavigationMenuItem[] = [
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/cardmystic/cardmystic',
    target: '_blank'
  },
  {
    label: 'Patreon',
    icon: 'i-simple-icons-patreon',
    to: 'https://www.patreon.com/thecardmystic',
    target: '_blank'
  }
]
</script>

<template>
  <header
    :class="[props.isFixed ? 'fixed' : 'sticky', 'left-0 right-0 top-0 z-50 px-4 py-4 flex items-center justify-center bg-white/100 dark:bg-gray-950/75 backdrop-blur border-b border-gray-200 dark:border-gray-800']">

    <!-- Mobile -->
    <div class="md:hidden flex flex-row justify-between w-full">
      <!-- Mobile Menu Button -->
      <UPopover v-model:open="isOpen" @close="closePopover">
        <UButton color="neutral" variant="subtle" icon="i-lucide-menu" />

        <template #content>
          <div class="p-4 w-64 bg-white dark:bg-gray-900 rounded shadow flex flex-col gap-2">
            <NuxtLink v-for="item in mainItemsMobile" :to="item.to" class="flex items-center gap-2"
              @click="closePopover">
              <UIcon :name="item.icon!" class="w-5 h-5" />
              <div class="flex flex-col">
                <span>{{ item.label }}</span>
                <span class="text-sm text-gray-500" v-if="item.description">{{ item.description }}</span>
              </div>
            </NuxtLink>
            <a v-for="item in externalItems" @click="closePopover" :key="String(item.to)" :href="String(item.to)"
              :target="item.target!" rel="noopener noreferrer" class="flex items-center gap-2">
              <UIcon :name="item.icon!" class="w-5 h-5" />
              <div class="flex flex-col">
                <span>{{ item.label }}</span>
                <span v-if="item.description" class="text-sm text-gray-500">{{ item.description }}</span>
              </div>
            </a>
          </div>
        </template>
      </UPopover>

      <!-- Logo -->
      <div class="flex flex-row">
        <!-- Clipboard Button -->
        <ClipboardMenu class="cursor-pointer" />

        <ClientOnly>
          <span v-if="!userProfile && !loading" class="relative flex items-center">
            <!-- Login/Register Button with Tooltip -->
            <UButton class="cursor-pointer ml-2" color="primary" variant="solid" icon="i-lucide-user" label="Login"
              @click="navigateTo('/login')" />

            <LoginTooltip class="ml-2" />
          </span>
          <div v-else-if="loading" class="w-10 h-10 flex items-center justify-center ml-4">
            <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-primary" />
          </div>
          <UPopover v-else v-model:open="isMobileProfilePopoverOpen" class="ml-4">
            <div class="cursor-pointer">
              <div v-if="profileIconUrl"
                class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-md hover:scale-105 transition-transform">
                <img :src="profileIconUrl" :alt="username || 'Profile'" class="w-full h-full object-cover" />
              </div>
              <UButton v-else color="primary" variant="solid" icon="i-lucide-user" label="Profile" />
            </div>
            <template #content>
              <div class="p-2 bg-white dark:bg-gray-900 rounded shadow flex flex-col gap-1">
                <UButton class="cursor-pointer" icon="i-lucide-list" color="neutral" variant="ghost" label="Card Lists"
                  block @click="navigateTo('/lists'); isMobileProfilePopoverOpen = false" />
                <UButton class="cursor-pointer" icon="i-lucide-history" color="neutral" variant="ghost" label="History"
                  block @click="navigateTo('/history'); isMobileProfilePopoverOpen = false" />
                <UButton class="cursor-pointer" icon="i-lucide-settings" color="neutral" variant="ghost"
                  label="Settings" block @click="navigateTo('/profile'); isMobileProfilePopoverOpen = false" />
                <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <UButton class="cursor-pointer" icon="i-lucide-log-out" color="error" variant="ghost" label="Logout"
                  block @click="handleLogout(); isMobileProfilePopoverOpen = false" />
              </div>
            </template>
          </UPopover>
        </ClientOnly>

        <NuxtLink to="/" class="hover:opacity-80 transition-opacity ml-4">
          <ClientOnly>
            <img :src="wizardImage" alt="CardMystic Logo" class="w-10 h-10 object-contain" />
            <template #fallback>
              <img src="/wizard.webp" alt="CardMystic Logo" class="w-10 h-10 object-contain" />
            </template>
          </ClientOnly>
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop -->
    <div class="flex-row hidden md:flex items-center">
      <!-- Logo -->
      <NuxtLink to="/" class="hover:opacity-80 transition-opacity mr-6">
        <ClientOnly>
          <img :src="wizardImage" alt="CardMystic Logo" class="w-12 h-12 object-contain" />
          <template #fallback>
            <img src="/wizard.webp" alt="CardMystic Logo" class="w-12 h-12 object-contain" />
          </template>
        </ClientOnly>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <UNavigationMenu :items="[...mainItems, ...externalItems]" :ui="{
        viewport: 'w-auto min-w-[12rem] max-w-sm',
        childList: 'w-auto flex flex-col items-start p-2 gap-2',
        content: 'w-auto'
      }" />
      <!-- Clipboard Button (always visible, right side) -->
      <ClipboardMenu class="ml-4 h-[50px]" />

      <ClientOnly>
        <span v-if="!userProfile && !loading" class="relative">
          <!-- Login/Register Button with Tooltip -->
          <UButton class="cursor-pointer ml-2" color="primary" variant="solid" icon="i-lucide-user" label="Login"
            @click="navigateTo('/login')" />

          <LoginTooltip class="ml-2" />
        </span>

        <div v-else-if="loading" class="w-10 h-10 flex items-center justify-center ml-2">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-primary" />
        </div>

        <UPopover v-else v-model:open="isDesktopProfilePopoverOpen" class="ml-2">
          <div class="cursor-pointer">
            <div v-if="profileIconUrl"
              class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-md hover:scale-105 transition-transform">
              <img :src="profileIconUrl" :alt="username || 'Profile'" class="w-full h-full object-cover" />
            </div>
            <UButton v-else color="primary" variant="solid" icon="i-lucide-user" label="Profile" />
          </div>
          <template #content>
            <div class="p-2 bg-white dark:bg-gray-900 rounded shadow flex flex-col gap-1">
              <UButton class="cursor-pointer" icon="i-lucide-list" color="neutral" variant="ghost" label="Card Lists"
                block @click="navigateTo('/lists'); isDesktopProfilePopoverOpen = false" />
              <UButton class="cursor-pointer" icon="i-lucide-history" color="neutral" variant="ghost" label="History"
                block @click="navigateTo('/history'); isDesktopProfilePopoverOpen = false" />
              <UButton class="cursor-pointer" icon="i-lucide-settings" color="neutral" variant="ghost" label="Settings"
                block @click="navigateTo('/profile'); isDesktopProfilePopoverOpen = false" />
              <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <UButton class="cursor-pointer" icon="i-lucide-log-out" color="error" variant="ghost" label="Logout" block
                @click="handleLogout(); isDesktopProfilePopoverOpen = false" />
            </div>
          </template>
        </UPopover>
      </ClientOnly>

    </div>

  </header>


</template>
