# Deck organization and CardMystic Pro review

Application code on this branch is for local review and has not been pushed or deployed. The organization, history and business-card database migrations were applied to shared/live Supabase on November 2, 2026. The Stripe product has not been edited.

### Database backup and migration status — November 2, 2026

The owner authorized all three migrations after a database backup. The backup is saved outside Git at `/home/andrew/backups/cardmystic/20261102T024456Z-before-deck-features.tar.gz`, with a SHA-256 sidecar and restricted file permissions. It contains the Supabase CLI role, application-schema and data exports, including 51 tables, 610 Auth users, 597 decks, 39,446 card entries and billing records. It includes Storage metadata, but not uploaded files, project secrets or platform-managed schema definitions. These are the standard Supabase logical-backup boundaries.

All exports and compressed files validated. The deck tables were restored into an isolated PGlite database with production column types, constraints and policies; applying all three migrations there preserved every restored deck and card row. This was a deck restore check, not a full Supabase restore. Earlier compatibility checks also passed existing deck creation, editing, moves, deletion, ownership and history restoration.

After approval, all three source migrations were applied together as Supabase migration `20261102143404_deck_organization_history_and_business_cards` on November 2, 2026, at 9:34 AM America/New_York. The query used a two-second lock timeout and a 30-second statement timeout. Do not reapply 008, 009 or the business-card migration to this database: their SQL is already recorded in that combined migration.

The immediate before/after checks matched: 600 decks, 39,608 card entries, nine billing accounts, identical deck/card content checksums, and unchanged policies on the existing deck tables. All existing decks have `kind = 'deck'` and no folder. The five new tables have RLS enabled; guest access to the folder-delete and history-restore functions is denied. The live homepage, memberships page, public deck search and an existing public deck endpoint returned HTTP 200. History capture is now active for future deck edits; there was no history backfill. No live customer decks were edited to test the migration.

Supabase's advisor flags the two new authenticated SECURITY DEFINER RPCs ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)). Their signed-in access is intentional: both check the requesting owner's identity, use an empty search path, and enforce folder confirmation or history revision checks. Internal history functions are not executable by client roles. Earlier unrelated advisor notices remain; this migration does not resolve them.

## Included

- My Decklists has grid/list views and sorting by name, format, creation date, or last update. Owned lists are sorted before pagination. Liked/saved lists retain their existing API and sort the current page.
- My Decklists shows folders as tiles with deck/collection counts, followed by unfiled lists. Opening a folder shows only its contents; the breadcrumb and browser Back return to the parent view. Grid and list views both support folders. Drag a deck onto a folder to move it, or use its settings button to move it on mobile. Deck settings also edit name, description, format, and visibility, with a separate delete confirmation.
- Deck settings includes Duplicate Deck. It opens an owned copy named `DECK_NAME (copy)`, preserving all boards, quantities, commanders, folder, bracket, target card budget, banner, visibility and primer. Social activity and history start fresh. The backend reads every page, keeps unfinished copies private and removes them on failure. This uses existing tables and requires no migration.
- Folders can be created, renamed, and deleted through folder settings. Deleting a folder deletes its decks and collections; nonempty folders require the exact folder name. The database function enforces confirmation and ownership in one transaction.
- Personal card tags are shared across the user's decks and collections, keyed by oracle ID. The card modal supports assigning, creating, renaming, and deleting tags. Renaming/deleting a tag affects all of that user's assignments.
- Deck grouping supports card type, color, color identity, mana value and personal tags. A multi-tag card can appear in multiple groups; board totals count it once. Set, theme and role grouping have been removed.
- Collections use the existing card-list editor, default to private, and support 50,000 card entries. Cards are sorted before pagination and displayed 100 per page. They do not get deck suggestions.
- CardMystic Pro includes Smart/keyword search within decks and collections and suggestions on owned deck pages. Trial subscribers have the same access. Search/top-up credits alone do not unlock these subscriber tools.
- Search within a list is hidden until opened. It returns at most 100 matching cards without changing the saved list. Smart results require a Jev relevance probability of at least 0.5; keyword results use the existing keyword matcher restricted to the list.
- Suggestions show 10 cards from a batch of up to 100. Adding a suggestion consumes the local queue, not another search. Empty queues refill once; an empty/error response waits for an explicit refresh rather than looping. Suggestions use the deck format and the recommender’s commander color rules. The recommender supports up to 200 distinct mainboard cards.
- Existing membership and Stripe identifiers remain `enhanced` internally. The visible membership name is CardMystic Pro, at the existing price. The search mode is also named Pro. Free daily searches and top-ups still provide access to that mode; they do not unlock the other subscriber tools.

- The cookie-choice panel appears above the sticky deck footer on mobile. It is hidden while a modal makes it inert, so it cannot cover an active dialog.

