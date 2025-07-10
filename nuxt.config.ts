import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { execSync } from 'child_process';

// Get the current git commit hash
function getCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not get git commit hash:', error);
    return 'unknown';
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {},
  compatibilityDate: '2025-05-15',
  devtools: {
    enabled: true,
  },
  devServer: {
    port: process.env.NUXT_PORT ? parseInt(process.env.NUXT_PORT) : 5173,
  },
  build: {
    transpile: ['vuetify'],
  },
  runtimeConfig: {
    // The private keys which are only available server-side
    backendUrl: 'http://localhost:3000',
    // Keys within public are also exposed client-side
    public: {
      commitHash: getCommitHash(),
    },
  },
  plugins: ['~/plugins/vue-query.ts'],
  modules: [
    '@nuxtjs/google-fonts',
    '@vee-validate/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error transformAssetUrls is not typed in vite-plugin-vuetify
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  googleFonts: {
    families: {
      'Alfa+Slab+One': true,
    },
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
    plugins: [],
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vuetify: ['vuetify'],
            'vue-vendor': ['vue', '@vue/runtime-core'],
            tanstack: ['@tanstack/vue-query'],
          },
        },
      },
    },
  },
});
