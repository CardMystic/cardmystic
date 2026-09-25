# CardMystic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Support on Patreon](https://img.shields.io/badge/support-patreon-F96854.svg)](https://www.patreon.com/thecardmystic)

<div align="center">
  <img src="public/wizard.webp" alt="CardMystic" width="150"/>
</div>

🧙‍♂️ Check it out: [https://cardmystic.com](https://cardmystic.com)

Magic: The Gathering is a complex and intricate game, but finding cards shouldn't be. Our developers decided that traditional keyword search engines fall short. They require exact wording and an intimate knowledge of Magic terms.

CardMystic makes card discovery effortless with natural language search. Just type what you're thinking: “a blue creature that draws cards” or “a cheap red burn spell” and let CardMystic handle the rest. Whether you're a seasoned deckbuilder or brand new to the game, CardMystic helps you find the perfect card without the guesswork.

This project uses Vue & Nuxt as well as the Vuetify component library.

## ✨ Features

- Smart Search for MTG cards: Find cards using natural language queries (semantic/semantic search)
  - Example Query: [X Spell Board Wipes](https://cardmystic.com/search/all/smart?query=x+spell+board+wipes)
- Similarity search: find cards similar to a given card
  - Example Query: [Lightning Bolt](https://cardmystic.com/search/all/similarity?card_name=Lightning+Bolt)
- Commander search: Smart search specifically for legendary creatures
- Reranking toggle in Smart and Commander search: on by default, with a second relevance pass that can improve matches but takes longer. Turn it off to compare the original search order. Switching refreshes the current results and preserves the choice in the URL (`useRerank=false` or `true`); each mode is cached separately. With no explicit sort selected, results preserve the server ranking, including within groups. Selecting a sort such as price or Smart Score overrides that order. Turning reranking on clears any selected sort and restores the server ranking. Smart Score and the displayed match percentage remain the original ColBERT score; ordinary searches request up to 100 cards in either mode. Ungrouped results paginate 40 cards at a time; grouped results show complete groups without pagination.
- Keyword search: traditional text-based card search
- Deck Recommender (ALS): Paste a decklist and/or select a commander to get personalized card recommendations
- Platform-specific search: search filtered to Arena, MTGO, Modern, or Paper cards
  - Example: [Arena Smart Search](https://cardmystic.com/search/arena/smart)
- Deck Lists: Create and manage your decks with our deck builder interface.
- User accounts with authentication (Supabase)
- Filter by colors, types, converted mana cost, power/toughness, etc.
- View card details including different printings, price, and legality
- Frontend & Backend caching
- Example queries to help you get started
- View Top Searches of the week
- Report issues or suggest features directly from the app
  - Report incorrect search results
- Link directly to TCGPlayer to purchase cards
- Extensive data validation

## 🛣️ Roadmap

- Image-based search
- Browser Extension

## 🤝 Contributing

We welcome pull requests and feedback!  
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and coding guidelines.

## 🖥️ Server

The CardMystic server code is not contained in this repository. Browser requests go through the private server gateway in `server/api/backend/[...path].ts`.

Backend API documentation requires the private service key.

## 🤖 Models

The models used for this project are our "Secret Sauce" and will be kept private. Extensive research and iterations have gone into creating the models that power CardMystic's search capabilities.

- **ColBERT**: Powers the AI / semantic search and commander search
- **ALS (Alternating Least Squares)**: Powers the deck recommendation system, suggesting cards based on your decklist and/or commander

## 🛠️ Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

Configure environment variables (and edit as needed):

```bash
cp .env_defaults .env
```

### PostHog analytics

PostHog is configured with CardMystic's public project key and US ingestion host.
The browser-only plugin captures page views and interactions after Analytics
consent. Google Ads conversion tracking requires separate Advertising consent.
Cookie settings in the footer let visitors change their choices. Account
identification and session replay are disabled. Production and staging use
separate browser cookies.

Analytics is disabled during `nuxt dev` and on localhost, including local
production previews. To disable it on a deployment, set
`NUXT_PUBLIC_POSTHOG_ENABLED=false`. To use a different project, set
`NUXT_PUBLIC_POSTHOG_KEY` and `NUXT_PUBLIC_POSTHOG_HOST`. These are public
browser settings; never use a PostHog personal API key here. Supply overrides
when building and redeploy so prerendered pages receive the same settings.

To verify a deployment, visit it, navigate to another page, and check for
`$pageview` events in PostHog's activity feed.

### Development Server

Start the development server on `http://localhost:5173`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 🧪 Testing

CardMystic has two complementary test suites:

| Suite             | Tool                                  | Scope                                     | Command         |
| ----------------- | ------------------------------------- | ----------------------------------------- | --------------- |
| Unit tests        | [Vitest](https://vitest.dev/)         | Pure utils (`utils/`, `models/`, etc.)    | `pnpm test`     |
| Integration / E2E | [Playwright](https://playwright.dev/) | Full browser flows against a real backend | `pnpm test:e2e` |

Both suites run in CI on every push/PR to `dev` and `main` (see [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)). The `e2e` job depends on `unit`, so a unit-test failure fast-fails the whole pipeline before browsers spin up.

The backend the e2e suite hits is chosen automatically from the branch:

| Trigger                                                                   | Backend                           | Research Container                     |
| ------------------------------------------------------------------------- | --------------------------------- | -------------------------------------- |
| push to `dev` / PR targeting `dev`                                        | `https://api.next.cardmystic.com` | `https://research.next.cardmystic.com` |
| push to `main` / PR targeting `main` (i.e. the `dev` → `main` release PR) | `https://api.cardmystic.com`      | `https://research.cardmystic.com`      |

### Unit tests (Vitest)

Live in [`tests/`](tests/). Run them with:

```bash
pnpm test          # one-shot
pnpm test:cov      # with coverage
```

`vitest.config.ts` excludes `e2e/**` so Playwright specs aren't picked up by Vitest.

### End-to-end tests (Playwright)

Live in [`e2e/`](e2e/). These are **integration tests** — they build the app and run the production Nitro server (`pnpm build && node .output/server/index.mjs` on port `3000`) and drive a real Chromium against the **real backend and the real Supabase project**.

The default backend (locally and on `dev` CI) is `https://api.next.cardmystic.com`. The frontend, backend, and research containers all deploy their `dev` branch to `*.next.cardmystic.com`, so running e2e against `next` validates the latest of all three together, which mirrors how PRs to `dev` are promoted. CI runs on `main` swap in `https://api.cardmystic.com` automatically.

**What's stubbed (and why)**

Only two things are stubbed because they can't be made deterministic from a headless browser:

1. **reCAPTCHA challenge + verify** — Google's invisible reCAPTCHA can't be solved by an automated browser, so [`e2e/utils/mocks.ts`](e2e/utils/mocks.ts) stubs `window.grecaptcha` and mocks the backend's `/recaptcha/verify` to accept the fake token. Real verification is covered by manual QA and the backend's own tests.
2. **Google OAuth round-trip** — Tests intercept Supabase's `/auth/v1/authorize` redirect instead of actually leaving for `accounts.google.com`. The OAuth callback regression test (Vue Router race) opts into a synthesized Supabase session via `mockSupabaseAuth` because the assertion is purely about client-side hash-fragment handling.

Everything else (login, logout, registration validation, search, etc.) hits the real backend.

**Setup**

Copy [`.env.test.example`](.env.test.example) to `.env.test` (gitignored) and fill in:

```bash
NUXT_PUBLIC_SUPABASE_URL=https://ddbgietanhxrozzmogur.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=<your-supabase-anon-key>
NUXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
NUXT_BACKEND_URL=https://api.next.cardmystic.com
NUXT_BACKEND_API_KEY=<matching-backend-service-key>

# Real Supabase test user used by login + logout tests.
# Tests skip cleanly if these are unset.
E2E_TEST_EMAIL=<test-user-email>
E2E_TEST_PASSWORD=<test-user-password>
```

In CI these come from GitHub Secrets (configured in the workflow's `env:` block).

Install Chromium once:

```bash
pnpm test:e2e:install
```

**Running**

```bash
pnpm test:e2e             # headless run, all specs
pnpm test:e2e:ui          # Playwright UI mode (recommended for debugging)
pnpm exec playwright test --project=chromium -g "Logout"   # filter by name
pnpm exec playwright test e2e/lists.spec.ts --project=chromium # run a specific file
```

The Playwright config (`playwright.config.ts`) auto-loads `.env.test` via `dotenv` and starts the dev server itself. Reports land in `playwright-report/`; failure traces in `test-results/`.

**Pointing at a different backend**

Override `NUXT_BACKEND_URL` in `.env.test` to hit prod (`https://api.cardmystic.com`) or a local backend (`http://localhost:3000`). For local backend runs you'll usually also override `NUXT_PUBLIC_SUPABASE_URL` to a local Supabase instance.

### ⚠️ Cost: stop the `next` containers when not in use

The `*.next.cardmystic.com` backend and research containers cost money to keep running. **They should be stopped when not actively being used for E2E testing.**

Workflow:

1. **Before opening a PR to `dev` (or pushing to `dev`)**: start the `api.next.cardmystic.com` and `research.next.cardmystic.com` containers so the e2e workflow can hit them.
2. **After the e2e workflow finishes** (and after any local e2e runs): stop the containers again.
3. The frontend `next.cardmystic.com` Static Web App is effectively free at idle so it can stay up.

The CI workflow does **not** start/stop containers automatically — that's a manual step on the backend side. If e2e tests fail with connection errors against `api.next.cardmystic.com`, the most likely cause is the backend container being asleep.

## Maintenance Mode

A site-wide maintenance banner can be shown on all pages by setting the `NUXT_PUBLIC_MAINTENANCE_MODE` variable to `enabled`.

The banner displays: _"CardMystic is currently under maintenance and may not work properly. We apologize for the inconvenience."_

**To enable:**

- Locally: set `NUXT_PUBLIC_MAINTENANCE_MODE=enabled` in `.env` and restart the dev server
- Production: set `NUXT_PUBLIC_MAINTENANCE_MODE=enabled` in GitHub → repo **Settings → Secrets and variables → Actions → Variables** tab, then redeploy

**To disable:** set it to `disabled` (or remove it) and redeploy.

> **Note:** Because the home page (`/`) is prerendered at build time, the banner is rendered client-side after hydration on that page. All other pages (SSR) render it server-side. This means the value is baked in at build time — a redeploy is required to change it in production.

# Updating Card Data

Card data files (`card-names.min.json`, `commanders.min.json`, `card-oracle-ids.min.json`) are generated by the backend and served via the `/bulkdata` API endpoints. The frontend fetches these using TanStack Query composables in `composables/useBulkData.ts` with a 24-hour stale time, so data stays fresh without manual updates.

- **card-names.min.json**: Autocomplete suggestions in search
- **commanders.min.json**: Autocomplete suggestions for legal commanders
- **card-oracle-ids.min.json**: Used by components for oracle-id lookups

A static copy of `card-oracle-ids.min.json` is kept in `public/` **only** for sitemap generation (`server/routes/sitemap.xml.ts`), which imports it at build time for SEO purposes.

When new Magic sets release or card data updates, the backend data files are updated automatically. Run `pnpm update:card-oracle-ids` to refresh the static sitemap data from the production oracle-ID feed, then commit the file and rebuild. The command validates the feed before replacing it, including checking that it contains oracle IDs rather than printing IDs.

# Database

The database is hosted on Supabase and stores:

- **User accounts**: Authentication and profile data (including follower counts and featured flags)
- **Card lists**: User-created card collections with metadata and social counters (likes, saves, comments, views)
- **Card list items**: Individual cards in each list, including commander designation (`is_commander`)
- **Decklist social**: Likes, saves, and comments on public decklists (`decklist_likes`, `decklist_saves`, `decklist_comments`)
- **Follows**: Follower relationships between users (`user_follows`)
- **Search history**: User search and card view history
- **Card feedback**: User feedback on search results for model improvement

## Generate Supabase Database Types

To generate the Supabase database types (when the schema changes) run:

```bash
npm run gen:types
```

### Deck display preferences

Deck display controls save automatically to `localStorage` under `cm.deck-preferences.v1:<deckId>`.

### Private API gateway

Browsers call /api/backend on the frontend. Nitro forwards permitted application
routes with a private service credential; API keys are never sent to browsers.
User Bearer tokens still authorize account and deck operations. CORS restricts
other browser origins; the public frontend gateway can still be called by
non-browser clients.

Configure **runtime application settings** on each Azure Static Web App:
NUXT_BACKEND_URL, NUXT_BACKEND_API_KEY (matching that backend's
BACKEND_API_KEY, at least 32 random printable ASCII characters without whitespace),
and NUXT_FRONTEND_URL. Build workflow variables alone do not configure runtime
secrets. Use distinct keys for production and staging. The backend separately
needs RESEARCH_API_KEY, matching the research service.

Client IP detection uses the same trusted-proxy allowlist as the backend:
Azure App Service's socket ingress and Cloudflare's published IP ranges. It
walks from the connection toward the visitor and stops at the first untrusted
address; no hop-count setting is needed. On managed Azure Functions, where Nitro
has no socket IP, it uses Azure's platform-overwritten client-ip header as the
connection peer. That fallback is enabled only when Azure's WEBSITE_INSTANCE_ID
runtime variable is present, and only the platform peer can be treated as private
Azure ingress. Other private addresses inside the forwarded chain remain
untrusted. The browser's claimed client-IP header is always replaced.

The Azure header guarantee is documented in
[Azure's header reference](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/headers.md).
Keep the Cloudflare ranges in server/utils/clientIp.ts aligned with the backend.
After deployment, verify independent rate limits for two visitors through both
the custom domain and direct Azure ingress; local tests do not verify live Azure
header availability.

Configure matching keys on all services first. Deploy the frontend gateway,
then the backend (which supplies the research key), then the research guard. Purge old API-host
CDN caches when enabling authentication. Backend health and signed Patreon
webhook/OAuth callback routes remain reachable for their dedicated integrations;
the frontend gateway does not expose diagnostics or those callbacks.

CI integration tests use BACKEND_API_KEY_PRODUCTION and BACKEND_API_KEY_NEXT
repository secrets, selected with the target branch. The Jev provider key belongs
only on the research service; see its README for the supported provider settings.

### Protected search cache maintenance

**Update the protected search/cache configuration whenever search result limits or SEO slugs change.** This includes adding, removing, or renaming slugs, changing their queries, filters, search types, or platform defaults, and changing the homepage example limit.

Keep the frontend requests, backend/research limit validation and defaults, cache keys, protected entries, and warmup requests in sync. The current limits are 100 results for normal searches and 15 for homepage examples; semantic searches have separate entries for both reranking modes.

Update the frontend export script and backend protected-search definitions as needed, then regenerate the SEO catalog from the frontend repository:

```sh
pnpm export:protected-searches
```

The source is `utils/seoQueries.ts`; the exporter is `scripts/export-protected-searches.mjs`. The generated backend file is `src/common/utils/protectedSearchCatalog.ts`, and the shared allowlist/defaults are in `src/common/utils/protectedSearches.ts`. Commit the regenerated catalog with the related changes and update the cache tests to verify the new limits and slug requests match the protected entries.