## Before testing against a database

The shared database already has `database/migrations/008_deck_organization_and_tags.sql`, 009 and the business-card migration, recorded as the combined migration above. A new isolated test database needs the same migrations in dependency order. They add folders, personal tags/assignments, and `kind`/`folder_id` on card lists. Existing lists stay decks. No billing rows or existing card data are rewritten.

The frontend and backend must both run this branch. The research service must also run this branch: it adds `/als/deck-fit`, `/als/cuts`, and a budget bound on `/als/recommend`. Existing scoped search and `/rank` are reused. No Hugging Face models, datasets, or daily-update changes are needed. Unrelated pre-existing research edits remain untouched.

## Additional deck tools

- Show more reveals another 10 already-fetched suggestions without another recommendation request.
- Export to plain text, Arena, Magic Online text, or CSV. Import CSV and common text exports (Arena, Magic Online, Moxfield, Archidekt), including sideboards, quantities, set annotations, and commander markers. Import previews before writing and adds to existing cards. Large imports use batches of 500. A partial failure stops and tells the user to check what was added before retrying; it is not an atomic replacement. MTGO `.dek` XML files and external deck URL imports are not added by this change; use text/CSV exports.
- The recommender page links back to its selected saved deck.
- Free deck history captures card/quantity/board/commander changes and deck metadata. Owners can restore any of the latest 100 saved versions. Restore adds a version, so restoring back works. Old edits made before history was enabled cannot be recovered. History excludes visibility, folders, social counters and primers. Collection history is enabled by the pending `20261104184807_collection_history.sql` migration. Records are deleted with the deck/account. Row ownership and stale-head checks are enforced in the database.
- Pro new-card alerts show an on-site section using the newest released expansion in the daily catalog. ColBERT and Jev rank cards inside that set, including cards not yet in the ALS training data. The section does not send emails, and “new” means printed in that expansion, including reprints.
- Pro target card budgets cap the estimated USD price of each suggested card. Cards priced at or below the cap are eligible; suggestions without a price are excluded while a cap is active. Deck cost and unpriced cards already in the deck do not affect eligibility, and adding a suggestion does not consume the cap. The same filter applies to new-card alerts. Prices are estimates, and manual deck edits are unrestricted.
- Pro suggested-deck matching loads automatically when a search card modal opens. Opening a card modal checks the 25 most recently edited owned decks first, ranks eligible decks, shows five matches initially, and offers more. It does not prefetch for every card. Already-present cards and illegal commander colors/formats are excluded. Ranking is within each batch; it does not claim to find the global best deck across an entire large library. Brand-new cards absent from ALS show an explicit unavailable message.
- Pro cut suggestions use leave-one-out ALS scores: a card is scored against the rest of the deck without its own signal. Up to 20 weaker fits are shown, excluding commanders and lands (including land faces). This is a suggestion, not a claim that a card is bad; no cards are removed automatically.
- Free ownership highlighting uses one selected owned collection, compares quantities by oracle ID, and supports image and text views. Green means enough copies, yellow means some, red means none. It does not reserve cards between decks or distinguish printings/finishes.
- Free deck analytics include adjustable land draw odds, card-type/role draw odds, charts and current price breakdowns. Mana color coverage and symbol/source modeling have been removed.
- Free deck tools include mana-curve and color-identity charts, land counts, an opening-hand land probability, and a full solo playtester. Commanders are excluded from the library and start in the command zone. Modal land choices are shown separately from the land-probability calculation. Practice actions do not edit the deck.
- Free deck business cards have editable playstyle, summary, win plan, optional owner-selected bracket, a main card image and up to three core cards. A banner button opens the saved card. Public decks' cards are visible to visitors; private decks' cards remain owner-only. QR download and print/save-PDF are included.
- The membership page compares free and Pro features. Search credits do not unlock subscriber tools.
- Install CardMystic is linked from the home page and desktop/mobile navigation. The manifest uses the existing CardMystic icons, app name, standalone display and theme. Device-specific instructions and supported Chromium install prompts are included. This does not add offline search or deck editing.
- The AI assistant remains design-only, as requested. See `docs/ai-deck-assistant-proposal.md` for proposed cost caps, authenticated tools and rules citations. No provider spending has been enabled, and the assistant is not advertised as an available subscription feature.

`database/migrations/009_deck_history.sql` depends on 008 and adds the owner-only revision table, capture triggers, and the atomic restore function. Both are applied to shared/live Supabase. Complete browser testing with this branch's frontend and backend before releasing the application changes.

## Validation and limits

