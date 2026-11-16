<script setup lang="ts">
import { siteNavigation, utilityNavigation } from '~/utils/site-navigation';
const route = useRoute();
const ClipboardMenu = defineAsyncComponent(
  () => import('~/components/clipboard/ClipboardMenu.vue'),
);
import { useUserProfile } from '~/composables/useUserProfile';

const {
  public: { maintenanceMode },
} = useRuntimeConfig();

const isOpen = ref(false);
const profileOpen = ref(false);
const isMounted = ref(false);

const { userProfile, profileData, profileIconUrl, signOut, loading } =
  useUserProfile();
const myDecks = computed(() => ({
  label: 'My Decks',
  icon: 'i-lucide-layers',
  to: isMounted.value && userProfile.value ? '/lists' : '/build',
}));
const isAuthor = computed(() => !!profileData.value?.is_author);
const articlesNavLabel = computed(() =>
  isAuthor.value ? 'Your Articles' : 'Liked Articles',
);
const profileLinks = computed(() => [
  myDecks.value,
  { label: 'History', icon: 'i-lucide-history', to: '/user/history' },
  {
    label: articlesNavLabel.value,
    icon: 'i-lucide-newspaper',
    to: '/articles/mine',
  },
  { label: 'Account', icon: 'i-lucide-user-cog', to: '/user/account' },
]);
const router = useRouter();

const handleLogout = async () => {
  await signOut();
  router.push('/');
};

onMounted(() => {
  isMounted.value = true;
});

const props = defineProps<{
  isFixed?: boolean;
}>();

function closePopover() {
  isOpen.value = false;
  profileOpen.value = false;
}

const { data: collections, status: collectionStatus } =
  useNavigationCollections();
const searchItems = computed(() =>
  siteNavigation(collections.value, collectionStatus.value),
);
const desktopItems = computed(() => [
  ...searchItems.value,
  { label: 'More', icon: 'i-lucide-ellipsis', children: utilityNavigation },
]);
const mainItemsMobile = computed(() => [
  ...searchItems.value,
  ...utilityNavigation,
  { label: 'Install CardMystic', icon: 'i-lucide-download', to: '/install' },
]);
watch(() => route.fullPath, closePopover);
</script>

<template>
  <header
    :class="[
      props.isFixed ? 'fixed' : 'sticky',
      'inset-x-0 top-0 z-50 border-b border-default bg-default dark:bg-gray-950/90 backdrop-blur',
    ]"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 rounded-md bg-default p-2 text-highlighted"
      >Skip to main content</a
    >
    <div
      class="mx-auto flex w-full items-center gap-1 px-2 py-2 sm:gap-2 sm:px-4 min-[1600px]:justify-center min-[1600px]:py-4"
    >
      <UPopover
        v-model:open="isOpen"
        :content="{ align: 'start', sideOffset: 6 }"
      >
        <UButton
          class="size-11 justify-center min-[1600px]:hidden"
          color="neutral"
          variant="subtle"
          icon="i-lucide-menu"
          aria-label="Open navigation menu"
        />
        <template #content>
          <div
            class="w-80 max-w-[calc(100vw-1rem)] max-h-[min(32rem,var(--reka-popover-content-available-height))] overflow-y-auto overscroll-contain rounded bg-default p-2 shadow"
          >
            <SiteNavigation :items="mainItemsMobile" orientation="vertical" />
          </div>
        </template>
      </UPopover>

      <NuxtLink
        to="/"
        aria-label="CardMystic Logo"
        class="mr-auto flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-primary min-[1600px]:mr-3"
      >
        <img
          src="/wizard_black.svg"
          alt=""
          class="size-9 object-contain dark:hidden min-[1600px]:size-12"
        />
        <img
          src="/wizard.svg"
          alt=""
          class="hidden size-9 object-contain dark:block min-[1600px]:size-12"
        />
        <img
          src="/cardmystic-white.svg"
          alt=""
          width="2082"
          height="307"
          class="hidden h-auto w-36 invert sm:block dark:invert-0 min-[1600px]:w-44"
        />
      </NuxtLink>

      <div class="hidden items-center min-[1600px]:flex">
        <SiteNavigation :items="desktopItems" />
        <div class="mx-2 h-6 w-px bg-accented" aria-hidden="true" />
        <UButton
          to="/install"
          icon="i-lucide-download"
          aria-label="Install CardMystic"
          variant="ghost"
          color="neutral"
          class="size-11 justify-center"
        />
      </div>
      <UButton
        v-bind="myDecks"
        :prefetch="false"
        variant="ghost"
        color="neutral"
        class="min-h-11 shrink-0 whitespace-nowrap"
      />
      <ClipboardMenu />
      <UButton
        v-if="!isMounted || (!userProfile && !loading)"
        to="/user/login"
        icon="i-lucide-user"
        aria-label="Login"
        class="min-h-11 min-w-11 justify-center"
      >
        <span class="hidden min-[360px]:inline">Login</span>
      </UButton>
      <span
        v-else-if="loading"
        role="status"
        class="flex size-11 shrink-0 items-center justify-center"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="size-6 animate-spin text-primary"
        />
        <span class="sr-only">Loading profile</span>
      </span>
      <UPopover v-else v-model:open="profileOpen" :content="{ align: 'end' }">
        <UButton
          aria-label="Profile"
          color="neutral"
          variant="ghost"
          class="size-11 justify-center rounded-full p-0"
          :icon="profileIconUrl ? undefined : 'i-lucide-user'"
        >
          <img
            v-if="profileIconUrl"
            :src="profileIconUrl"
            alt=""
            class="size-10 rounded-full border-2 border-primary object-cover"
          />
        </UButton>
        <template #content>
          <div
            class="flex max-h-[var(--reka-popover-content-available-height)] flex-col gap-1 overflow-y-auto rounded bg-default p-2"
          >
            <UButton
              v-for="link in profileLinks"
              :key="link.to"
              v-bind="link"
              :prefetch="false"
              color="neutral"
              variant="ghost"
              class="min-h-11 justify-start"
              @click="closePopover"
            />
            <USeparator />
            <UButton
              label="Logout"
              icon="i-lucide-log-out"
              color="error"
              variant="ghost"
              class="min-h-11 justify-start"
              @click="
                closePopover();
                handleLogout();
              "
            />
          </div>
        </template>
      </UPopover>
    </div>
    <div
      v-if="maintenanceMode === 'enabled'"
      class="flex items-center justify-center gap-2 bg-yellow-500 px-4 py-1 text-sm font-medium text-black"
    >
      <UIcon name="i-lucide-alert-triangle" class="size-4 shrink-0" />
      <span
        >CardMystic is currently under maintenance and may not work properly. We
        apologize for the inconvenience.</span
      >
    </div>
  </header>
</template>
