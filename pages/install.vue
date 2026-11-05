<script setup lang="ts">
defineOptions({ name: 'InstallCardMysticPage' });
useSeoMeta({
  title: 'Install CardMystic | CardMystic',
  description:
    'Add CardMystic to your home screen or desktop with the CardMystic app icon.',
});
const app = useNuxtApp();
const platform = ref<'ios' | 'android' | 'mac' | 'desktop'>('desktop');
onMounted(() => {
  const ua = navigator.userAgent;
  platform.value =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      ? 'ios'
      : /Android/.test(ua)
        ? 'android'
        : /Macintosh/.test(ua)
          ? 'mac'
          : 'desktop';
});
const error = ref('');
async function install() {
  try {
    await app.$pwaInstall?.install();
  } catch {
    error.value =
      'Your browser could not open the installer. Use the steps below.';
  }
}
</script>
<template>
  <div class="mx-auto max-w-2xl py-10 px-4 space-y-6">
    <img
      src="/android-chrome-192x192.png"
      alt="CardMystic logo"
      width="96"
      height="96"
      class="rounded-2xl"
    />
    <h1 class="text-3xl font-bold">Install CardMystic</h1>
    <p>
      Add CardMystic to your home screen or desktop. It opens in its own window
      and keeps the same account and features. An internet connection is
      required for searches and deck changes.
    </p>
    <ClientOnly
      ><p v-if="app.$pwaInstall?.installed.value" role="status">
        CardMystic is running as an installed app.
      </p>
      <UButton
        v-else-if="app.$pwaInstall?.available.value"
        label="Install CardMystic"
        icon="i-lucide-download"
        @click="install"
    /></ClientOnly>
    <p v-if="error" role="alert" class="text-error">{{ error }}</p>
    <USelect
      v-model="platform"
      aria-label="Installation device"
      :items="[
        { label: 'iPhone / iPad', value: 'ios' },
        { label: 'Android', value: 'android' },
        { label: 'Mac', value: 'mac' },
        { label: 'Windows / Linux', value: 'desktop' },
      ]"
      class="w-full"
    />
    <ol v-if="platform === 'ios'" class="list-decimal pl-6 space-y-3">
      <li>Open CardMystic in Safari.</li>
      <li>
        Tap Share, then Add to Home Screen. You may need to scroll through the
        sharing options.
      </li>
      <li>Keep “Open as Web App” enabled if shown, then tap Add.</li>
    </ol>
    <ol v-else-if="platform === 'android'" class="list-decimal pl-6 space-y-3">
      <li>Open CardMystic in Chrome.</li>
      <li>
        Open the three-dot browser menu and choose Install app or Add to Home
        screen.
      </li>
      <li>Confirm Install or Add.</li>
    </ol>
    <ol v-else-if="platform === 'mac'" class="list-decimal pl-6 space-y-3">
      <li>In Safari on macOS Sonoma or later, choose File → Add to Dock.</li>
      <li>
        In Chrome or Edge, use the install icon in the address bar or the
        browser menu’s install-app option.
      </li>
      <li>Confirm the CardMystic name and logo.</li>
    </ol>
    <ol v-else class="list-decimal pl-6 space-y-3">
      <li>Open CardMystic in Chrome or Edge.</li>
      <li>
        Use the install icon in the address bar, or open the browser menu and
        choose Install CardMystic / Install this site as an app.
      </li>
      <li>
        Confirm Install. If your browser does not offer installation, use Chrome
        or Edge or bookmark the site.
      </li>
    </ol>
    <p class="text-sm text-muted">
      Menu wording varies by browser version. You can remove the app through
      your device's normal app settings.
    </p>
  </div>
</template>
