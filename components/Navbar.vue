<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import ClipboardMenu from '~/components/ClipboardMenu.vue'
import UserLogin from '~/components/user/login.vue'
import UserRegister from '~/components/user/register.vue'

const isOpen = ref(false)
const isLoginModalOpen = ref(false)
const authMode = ref<'login' | 'register'>('login')

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

      <!-- Clipboard Button -->
      <ClipboardMenu class="cursor-pointer" />

      <!-- Login Modal -->
      <UModal label="Open" color="neutral" variant="subtle">
        <!-- Login Button -->
        <UButton class="cursor-pointer ml-2" color="primary" variant="solid" icon="i-lucide-user"
          :label="authMode === 'login' ? 'Login' : 'Register'" @click="isLoginModalOpen = true" />
        <template #content>
          <div>
            <UModalHeader :title="authMode === 'login' ? 'Sign in to CardMystic' : 'Create your CardMystic account'"
              :description="authMode === 'login' ? 'Login to access your account' : 'Register for a new account'" />
            <UserLogin v-if="authMode === 'login'" @switch-to-register="authMode = 'register'" />
            <UserRegister v-else @switch-to-login="authMode = 'login'" />
          </div>
        </template>
      </UModal>

      <!-- Logo -->
      <NuxtLink to="/" class="hover:opacity-80 transition-opacity">
        <img src="/wizard_outline.webp" alt="CardMystic Logo" class="w-10 h-10 object-contain" />
      </NuxtLink>
    </div>

    <!-- Desktop -->
    <div class="flex-row hidden md:flex">
      <!-- Logo -->
      <NuxtLink to="/" class="hover:opacity-80 transition-opacity mr-6">
        <img src="/wizard_outline.webp" alt="CardMystic Logo" class="w-12 h-12 object-contain" />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <UNavigationMenu :items="[...mainItems, ...externalItems]" :ui="{
        viewport: 'w-auto min-w-[12rem] max-w-sm',
        childList: 'w-auto flex flex-col items-start p-2 gap-2',
        content: 'w-auto'
      }" />
      <!-- Clipboard Button (always visible, right side) -->
      <ClipboardMenu class="ml-4" />

      <!-- Login Modal -->
      <UModal label="Open" color="neutral" variant="subtle">
        <!-- Login Button -->
        <UButton class="cursor-pointer ml-2" color="primary" variant="solid" icon="i-lucide-user"
          :label="authMode === 'login' ? 'Login' : 'Register'" @click="isLoginModalOpen = true" />
        <template #content>
          <div>
            <UModalHeader :title="authMode === 'login' ? 'Sign in to CardMystic' : 'Create your CardMystic account'"
              :description="authMode === 'login' ? 'Login to access your account' : 'Register for a new account'" />
            <UserLogin v-if="authMode === 'login'" @switch-to-register="authMode = 'register'" />
            <UserRegister v-else @switch-to-login="authMode = 'login'" />
          </div>
        </template>
      </UModal>

    </div>

  </header>


</template>