- Frontend production build and 470 unit tests passed.
- 31 final targeted browser tests passed, covering Pro restrictions, Smart/keyword searches and ranking toggles, suggestion queue/show-more behavior, import preview and submission, export, practice hands, history restore confirmation, ownership highlighting, card-to-deck matching/addition, tags, folders, collections, installation, mobile display, existing comparison/card controls, and policy/cookie flows.
- 565 backend tests passed. TypeScript and `biome ci .` passed; new route/catalog checks were rerun after the last fixes.
- 59 research checks passed, including scoped search, budget filtering, batched deck-fit validation, excluded cuts and leave-one-out math.
- Both migrations and repository SQL assertions passed in an isolated PostgreSQL-compatible PGlite database, including ownership checks, required folder-name confirmation, cascading deletion, restoring and undoing a restore, stale-head rejection, and history retention. These tests did not write production fixtures; see the later live migration verification above.
- Browser tests use mocked API responses; the new application flows still need testing against Supabase before application release. Generated database types were updated for the new schema; the migrations are now applied.
- Large collections still load card details in batches before display. Pagination limits rendered cards, not the initial metadata download. Very large collections need a performance check before launch.

## Product image

`output/stripe/cardmystic-pro.png` is a square product image generated with the built-in image tool using the existing wizard logo as reference. Upload it and rename the existing product after review; keep the current Price ID so subscriptions continue unchanged.

Generation prompt: Square Stripe Checkout product image for CardMystic Pro, preserving the supplied wizard silhouette, purple-to-white gradient and diamond sparkles, centered on a deep navy background with a subtle purple glow, exact white text “CardMystic Pro,” no prices, slogans, Magic cards, or third-party logos.

## Other features worth considering

- A wishlist separate from owned quantities.
- A deck check for missing ramp, draw, removal and mana sources, with links to matching cards.
- Cheaper replacements for expensive cards already in a deck.
- A missing-cards export from a deck compared with a collection.

Keep basic organization, history and import/export free. Evaluate additional paid features against their actual operating costs before promising an unlimited allowance.

## Solo playtester

The free Playtest button opens a full-screen practice board. It uses the loaded mainboard and commander data without changing saved lists or calling paid search services. No backend, database, dataset, or deployment changes are needed for this feature.

- Separate card copies and a freeform battlefield. On desktop, hand, library, graveyard, exile and commander share one row. On mobile, hand cards shrink to fit in a grid; selecting Graveyard, Exile or Cmdr replaces the hand panel and shows all cards in that zone. On desktop, graveyard/exile show only their top card, or an empty card placeholder; dragging out takes that top card. Draw stays beside Hand. Scry, mill, shuffle and search are in the More menu beside Library. Cards can also move to the top or bottom of the library.
- Opening hands are immediately playable, with no Keep step. Redraw hand shuffles the current hand back and draws seven; mulligan bottoming is manual.
- Tap or click a card to open its actions, or drag it onto the battlefield. There are no corner options buttons or play-on-click shortcuts. Actions include tap/untap, change faces, turn cards face down, add named counters, create custom/common tokens or token copies, and track commander casts. Tokens leaving play disappear.
- Life, poison, energy, mana, centered turn controls, coin flips, dice, action history and 50 actions of undo/redo. No phase dropdown or stack resolution. Next turn untaps, clears mana, resets the land indicator and optionally draws once. The land icon is green before a land drop and red afterward, without enforcing a limit. Playing a land or dragging one from hand counts; fetching from the library or creating a token does not. The chosen face of a double-faced card determines whether it is a land. Undo/redo restores the count. Card size, hover previews, shortcuts and automatic draws are in Settings. Desktop cards default to 180px wide (Small 140px, Large 220px). Mobile battlefield cards are smaller, and the selected zone shows up to seven cards per row without horizontal scrolling. Mobile zone buttons also accept drops. Mobile Undo/Redo are in Settings; on short landscape screens the toolbar scrolls away so full cards fit. The mobile battlefield leaves room for the hand below it. Other card rules, mana costs, triggers and combat are manual.
- Desktop native dragging and touch pointer dragging place cards at normalized battlefield coordinates or move them between zones. Repositioning preserves tapped state, faces and counters, and is undoable. Cards stay inside the battlefield when it resizes. A 450 ms mobile hold opens card actions; moving more than 10px starts dragging and cancels the hold. Dragging and holding suppress the tap. The card modal provides keyboard moves. Scry has its own count input, with no search box.
- Closing and reopening keeps the game while its deck page remains open. Refresh/navigation ends it. Restart confirms before clearing and uses the latest deck. An edited deck does not silently replace an active game.
- Playtest opens from the compact deck toolbar and loads only when opened. Deck Stats is a separate accordion below the cards; all charts and analytics are free and load only when the accordion opens.

This is a manual solo playtester. Players handle rules, costs, combat and triggers.

