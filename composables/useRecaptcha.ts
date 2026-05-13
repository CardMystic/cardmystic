export const useRecaptcha = () => {
  const config = useRuntimeConfig();
  const siteKey = config.public.recaptchaSiteKey;

  // Lazily inject the reCAPTCHA script the first time it's needed,
  // rather than loading it eagerly on every page from a Nuxt plugin.
  // The Google script is ~365kB transfer + ~800ms of bootup time, but
  // it's only used on the login + register flows, so loading it up
  // front would tax every other page for no benefit.
  let scriptLoadingPromise: Promise<void> | null = null;
  const ensureRecaptchaLoaded = (): Promise<void> => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('reCAPTCHA requires a browser'));
    }
    if (!siteKey) {
      return Promise.reject(new Error('reCAPTCHA site key not configured'));
    }
    if (window.grecaptcha) return Promise.resolve();
    if (scriptLoadingPromise) return scriptLoadingPromise;

    scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-recaptcha="1"]',
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('Failed to load reCAPTCHA')),
          { once: true },
        );
        return;
      }
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      s.async = true;
      s.defer = true;
      s.dataset.recaptcha = '1';
      s.addEventListener('load', () => resolve(), { once: true });
      s.addEventListener(
        'error',
        () => reject(new Error('Failed to load reCAPTCHA')),
        { once: true },
      );
      document.head.appendChild(s);
    });
    return scriptLoadingPromise;
  };

  const executeRecaptcha = async (action: string): Promise<string> => {
    await ensureRecaptchaLoaded();
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }

      if (!siteKey) {
        reject(new Error('reCAPTCHA site key not configured'));
        return;
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: Error) => {
            reject(error);
          });
      });
    });
  };

  const verifyRecaptcha = async (action: string): Promise<boolean> => {
    try {
      const token = await executeRecaptcha(action);
      const response = await $fetch<{
        success: boolean;
        score?: number;
        message?: string;
      }>(`${config.public.backendUrl}/recaptcha/verify`, {
        method: 'POST',
        body: {
          token,
          action,
        },
      });
      return response.success;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      return false;
    }
  };

  return {
    executeRecaptcha,
    verifyRecaptcha,
  };
};

// Extend window type for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}
