export const useRecaptcha = () => {
  const config = useRuntimeConfig();
  const siteKey = config.public.recaptchaSiteKey;

  const executeRecaptcha = async (action: string): Promise<string> => {
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
