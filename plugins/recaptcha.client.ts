export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const recaptchaSiteKey = config.public.recaptchaSiteKey;

  if (recaptchaSiteKey) {
    useHead({
      script: [
        {
          src: `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`,
          async: true,
          defer: true,
        },
      ],
    });
  }
});
