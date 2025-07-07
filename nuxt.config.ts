import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: {
    port: process.env.NUXT_PORT ? parseInt(process.env.NUXT_PORT) : 5173,
  },
  build: {
    transpile: ['vuetify'],
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
    }
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
    plugins: [
    ],
    vue: {
      template: {
        transformAssetUrls,
      },
    }
  },
});