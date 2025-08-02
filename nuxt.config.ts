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
  css: ['~/assets/css/main.css'],
  devtools: {
    enabled: true,
  },
  devServer: {
    port: process.env.NUXT_PORT ? parseInt(process.env.NUXT_PORT) : 5173,
  },
  build: {},
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
    '@nuxt/ui',
    '@vee-validate/nuxt',
    '@nuxtjs/device',
    'nuxt-vitalizer',
  ],
  fonts: {
    families: [{ name: 'Alfa Slab One', provider: 'google' }],
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
    ssr: {},
    plugins: [],
    css: {
      preprocessorOptions: {
        sass: {
          api: 'modern-compiler',
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', '@vue/runtime-core'],
            tanstack: ['@tanstack/vue-query'],
          },
        },
      },
    },
  },
});