Playtester checks cover state/undo, immediate opening hands, click-to-open actions, the library menu, land-drop tracking and undo, scrying several cards, free placement, graveyard/exile top-card dragging, mobile zone switching, small-screen card fitting, holding and touch dragging, and the existing export/import/history flow. Browser fixtures use mocked deck/card APIs and do not modify saved decks.

## Deck analytics

All deck charts and analytics are free. They load when Deck Stats opens, and empty decks do not mount the panel. Public deck analytics are available to guests; private analytics require the verified owner. The backend checks visibility/ownership before loading any items. Collections do not have deck analytics.

- Opening-hand land distribution and exact probabilities of drawing enough lands by a chosen turn. Users can choose whether to draw on turn one and whether to count modal land backs as lands. The calculation excludes commanders and sideboards, uses actual copy counts, caps draws at the library size, and assumes no mulligans, extra draws, ramp or tutors.
- Odds of drawing at least one card of a chosen type or existing AI-assigned role. Multiple types/roles overlap; they are not portions of one total. Role-feed failures leave other analytics usable and show a notice.
- Current estimated USD mainboard cost, including commanders, and the five largest costs by total copies. Unknown nonfoil prices are counted as missing, not zero or silently replaced with foil prices. These are the representative printings in existing card data, not the user's selected physical printings or live store quotes.
- Loading, retry, empty-deck and missing-data states. Reopening or editing the deck reloads analytics; outdated responses cannot replace a newer result. Changing probability controls is local.

This adds no AI calls, search-credit spending, datasets, schema changes or price-history storage. The membership comparison table lists analytics in both the free and Pro columns.

### Card price history

