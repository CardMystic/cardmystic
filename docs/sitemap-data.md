# Sitemap data

The backend publishes one `sitemap-data.json` file containing `version: 1`,
`oracleIds`, and `collectionPaths`. Paths contain only sets, themes, and roles
with cards. No user data or card descriptions are uploaded.

The existing five-minute collection refresh loop checks the normalized lists.
It writes to HF only when their contents change, including after restarts.
Publication failures do not affect searches or collection pages and are retried
on the next refresh. Concurrent writers use HF's parent-commit check.

## Initial deployment

1. Create the public HF dataset `cardmystic/sitemap` with an initial README.
2. On the production Azure backend, set `SITEMAP_HF_PUBLISH_ENABLED=true` and
   `SITEMAP_HF_TOKEN` to a fine-grained token with write access to that dataset.
   `SITEMAP_HF_REPO` defaults to `cardmystic/sitemap`. Leave publication disabled
   on local and staging backends so they cannot overwrite production data.
3. Deploy the backend first. Wait for its log confirming publication and verify
   the public file at
   `https://huggingface.co/datasets/cardmystic/sitemap/resolve/main/sitemap-data.json`.
4. Deploy the frontend. `pnpm build` runs `pnpm update:sitemap` before Nuxt builds.
   The validated JSON is bundled as a server asset, not committed to Git.

The frontend needs no HF token. To use another public dataset, set
`NUXT_SITEMAP_DATA_URL` to the full JSON URL at both build time and runtime.
Do not include tokens in that URL.

## Refresh and fallback

On the first sitemap request per server instance, the frontend loads its build
copy and checks HF. It then checks again on the first request after 24 hours.
This is request-triggered, not a timer requiring a continuously running function.
Concurrent requests share one refresh. HF requests time out after five seconds;
failed or invalid responses keep the last valid copy. Restarted instances retain
the build fallback and can fetch newer data from HF again.

CI caches `.cache/sitemap` between builds. If HF is unavailable, a validated
cached file can still be bundled. A fresh build with neither HF data nor a valid
cached copy fails clearly rather than deploying an empty sitemap. Locally, run
`pnpm update:sitemap` once before starting the dev server.

The sitemap response can also be cached by browsers/CDNs for 24 hours, so a
published update may take longer than one day to appear everywhere. Sitemap
generation does not request the backend, research service, or database.
