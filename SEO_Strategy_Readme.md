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
- All card pages

### What’s excluded

- Search pages
- Filter pages
- User-specific or dynamic pages

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
