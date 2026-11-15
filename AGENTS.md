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

# Links and crawlability

Link meaningful mentions to their existing destination. For example, link “Themes” to the themes directory, a named theme to its theme page, and a printing’s set name to its set page. Use descriptive link text and the canonical URL.

Render links in visible public content as anchors with real hrefs in the initial HTML. Verify that they work with JavaScript disabled. If doing so would cause a significant performance problem, explain the tradeoff and ask before making an exception. Content that appears only after interaction, such as a card modal, can render its links when opened. Use buttons for actions and keep private data private.

# SEO metadata

Add rich, page-specific metadata whenever you create a public page. Update it in the same change when the page's content, URL, imagery, or visibility changes. Keep the title, description, canonical URL, Open Graph and Twitter cards, and relevant structured data consistent with the visible page. Reuse public content and the shared SEO helpers. Verify the initial HTML directly, including indexing rules for private content, drafts, and ad-hoc searches.

# Database review

Whenever a change adds or alters a database access pattern, check its filters, joins, sorts, foreign keys, constraints, and row-level policies against existing indexes and the intended access rules. Use read-only catalog checks and representative query plans to confirm what is needed. Provide the operator with the exact SQL, where and when to apply it, and how to verify and roll it back. Leave database changes and migration application to the operator.
