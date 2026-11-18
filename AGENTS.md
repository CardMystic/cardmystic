# Branches and commits

Name every feature branch `Andrew/name` with a capital A and a short, descriptive name after the slash. Split changes into commits by functionality. Write descriptive commit messages in Andrew’s language, following his recent commits in the repository. Describe what changed and include the reason or user-visible behavior when it helps explain the change.

# Deployment

Use the existing requested branch and keep commits split by functionality. Before pushing, inspect staged and unstaged changes and unpublished commits so the release includes the intended work without sweeping in unrelated worktrees. Follow an explicitly requested branch name even when it differs from the default capitalization above.

Run the checks required by the user and the focused checks described below before release. For frontend browser tests, use a production build. The local backend currently permits `http://localhost:5173`; an alternate port or `127.0.0.1` origin can produce `403 Origin not allowed` even when the app is correct. If the dev server occupies that address, stop it temporarily and restore it afterward. Do not loosen production origin checks to make tests pass.

Merge through `dev`, then `main`, preserving the separate commits with merge commits. The frontend requires pull requests; use feature → dev and dev → main PRs rather than direct pushes. When multiple services change, release research first, backend second, and frontend last. Release only repositories that actually changed. Do not interrupt active data collection or publication jobs to deploy unrelated application changes.

The frontend dev Azure Static Web App is currently removed to save money. Its deployment can fail with “No matching Static Web App was found or the api key was invalid.” This known missing dev target does not block main deployment. Verify that this is the actual failure; do not dismiss build failures, failing tests, or production deployment errors. Research dev availability is separate and must be checked independently.

Keep the existing build paths: pnpm for local development and tests, and the configured npm/Oryx build for Azure Static Web Apps. Research deploys to staging first; require `/health` to report `ready` with the new workflow run's `build_id` before swapping into production. A healthy response from the old container is not enough.

After a frontend PR is merged, cancel its superseded browser run if main's run uses the same test account, so concurrent cleanup and mutations cannot interfere. Keep main's validation running. The browser job currently allows 40 minutes including dependency installation; inspect a timeout's logs and review test scope before increasing it. Do not repeatedly rerun the same passing local checks while waiting for CI.

After deployment, verify the live frontend commit from its footer, research's expected build ID and readiness when relevant, and representative live flows such as search and deck loading. Report the deployed changes, checks and any remaining failures clearly. Keep secrets and filled login snapshots out of tool output and release notes. Leave database migrations to the operator as described below.

# Tests

Keep the end-to-end suite focused on critical user flows: authentication and permissions, search submission, saving and editing data, checkout, and recovery from failures that could lose work or block a task. Do not add unnecessary E2E tests. Before adding one, check existing coverage and explain what distinct failure requires a real browser. Prefer extending an existing flow or using a unit test for matching, parsing, validation, and other pure logic.

Use representative cases for shared components. Do not multiply the same flow across routes, viewports, themes, accounts, or inputs unless those cases exercise different behavior. Avoid standalone browser tests for copy, decorative styling, exact spacing, or static configuration. Keep necessary hydration, accessibility, mobile, and crawlability checks in the relevant flow rather than adding separate page-load matrices.

Consider runtime as well as test count. Avoid fixed sleeps, repeated navigation, and live backend calls when a deterministic fixture covers the behavior; retain a small set of real backend integration flows. Do not combine unrelated tests just to lower the count. When changing a feature, remove or consolidate redundant coverage and run the smallest relevant checks. Do not increase suite timeouts to accommodate test growth without first reviewing the suite.

# Content preferences

Keep product copy simple. Do not add labels, disclaimers, or explanations that repeat what is already obvious from the surrounding UI. For example, homepage feature previews do not need an "Example deck" label. Add explanatory text only when it helps the user understand or use the feature.

# Animation preferences

Do not add reduced-motion handling, media queries, or animation-skipping behavior unless the user explicitly requests it. Keep requested demo animations running regardless of the system motion preference.

# Icons and action colors

Use the same icon or logo and semantic color for the same action everywhere, including hovered previews, modals, toolbars, and mobile layouts. Choose the button variant (solid, outline, soft, or ghost) for the emphasis needed in each context. Reuse a shared action definition when an action appears in multiple places, and check its other entry points when changing its appearance.

# Shared interactions

Give users convenient ways to reach a feature wherever they need it. Route those entry points to the same controls and workflow so users only have to learn it once. For example, editing a card’s tags from its modal or from the tags beneath the card should open the same editor.

Keep shared controls in the same relative order, group, and location across previews, modals, toolbars, and responsive layouts. When space or permissions change which controls appear, preserve the order of those that remain, including the keyboard focus order. Define the order once when multiple views present the same actions.

# Loading skeletons

Whenever you change a UI, update its loading skeletons in the same change so they match the loaded content, order, and layout on mobile and desktop.

# Hydration

Render the same content on the server and on the first client render. Reuse the serialized data for that first render. Apply browser preferences, session changes, and viewport-dependent behavior after mount. Give server-rendered dates and numbers a consistent locale and time zone where relevant.

For changes to server-rendered views, exercise a direct load and reload against a production build. Check the initial HTML and fail the relevant browser test on hydration warnings or errors. Cover signed-in and signed-out sessions and delayed requests when they affect what the page displays.

# Input readability and accessibility

Use a font size of at least 1rem for text in every input, textarea, select, autocomplete, and editable surface, including compact controls on mobile. Check the computed size when overriding shared styles.

Use semantic HTML, accessible names and labels, visible keyboard focus, adequate contrast, and text alternatives for meaningful images. Make each interaction work by keyboard. In dialogs, manage focus on open and return it to the trigger on close. Expose validation errors and meaningful status changes to assistive technology. Verify the changed flow by keyboard and check its accessible roles and names.

# User font size

Respect the browser default font size. Use rem or em for text and text-dependent spacing and breakpoints. Allow labels, buttons, and rows to wrap or grow. Truncate secondary text only when the full value is accessible. Keep primary actions, values, and keyboard focus visible. Check changed screens at the default size and at 200% text on a narrow viewport. Allow vertical scrolling and avoid shrinking text to undo the user's preference.

# Links and crawlability

Link meaningful mentions to their existing destination. For example, link “Themes” to the themes directory, a named theme to its theme page, and a printing’s set name to its set page. Use descriptive link text and the canonical URL.

Render links in visible public content as anchors with real hrefs in the initial HTML. Verify that they work with JavaScript disabled. If doing so would cause a significant performance problem, explain the tradeoff and ask before making an exception. Content that appears only after interaction, such as a card modal, can render its links when opened. Use buttons for actions and keep private data private.

# SEO metadata

Add rich, page-specific metadata whenever you create a public page. Update it in the same change when the page's content, URL, imagery, or visibility changes. Keep the title, description, canonical URL, Open Graph and Twitter cards, and relevant structured data consistent with the visible page. Reuse public content and the shared SEO helpers. Verify the initial HTML directly, including indexing rules for private content, drafts, and ad-hoc searches.

# Database review

Whenever a change adds or alters a database access pattern, check its filters, joins, sorts, foreign keys, constraints, and row-level policies against existing indexes and the intended access rules. Use read-only catalog checks and representative query plans to confirm what is needed. Provide the operator with the exact SQL, where and when to apply it, and how to verify and roll it back. Leave database changes and migration application to the operator.