The current card data includes daily price estimates, not a dated series. See [Scryfall's card-object documentation](https://scryfall.com/docs/api/cards). The owner prefers an external API that supplies historical prices, without building a daily price archive in Supabase. Fetch the relevant history through the backend when a user opens a chart, with a bounded, expiring cache where the provider's terms allow it. This design does not need price-history database tables or a daily price import.

Match each series to a specific printing, finish, currency and price source. An oracle card's representative printing can change, and those changes must not be charted as market-price movements. Confirm historical coverage, identifier matching, commercial display rights, API cost and request limits before selecting a provider. [MTGJSON's GraphQL API](https://www.mtgjson.com/mtggraphql/) documents dated prices and currently requires a Patreon-issued access token. [TCG API](https://tcgapi.dev/api/cards/) documents a card-history endpoint, but its [pricing](https://tcgapi.dev/pricing/) requires Pro or Business for commercial use; Pro is currently $49.99/month. These are candidates, not selected or provisioned services. No history integration, historical dataset or price storage has been added.

Analytics validation: 474 frontend and 570 backend unit tests passed, including draw probabilities, commander/sideboard exclusion, modal lands, flexible costs, missing prices and access restrictions. The production build and 19 targeted browser checks passed. After tightening the mobile table spacing, both analytics browser checks passed again, including mobile overflow and desktop rendering. Browser APIs are mocked; this does not verify live billing or database configuration. Backend TypeScript and Biome pass. Lint passes for the new analytics code; a direct lint of the existing deck page still reports its pre-existing `any`, unused-variable and page-name issues.

## Deck business cards

Owners create a card from the card-shaped button at the top right of the deck banner. Once saved, the button opens the card for anyone allowed to view that deck. Owners can edit or remove it; removing a card does not remove the deck. This is free and is included in both columns of the membership feature table.

The CardMystic layout includes the live deck name, format, mainboard count and color identity, commander names, editable summary, multiple playstyle tags and win plan, the bracket saved in deck settings, and up to three core cards. It also shows a vertical mana curve, color pie chart, current estimated USD price and calculation date, plus an optional opening hand and combos. Images come from the cards already loaded for the deck. Removed cards disappear from the preview, and the main image falls back to a commander or the first card. No new card dataset or printing catalog is needed.

QR codes are generated locally with pinned `qrcode` 1.5.4 (MIT; [upstream](https://github.com/soldair/node-qrcode)) and point to `https://cardmystic.com/lists/<deck-id>`. URLs are not sent to a QR service. QR images can be downloaded as SVG; printing saves only the card, including the QR, and can be used to make a PDF. A private deck is not made public by creating a card, downloading it, or scanning its QR. The editor explains this.

`database/migrations/20261102004254_deck_business_cards.sql` adds one small record per deck with the editable fields and oracle IDs and depends on 008. It does not update existing deck rows or billing data. Read policies follow current deck visibility; write policies require ownership. A private-schema visibility predicate supports public cards even where the existing deck table only allows owner reads. Deleting a deck cascades to its business card. The migration is applied to shared/live Supabase as part of the combined migration above. Business-card text is separate from deck edit history.

The migration and SQL assertions passed in isolated PGlite, including public/guest reads, cross-owner write denial, changing public back to private, bounds, collection exclusion and cascading deletion. Browser fixtures cover free-owner creation/editing/reload/removal, visitor viewing, mobile layout, QR downloads and print output. An independent decoder read the rendered QR correctly; the sample print output is one A4 page. The database migration is verified; the new business-card UI/API flow still needs testing with this branch against Supabase before application release.

Business-card validation: 474 frontend unit tests, 573 backend tests, and 21 targeted browser tests passed. Backend TypeScript/Biome, new-code frontend lint and a frozen-lockfile install pass. The final production build used a separate temporary Nuxt build directory to avoid the running development server overwriting its generated icon templates. Seven business-card/banner browser checks then passed against that isolated build, including a check that the business-card icon actually renders. All changes remain local.


Deck page layout: Primer, Recommend, Playtest and Buy stay in the toolbar. Search Within Deck/Collection is a visible toolbar button. More contains Import / Export, Compare, Update Deck/Collection, History, Suggest Cuts and Settings. Comparison is free. Highlight and Display are icon-only ghost buttons directly beside the add-card field. Social counts and author attribution sit directly under the banner description. The old Copy control is removed in favor of Import / Export. Highlight lets users select one color, exact mana value or card type and highlights only matching cards in grid and text views. Choosing black includes multicolor cards that are black; double-faced cards use the front face for color and type. Free collection ownership remains in the same popover. Collection choices load only when ownership highlighting is selected. Closing the popover keeps the highlight active; Clear highlights removes it.


Deck suggestions fill the available row with small cards; Show more reveals the rest of the current queue without making another search. Clicking a suggested card opens the shared card modal, where Add to Deck adds it; there are no separate buttons below the cards. The target card budget is shared by suggestions and new-card alerts and saved on the owner’s deck, including across devices. An empty budget means no limit. The existing `targetBudget` API field and `target_budget` column now store this per-card ceiling; no additional migration is needed, and any saved value is kept. Apply `20261102164913_deck_target_budget.sql` before deploying the budget endpoints; it adds only a nullable, checked numeric column to `card_lists`. The budget migration was applied to Supabase on November 2, 2026. Verification found all 601 existing decks intact and no budgets set.

Business cards have a Share action for owners and visitors. Supported devices open their native share sheet; other browsers copy the link. Shared links open the saved business card directly. QR download and Print / Save PDF are also available to visitors. The editor uses Save for both creation and updates, and core cards show images without duplicate name captions.


Deck stats use a vertical mana curve and a color-identity pie with mana symbols and percentages. Mana source and color-coverage modeling have been removed; the remaining charts and draw odds are free.

Price analytics return the full ranked list, initially showing five cards; Load more expands locally and owner-only Cut removes the mainboard entry, including all copies. The next priced card replaces it after the deck refreshes. Stats and analytics load only after opening Deck Stats. Suggested cards and new-card alerts request their own results only while on screen; the shared budget first loads when either section is reached.

Card tags use chips and an autocomplete under the card/set in the modal’s left column. Removing a chip detaches the tag from this oracle card across the owner’s decks. Creating a tag adds a reusable identifier to the user’s library. Deleting a tag from the dropdown requires confirmation and removes it from all of that user’s tagged cards. Bodyless library requests omit Content-Type to avoid Fastify rejecting empty JSON bodies.


## November 4 library updates

Migration source `20261104161903_deck_library_updates.sql` was applied to shared/live Supabase on November 4, 2026 at 17:20:34 UTC, recorded as `20261104172034_deck_library_updates`. Do not reapply the source migration to this database. It adds subfolder parents, a deck bracket, business-card tags/opening hands/combos, and an atomic bulk-update function. Existing business-card playstyle/bracket fields remain; their current values are copied into the new fields. Existing deck/card rows are not removed. The folder-name index is replaced to allow the same name in different parent folders. The folder-deletion function now includes descendants and requires the folder name when any descendant contains decks or collections.

- Folders show only direct children; breadcrumbs and move menus include parent paths. My Decklists list rows show mana color symbols. The whole row opens the deck, while the settings button remains a separate control. Decks, collections, liked and saved lists retain server pagination. Standard page controls appear above left and below centered.
- Collections default to an ungrouped card grid unless the browser has saved display settings. Card Type sorting puts planeswalkers first. Smart search temporarily sorts by match percentage and shows scores on cards. Clearing/closing search restores the normal display settings and removes the score-sort option.
- History has a dedicated owner-only deck route, filters, colored additions/removals, and 20 entries per page from the latest 100 versions. Mixed bulk updates show both counts. Restore uses the latest revision ID even when browsing a filtered/older page. Bulk updates are one database transaction; derived color recalculation does not create an extra edit.
- Update Deck/Collection replaces the Bulk Edit label. Imports continue to add cards without removing existing cards. Suggestion adds show a notification. Suggested cuts appear inline above the deck; clicking a card opens the shared card modal with Remove from Deck. They keep their queue after removals.
- Tag assignment ignores duplicate rows instead of requesting UPDATE permission on the insert/delete-only assignment table. Highlights use 2px inset borders with stronger overlays. The banner fades into a dimmed, blurred copy of its own artwork.
- Deck comparison is free. Business-card charts, opening hands, combos, multi-tag playstyles and price/date are also free; all use already-loaded deck/card data. Opening-hand selections respect copy counts and exclude commanders. The bracket is edited in deck settings and read by the business card.

Before the live migration, existing organization, history and business-card SQL tests plus nested-folder/ownership/idempotent-tag/atomic-update tests passed in an isolated PGlite database. The database migration is now live; the application changes have not been pushed or deployed.

Verification for these updates: 480 frontend unit tests and 591 backend tests passed, along with all 27 selected deck/library browser flows across the initial run and corrected reruns. Seven existing membership/search browser flows also passed. Backend TypeScript and changed-backend Biome pass; focused frontend lint and the production build pass. Browser tests use mocked services; the write-flow SQL tests used an isolated database. Live migration verification is recorded below.


### Live migration verification — November 4, 2026

The user authorized this migration after the compatibility review. It ran with a two-second lock timeout and a 30-second statement timeout. The applied SQL matches source SHA-256 `8c7cd2d8e029fdc747260b2858b317bbbf78c3a6b0b13e8dccead642bd4e6fd4`; Supabase recorded version `20261104172034`.

Before/after counts and checksums matched for 609 lists, 40,574 card entries (46,630 copies), one folder, one business card, nine billing accounts, and four credit grants. The list checksum excludes the new bracket column, updated timestamp and social/view counters; the other checksums exclude only newly added columns where applicable. Existing RLS policies and RLS-enabled flags are unchanged. The new columns, valid parent-folder foreign key and sibling-name index are present, and existing business-card values were copied correctly.

An existing public deck's history snapshot reads successfully with the new bracket field. A read-only test confirms unauthenticated bulk updates fail before touching any list. Anonymous execution is denied for all three owner-facing functions; private helper functions are not executable by client roles. The security advisor's only additional finding is the intentional authenticated SECURITY DEFINER bulk-update function, which checks ownership and input limits with an empty search path. See the [Supabase advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Earlier unrelated findings are unchanged.

The live homepage, memberships page, public deck search and an existing public deck endpoint returned HTTP 200. An unauthenticated search-allowance request returned 401; signed-in allowance and checkout were not exercised in these migration checks. Billing schema and application code were not changed by this operation. No user decks were edited for verification.


## November 4 deck layout and tagging update

- Search-within-deck/collection grid cards show the same style of match bar as search cards. Preview rails and their skeletons start flush with the results.
- Multi-tagger sits beside Highlight. Choose an existing tag, select cards, and save. The API inserts up to 500 assignments atomically per request, ignores duplicates, and keeps ownership enforced by RLS. Larger selections use successive batches; retries are safe. Tag writes have a separate 180/minute allowance; assignment reads no longer consume edit quota.
- The bottom bar contains count, Buy, Deck Stats, Suggested Cards, New Cards for Deck and a scrollable Jump To menu. Mobile combines the three deck sections under Deck. Empty decks request no stats, suggestions, new-card recommendations or budgets.
- Grouping supports type, color, color identity, mana value and personal tags. Saved set/theme/role grouping falls back to no grouping. Bulk Edit is the label for both kinds of list.
- Smart autocomplete submits immediately on click or keyboard selection, shows up to 20 matches, and has an expanded curated query list. It makes no per-keystroke API requests.
- Suggested decks load only when opening a search card modal, with a one-minute user-specific browser cache invalidated on deck edits. The local ALS model compares the candidate to unseen cards with the same color identity: it must score above the median and within the top 5%. This is a recommendation threshold, not a guarantee of synergy. Legalities and commander colors still filter results. Check more examines the next 25 most recently edited decks. Research caches at most 64 deck score vectors (about 7.3 MiB with the local model). A local one-thread benchmark of 25 synthetic 100-card decks took 14 ms of model calculation, excluding network/database time; no paid AI call is made.
- The collection-history migration replaces three existing functions, preserves their names and permissions, and uses the existing owner-only revision table. No table or data is dropped. New history starts on the collection's next edit; restores also create versions. It was applied on November 4 with the summary/limit fixes recorded below.


Validation for this update: production build passed; 28 targeted browser flows passed after fixes, including mobile/desktop footer navigation, batch tagging, automatic matching and Check more, collection history, empty decks, Smart match bars, autocomplete submission, and free analytics. Focused checks passed: 41 frontend unit tests, 86 backend tests, six research tests, backend TypeScript/Biome, and five isolated SQL fixture suites. Changed component lint passes; the existing deck page still has unrelated `any`, unused-variable and page-name lint errors. Browser tests mock APIs; the collection-history SQL was initially tested locally and was subsequently applied as recorded below. No push or deployment was performed.

## Bracket badges and library columns

Owners can set, change, or clear a deck's bracket directly from its banner; an unset bracket reads “Bracket: Unknown.” Collections do not show brackets. Grid tiles show a bracket badge above Settings, and list view has aligned Name, Colors, Format, Bracket, and Updated columns with sortable headers. Badge colors progress from blue and teal to amber, orange, and red. Hover descriptions summarize [Wizards' Commander bracket guidance](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025); brackets remain owner selected.

Own-library color and bracket sorts run before pagination. Color sorting groups by number of colors and then W/U/B/R/G combinations, using the existing saved color ratios. It reads the matching owner's deck summaries in batches without reading card contents or storing new fields. Liked and saved lists retain their existing page-local sorting. The frontend and backend changes should ship together for the new sort options. This update needs no database migration.

The library now defaults to **Decks & Collections**, showing both kinds together in the current folder with shared sorting, counts, and pagination. My Decks and My Collections remain available as separate filters. Collections have their own icon/label and no bracket badge in the combined view. Both creation buttons are available there. The library requests `kind=all`; the endpoint still defaults to decks for existing callers such as deck pickers. No migration is required.


### November 4 history review fixes

History reads only one database page of precomputed summaries (20 versions by default), with database filtering/counting and a separate one-row lookup of the latest restore head. It does not fetch current list contents or revision snapshots. Each summary stores complete added/removed totals, the total number of changed card/board pairs, and at most 20 preview changes; the UI shows “and N more card changes” for larger edits. Summaries are computed on writes, and existing versions were backfilled once. The subsequent delta migration below replaces the original full-copy storage while preserving restore behavior.

The bulk-update function now honors the existing unlimited entry count for Any decks. Collections keep their 50,000-entry cap and other formats keep their 1,000-entry cap. Search-within-deck/collection captures its submitted search type so changing the selector while a request is pending cannot relabel the response or lose Smart scores.

`20261104184807_collection_history.sql` and `20261104215215_deck_history_summaries_and_bulk_limits.sql` were applied together to shared/live Supabase as **20261104220208_collection_history_summaries_and_bulk_limits** on November 4, 2026, at 5:02 PM America/New_York. Do not reapply those source files to this database. The existing application API stays compatible; application changes still require deployment. No tables or existing versions were removed.

Before/after checks matched all 610 lists, 40,651 card entries and 301 retained revisions, including full-content checksums. All 301 versions now have bounded summaries, with at most 20 changes each. Owner-only RLS and denied anonymous restore/bulk access are unchanged; clients cannot write revision summaries or execute the internal summarizer. Security-advisor findings did not increase. Live homepage and backend health returned HTTP 200.

Validation: 610 backend tests, backend build/Biome, frontend production build and six isolated database suites passed. A separate backfill check preserved complete existing list/item/version contents while verifying summary totals. Three targeted browser regressions passed: switching search mode during an in-flight request, shortened history previews with full restoration, and collection history. The isolated browser build used mocked services. No application commits were pushed.

### History storage: reversible changes

Each deck or collection keeps at most 100 history entries. Only its latest entry holds a complete reference state. Older entries store the exact previous values needed to reverse their changes, including quantities, board moves, printing IDs, commander flags and deck metadata. Unchanged cards are not copied into every entry. The first retained entry does not keep changes from before the retained window. A large bulk edit retains all changes needed for restoration; the 20-card limit applies only to the display preview, not restore data. Storage depends on the size of those changes, so 100 entries is a count limit rather than a fixed byte allowance.

Restore reconstructs the requested state by reversing the newer edits, applies it atomically through the existing owner-only RPC, and records a new edit. Restores can themselves be undone. The existing stale-head check prevents restoring over an intervening edit. Multiple statements in one edit still combine; an edit after a restore cannot overwrite an earlier history entry. The normal deck/collection tables, public RPC signature and paginated summary API are unchanged.

Source migration `20261104221448_deck_history_deltas.sql` was applied to shared/live Supabase as **20261104230621_deck_history_deltas** on November 4, 2026. Source SHA-256: `069199527a70533bc614086d90879ac2cc82dc05ddf96f5ac51a4d5b1f829c42`. Do not reapply it. Before clearing the old full copies, the migration reconstructs and compares every retained state; a mismatch aborts the transaction. It uses a two-second lock timeout and a 30-second statement timeout.

A pre-conversion backup of all 301 revisions and their associated 13 lists/886 card entries is stored outside the repositories at `/home/andrew/backups/cardmystic/20261104-history-deltas/before.json`, with a SHA-256 sidecar. The migration was first tested against this data in an isolated database: every version matched, and restore plus undo passed for all 13 lists. The seven database fixture suites also pass, including the new `database/tests/deck_history_deltas.sql` tests for exact restoration, transaction grouping, retention, stale restores and private helpers. All 33 library API tests, backend build and Biome pass. No frontend behavior changed in this storage update.

Live verification reconstructed all 301 entries and matched their original full-content/metadata checksum (`3939826b8e9c698aecac289f5be0d4c3`). Counts and checksums also matched all 610 lists and 40,651 card entries. Exactly 13 full reference states remain, one per list with history, with no full copies on older entries; the maximum history length remains 100 and summary previews remain capped at 20. Stored snapshot/change/summary JSON fell from 2,397,800 to 314,655 bytes (about 87% less). This measures JSON content, not immediate reduction of PostgreSQL's allocated disk space. Owner-only RLS and denied anonymous restore/client history writes remain intact; security-advisor findings are unchanged. Live frontend and backend health checks returned HTTP 200. No application commits were pushed.


### Search and library follow-up

The Popular navigation and Explore tabs now include Commanders by Card at `/popular-by-card/all` (also available for the existing platform filters). The selected card, optional commander query, filters and Normal/Pro choice are stored in the URL, so searches can be shared and revisited. Card details link to the standalone page. It uses the existing popular-commanders-for-card endpoint and data. Landing pages have metadata and sitemap entries; query results are marked noindex.

Deck tiles show estimated USD prices and author avatars. Prices use the existing Scryfall oracle catalog and include all boards, matching the current deck total. Missing prices are flagged as partial or unavailable rather than treated as zero. Reads are batched and bounded at 10,000 card entries across the displayed decks; reaching that limit also marks affected totals incomplete. Summary totals are cached for 60 seconds, invalidated by local deck edits and catalog replacement. No price history or new database columns are stored.

Commander pairing now supports Friends forever and exact, mutual Partner with pairs. The picker and backend validation distinguish these from ordinary Partner, while preserving Background and Doctor pairings. Existing tags are checked when selecting a tag in the multi-tagger; saving applies the selected additions and removals to the user's global card tags. The library tabs read Decks and Collections, and both creation buttons use the same style. The membership evidence divider is white.

Search failures distinguish an explicit startup response from an unavailable service and other failures. A small backend status endpoint checks research's existing health endpoint, caches readiness for five seconds and exposes no build details. The browser checks every 15 seconds for up to 12 checks, retries when ready and bounds automatic retries per search URL. Pro-ranking fallback remains visible alongside Normal results and explains that no allowance was consumed.

Deploy the backend before the frontend for the new summary fields, pairing data, batch tag removals and readiness endpoint. These changes require no database migration, dataset changes or research deployment. Nothing has been pushed.

Validation: both production builds pass, as do 482 frontend tests, 618 backend tests and eight focused Chromium browser tests against mocked services. Browser coverage includes shared commander-search URLs and mode switching, automatic startup recovery and Pro fallback, tag preselection with additions/removals, library filters, deck prices and author navigation. Mobile screenshots were checked for the new search and deck tiles. Backend Biome CI and focused lint for the changed feature components pass. Existing unrelated frontend lint errors remain in older components.


### E2E layout regression fixes

Search, recommender, feedback and popularity tests now identify actual result grids with `search-results-grid` instead of hardcoding four-column Tailwind classes. The Add to Deck test selects its action inside the open card modal, and public-deck tests check the author profile link and disabled Primer button in the compact banner. Previously skipped list tests now use Bulk Edit and Settings → Delete deck. These changes retain the existing API, result-rendering and edit assertions.

Recent Decklists now mounts synchronously inside ClientOnly. The async component previously left a brief empty gap after the SSR skeleton disappeared, allowing the featured section to enter its preload area and fetch before it should. The original mobile lazy-loading test passes without changing its assertions.

All 19 originally reported failures passed in the full Chromium run against the local backend on port 5173. That run had 278 passes, one existing skip, and a stale Bulk Edit assertion that stopped eight subsequent list tests. After fixing Bulk Edit and the newly reached legacy delete control, the complete 14-test list suite passed; across those runs all 287 active tests are verified. The production build, 482 unit tests and lint for the two changed app components also pass. Test decks are cleaned up by the existing fixtures. No changes were pushed.
