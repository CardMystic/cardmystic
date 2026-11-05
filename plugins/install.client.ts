interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export default defineNuxtPlugin(() => {
  const prompt = shallowRef<InstallPrompt | null>(null);
  const installed = ref(
    window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    prompt.value = event as InstallPrompt;
  });
  window.addEventListener('appinstalled', () => {
    installed.value = true;
    prompt.value = null;
  });
  return {
    provide: {
      pwaInstall: {
        installed,
        available: computed(() => !!prompt.value),
        async install() {
          const event = prompt.value;
          if (!event) return;
          prompt.value = null;
          const result = await event.prompt();
          if (result.outcome === 'accepted') installed.value = true;
        },
      },
    },
  };
});
