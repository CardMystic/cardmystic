import { execSync } from 'child_process';
import devtoolsJson from 'vite-plugin-devtools-json';
import staticWebAppConfig from './public/staticwebapp.config.json';
import { DEFAULT_SEARCH_QUALITY_RATIOS } from './utils/searchQuality';

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
  ssr: true,
  app: {
    head: {
      title: 'CardMystic - Smart Search Engine for Magic: The Gathering',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        {
          name: 'description',
          content:
            'Search Magic: The Gathering cards using natural language. Find MTG cards by describing what you want in plain English.',
        },
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // Verify AdSense ownership without loading ads while awaiting approval.
        {
          name: 'google-adsense-account',
          content: 'ca-pub-8668014466736799',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2' }],
    },
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  compatibilityDate: '2025-05-15',
  css: ['~/assets/css/main.css'],
  devtools: {
    enabled: true,
  },
  devServer: {
    port: process.env.NUXT_PORT ? parseInt(process.env.NUXT_PORT) : 5173,
  },
  build: {},
  nitro: {
    azure: {
      // The Azure preset otherwise falls back to Node 18 for engines ranges.
      // Share the runtime and routing settings with the generated SWA config.
      config: staticWebAppConfig,
    },
  },
  runtimeConfig: {
    // The private keys which are only available server-side
    backendUrl: 'http://localhost:3000',
    // Keys within public are also exposed client-side
    public: {
      commitHash: getCommitHash(),
      recaptchaSiteKey: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      backendUrl:
        process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
      maintenanceMode: process.env.NUXT_PUBLIC_MAINTENANCE_MODE || '',
      // Override with matching NUXT_PUBLIC_* environment variables at startup/build.
      smartSearchQualityRatio: DEFAULT_SEARCH_QUALITY_RATIOS.smart,
      similaritySearchQualityRatio: DEFAULT_SEARCH_QUALITY_RATIOS.similarity,
      // This is a public browser project key, not a PostHog personal API key.
      posthogKey:
        process.env.NUXT_PUBLIC_POSTHOG_KEY ??
        'phc_unytRsmdB7UFsyGafmA5JsnsEU7r9SBH7SM2sWmG3LfQ',
      posthogHost:
        process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      posthogEnabled: process.env.NUXT_PUBLIC_POSTHOG_ENABLED ?? 'true',
    },
  },
  plugins: ['~/plugins/vue-query.ts'],
  modules: ['@nuxt/ui', 'nuxt-vitalizer'],
  icon: {
    // Keep plus icons immediately available. A delayed loading icon can otherwise
    // race a name change and register its CSS under the plus icon's selector.
    clientBundle: {
      icons: ['heroicons:plus', 'lucide:plus'],
    },
  },
  vitalizer: {
    // Avoid speculative downloads of unused legacy SVG font resources.
    disablePrefetchLinks: true,
  },
  hooks: {},
  routeRules: {
    '/': {
      prerender: true,
    },
    '/about': {
      prerender: true,
    },
    '/privacyPolicy': {
      prerender: true,
    },
    // Settings moved to the combined Account page
    '/user/profile': {
      redirect: '/user/account',
    },
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
    ssr: {},
    plugins: [
      ...(process.env.NODE_ENV === 'development'
        ? [devtoolsJson() as any]
        : []),
    ],
    css: {
      preprocessorOptions: {
        sass: {},
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue'],
            tanstack: ['@tanstack/vue-query'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  },
});
