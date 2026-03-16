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

| Category  | Count | Example slugs                                                |
| --------- | ----- | ------------------------------------------------------------ |
| similar   | 76    | sol-ring, rhystic-study, dockside-extortionist, edgar-markov |
| keyword   | 47    | flying, deathtouch, cascade, treasure-tokens, infect         |
| commander | 35    | graveyard-recursion, dragons, vampires, blink-flicker        |
| arena     | 35    | black-removal, board-wipes, planeswalkers, sagas             |
| mtgo      | 35    | best-legacy-cards, combo-pieces, storm-cards, hatebears      |
| modern    | 35    | best-creatures, burn-spells, sideboard-cards, cascade-cards  |
| ai        | 35    | best-card-draw, best-mana-rocks, best-eldrazi, best-dragons  |

Example URLs:
/ai/best-card-draw
/modern/burn-spells
/mtgo/best-legacy-cards
/arena/black-removal
/commander/graveyard-recursion
/keyword/flying

### Similar cards section

- Includes all cards from [Moxfield Commander Brackets Game Changers](https://moxfield.com/commanderbrackets/gamechangers)
- Plus popular commander staples (Edgar Markov, Ur-Dragon, Atraxa, Muldrotha, etc.)

## 5. Platform & Format Landing Pages

### What they are

- Dedicated search pages pre-configured for a specific platform or format
- Each page embeds the full `<Search>` component with default filters applied

### Where they live

- **Filesystem:** `pages/seo/{platform}/{page}.vue`
- **URL:** `/{platform}/{page}` (same `/seo/` stripping as slug pages)

### Current landing pages

| Platform | Pages                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Arena    | /arena/search, /arena/similarity-search, /arena/deckbuilder, /arena/commander-search |
| MTGO     | /mtgo/search, /mtgo/similarity-search, /mtgo/deckbuilder, /mtgo/commander-search     |
| Modern   | /modern/search, /modern/similarity-search                                            |

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
