# Card rendering measurements — 2026-09-25

Production Nuxt build, Playwright Chromium, 1440×1000 viewport, median of seven
alternating 40/100-card mounts after warmup. Cards include images, action buttons,
and semantic scores. All images use one cached local asset; external requests
are blocked. Timings include Vue mounting and two animation frames, not API
latency or downloading distinct card images. CPU 4× is a browser simulation,
not a measurement on a physical phone.

| CPU | Cards | Before mount + paint | After mount + paint |
| --- | ---: | ---: | ---: |
| Normal | 40 | 196 ms | 117 ms |
| Normal | 100 | 497 ms | 286 ms |
| 4× slowdown | 40 | 864 ms | 466 ms |
| 4× slowdown | 100 | 2,059 ms | 1,169 ms |

Changes: native title tooltips and progress elements inside Card.vue, computed
image URLs, and a shared card-feedback mutation for each results section.
Copy, flip, card menus, feedback confirmation and buying links are preserved.
Native title tooltips use browser styling instead of floating Vue tooltip panels.

Decision: all searches request at most 100 cards; ungrouped views keep 40 cards
per page, while grouped views show complete groups without pagination. The
extra 60 cards still cost about 170 ms normally and 702 ms under CPU slowdown.
A temporary benchmark page was used for these measurements and removed before
the final build. This is a component-mount comparison, not an end-to-end page-load
or scrolling benchmark.
