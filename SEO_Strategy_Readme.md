# SEO, JSON-LD, and Sitemap Overview

This project uses three separate SEO mechanisms. Each one has a different job.

## Google Verification

- A one-time verification step to prove site ownership
- Implemented with a TXT DNS record on Azure (go to Azure, search DNS zone, click record sets, check the TXT record)

## 1. SEO Meta (titles, descriptions, social previews)

### What it is

- `<title>`
- `<meta name="description">`
- OpenGraph (og:\*)
- Twitter cards

### What it does

- Controls how pages appear in Google search results
- Controls Discord / Twitter / social previews

### Where it lives

- Defined per page (e.g. card detail page)
- Generated dynamically from card data

## 2. JSON-LD (structured data)

### What it is

- A `<script type="application/ld+json">` block
- Machine-readable data for search engines

### What it does

- Tells Google what a page represents
- Helps with entity understanding and indexing confidence
- Does not directly affect rankings

### How it’s used

- Homepage: identifies the site (Organization, WebSite)
- Card pages: identifies a single card (WebPage)

### Important

- JSON-LD does NOT replace SEO meta
- It complements it

## 3. Sitemap (/sitemap.xml)

### What it is

- A single XML file listing all indexable URLs

### What it does

- Helps Google discover all pages
- Helps Google crawl large numbers of pages efficiently
- Does not control page titles or descriptions

### What’s included

- Homepage
- Static pages (e.g. /about)
- Search pages (/search, /search/similarity, /search/keyword, /search/recommend)
- Platform & format landing pages (e.g. /arena/search, /mtgo/deckbuilder, /modern/similarity-search)
- SEO slug pages (e.g. /similar/sol-ring, /keyword/flying, /commander/dragons, /arena/board-wipes)
- All card pages

### What's excluded

- Filter pages
- User-specific or dynamic pages

## 4. SEO Slug Pages (high-intent search results)

### What they are

- Pre-built search result pages targeting specific high-intent queries
- Each page runs a real search query and displays results with the full Search component

### Where they live

- **Filesystem:** `pages/seo/{category}/[slug].vue`
- **URL:** `/{category}/{slug}` (the `/seo/` prefix is stripped via `pages:extend` hook in `nuxt.config.ts`)
- Categories: `similar`, `keyword`, `commander`, `arena`, `mtgo`, `modern`, `ai`

### How the routing works

- Files live under `pages/seo/` to keep the project organized
- A `pages:extend` hook in `nuxt.config.ts` rewrites `/seo/*` routes to `/*` so URLs don't contain `/seo/`
- Example: `pages/seo/arena/[slug].vue` → URL `/arena/:slug`

### Configuration

- All queries defined in `utils/seoQueries.ts`
- Each entry has: `slug`, `query`, `searchType`, optional `filters`, `title`, `description`
- Lookup maps (`similarMap`, `keywordMap`, etc.) are auto-built for O(1) slug resolution
- `getAllSeoSlugs()` exports all slugs for sitemap generation

### Current counts (~298 slugs total)

| Platform | Search Type | Count | Example slugs                                                |
| -------- | ----------- | ----- | ------------------------------------------------------------ |
| all      | similarity  | 76    | sol-ring, rhystic-study, dockside-extortionist, edgar-markov |
| all      | keyword     | 47    | flying, deathtouch, cascade, treasure-tokens, infect         |
| all      | commander   | 35    | graveyard-recursion, dragons, vampires, blink-flicker        |
| all      | ai          | 35    | best-card-draw, best-mana-rocks, best-eldrazi, best-dragons  |
| arena    | ai          | 35    | black-removal, board-wipes, planeswalkers, sagas             |
| mtgo     | ai          | 35    | best-legacy-cards, combo-pieces, storm-cards, hatebears      |
| modern   | ai          | 35    | best-creatures, burn-spells, sideboard-cards, cascade-cards  |

Example URLs:

- `/search/all/ai/best-card-draw`
- `/search/modern/ai/burn-spells`
- `/search/mtgo/ai/best-legacy-cards`
- `/search/arena/ai/black-removal`
- `/search/all/commander/graveyard-recursion`
- `/search/all/keyword/flying`
- `/search/all/similarity/sol-ring`

### Similar cards section

- Includes all cards from [Moxfield Commander Brackets Game Changers](https://moxfield.com/commanderbrackets/gamechangers)
- Plus popular commander staples (Edgar Markov, Ur-Dragon, Atraxa, Muldrotha, etc.)

## 5. Platform-Aware Routing

### What it is

- All search pages use a unified `[platform]` route parameter
- Platforms: `all`, `arena`, `mtgo`, `modern`, `paper`
- Search types: `ai`, `similarity`, `commander`, `keyword`, `deckbuilder`

### Why this matters for SEO

- **Arena, MTGO, and Modern are high-value traffic segments.** Players searching for platform-specific cards have strong purchase and engagement intent — they're actively building decks for a specific client or format.
- Dedicated `/search/arena/...`, `/search/mtgo/...`, and `/search/modern/...` URLs let Google index platform-specific landing pages separately, capturing long-tail queries like "best MTG Arena board wipes" or "MTGO legacy combo pieces" that generic `/search` pages would never rank for.
- Each platform landing page has its own SEO meta, title, and description tuned to that audience, increasing click-through rates from search results.
- Users who arrive on a platform-specific page stay in that platform context as they search and switch tabs — reducing friction and bounce rate.

### How it works

- When a user selects a platform filter (e.g. Arena) and submits a search, the route automatically updates to the correct platform (e.g. `/search/arena/ai`)
- Platform detection from filters is centralized in `utils/platformConfig.ts` via `detectPlatformFromFilters()`
- Switching search types preserves the platform from the restored session query's filters
- Search history rerun also detects platform from saved filters

### Platform filter in the UI

- The Filters component uses a radio group (not checkboxes) for platform selection
- Options: Any, Arena, MTGO, Paper
- Modern is selected via the Format filter, not the platform radio

## Using card-ids.min.json

### What it is

- A list of all canonical card IDs (oracle IDs)

### Why it matters

- Allows the sitemap to be generated:
  - Fast
  - Deterministically
  - Without external APIs

### How it’s used

- Each ID becomes one sitemap entry:
  - /card/{oracle_id}

### How to keep it updated

- Regenerate card-ids.min.json when:
  - New sets release
  - Cards are added or removed
- The sitemap updates automatically as soon as the file changes

## Mental model

- Sitemap = “These URLs exist”
- SEO meta = “This is how the page looks in search”
- JSON-LD = “This is what the page represents”

They work together, but do different jobs.
