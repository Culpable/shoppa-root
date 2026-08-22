---
version: alpha
name: Shoppa Landing Site
description: Public marketing landing site for Shoppa, the AI shopping agent Australian retailers own, at https://shoppa.au
---

# Shoppa Landing Site Design System

## Overview

### Purpose and authority

This document is the visual implementation contract for the Shoppa landing site (`shoppa-root`). Read it before building or changing any page, layout, component, stylesheet, or animation in this repository.

Implementation status: **the Astro production implementation exists**. The design was approved on 2026-08-18 as the "Warm Sunrise" direction and is implemented across the home, about, process, contact, thank-you, and 404 pages.

The implementation is the exact-value authority. `src/styles/global.css` owns CSS values, components own their rendered structure, and this document owns the semantic roles and design rules. Treat any disagreement as drift and reconcile it in the same task.

Precedence: repository `AGENTS.md` instructions and explicit user decisions override this document. If implementation and this document disagree after the site exists, treat the difference as drift, record it under Approved Exceptions and Drift, and reconcile.

### Product character

- Audience and job: Australian retail executives and heads of digital deciding whether to put an AI shopping agent, deployed with a two-line script embed, on their own storefront. The page must persuade and reassure in one scroll.
- Character: warm, human, optimistic commerce. Cream canvas, terracotta conviction, generous rounded geometry, chunky friendly display type. Confidence is carried by big type and soft colour, never by dark severity. Concrete consequences: rounded corners everywhere (no sharp rectangles), pill buttons, soft warm shadows instead of hairline greys, one warm accent family rather than a multi-hue palette.
- Not: cold SaaS neutrals, purple-on-white AI gradients, brutalist borders, glassmorphism, dark-mode-first, emoji, sharp corners, timid grey typography.
- Expressive exceptions: the two dark espresso bands (agent-showcase side panel and agentic-shopping timeline) and the terracotta proof panel are the approved high-contrast moments; do not add further dark sections without a decision.

### Source map

| Concern | Source | Ownership |
| --- | --- | --- |
| Global tokens, themes, and responsive rules | `src/styles/global.css` | Exact palette, typography, spacing, shapes, motion, and breakpoints |
| Page composition | `src/pages/`, `src/components/`, `src/layouts/BaseLayout.astro` | Rendered section order, shared shell, and component structure |
| Copy, claim, and language rules | `AGENTS.md` | British English, typographic apostrophes, porting rules, non-disclosure of internals |
| Product claim authority | `/Users/sacino/shoppa/AGENTS.md` | What the Shoppa product verifiably does; every published capability claim must pass it |
| Browser identity assets | `public/icon.svg`, `public/favicon.ico`, `public/apple-icon.png` | Warm Sunrise favicon and app-icon set |

### Foundations

- Framework and rendering: Astro static export. All pages are prerendered. The home page ships exactly one small deferred module (`src/components/LandingEffects.astro`) for the approved landing motion; every other page ships no browser JavaScript, and the home page is complete without it (all hidden states are applied at runtime, so crawlers and no-JS visitors see the full static content).
- Styling and token authority: plain CSS with custom properties in `src/styles/global.css`; this document owns their semantic roles and constraints.
- Components and icons: hand-built Astro components; no UI framework, no icon library. The agent mark is the `✦` glyph. Decorative dots and connectors are CSS; the dress thumbnails in the chat product rows and the three hero flow-card marks are inline SVG (`src/components/DressThumbnail.astro`, `src/components/FlowIcon.astro`).
- Fonts and charts: Bricolage Grotesque (display), Figtree (body), Courier Prime (embed code only), self-hosted through Astro Fonts. No charts.

## Colors

Approved palette roles. `src/styles/global.css` owns the exact production values. Every colour is declared three times there, in this order: an sRGB hex fallback, the same colours in `oklch()`, and a Display P3 block that widens chroma only. Author new colours in oklch and let the fallback follow, never the other way round. `scripts/validate-build.mjs` converts each oklch token back to sRGB and fails the build if it does not match the hex, and holds every P3 token to the lightness and hue of its sRGB twin, so the P3 layer inherits every contrast result measured on the sRGB one. The hex column below is the fallback value; the oklch column is what you edit.

| Role | Token | sRGB | oklch | Use |
| --- | --- | --- | --- | --- |
| Canvas | `--colour-canvas` | #FFF4E9 | `0.973 0.019 67.604` | Page background |
| Surface | `--colour-surface` | #FFFBF5 | `0.99 0.009 78.283` | Cards, conversation widget, panels on canvas |
| Surface sunken | `--colour-surface-sunken` | #FFF2E2 | `0.967 0.025 73.19` | Chat chrome bar, agent bubbles, inset fields |
| Ink | `--colour-ink` | #3B2416 | `0.286 0.042 51.651` | Headings, primary text, customer bubbles |
| Ink secondary | `--colour-ink-secondary` | #6B4A31 | `0.439 0.059 57.633` | Body copy, small meta text |
| Accent | `--colour-accent` | #D6552B | `0.613 0.172 37.782` | Highlights, links on light, decorative accents, large text |
| Accent deep | `--colour-accent-deep` | #B8441F | `0.542 0.158 37.299` | Filled primary button background; white text passes 4.5:1 |
| Accent hover | `--colour-accent-hover` | #9F3719 | `0.483 0.144 36.2` | Filled primary button hover |
| Accent text | `--colour-accent-text` | #AE3E1B | `0.517 0.154 36.965` | Small accent text on blush fills; passes 4.5:1 |
| Highlight | `--colour-highlight-start` → `-end` | #FFD9B4 → #FFC896 | `0.908 0.064 66.107` → `0.87 0.09 63.478` | Hero headline highlight, CTA band |
| Tint peach / blush / sage | `--colour-tint-*` | #F9E4CF / #FEE1D5 / #E3ECD2 | `0.93 0.036` at hue 68.15 / 43.835 / 123.298 | Proof-pill fills; one lightness and one chroma so the three read as equally tinted |
| Success | `--colour-success` | #4C6B33 | `0.49 0.09 132.694` | Paid badge, "enriched" badge on sage; always paired with text |
| Border | `--colour-border` (strong: `-strong`) | #F0DEC8 / #EAD3BC | `0.909 0.035 72.877` / `0.88 0.04 67.265` | Dividers, dashed rules, chip outlines. Decorative only, so exempt from 3:1 |
| Control border | `--colour-control-border` | #A78561 | `0.64 0.065 67.265` | Ghost button only, where the border is the sole mark of a control; 3.14:1 on canvas |
| Dark band | `--colour-band` (panel, code) | #3A2414 / #40291A / #2B1A0F | `0.284 0.043 56.049` / `0.305 0.043 53.569` / `0.237 0.033 53.332` | Timeline band, embed panel, code blocks |
| Dark band text | `--colour-band-text` (soft) | #FFF2E2, soft at 0.82 alpha | `0.967 0.025 73.19` | Text on dark bands. `-soft` is the one approved alpha and is valid only on backgrounds at L ≤ 0.31 |
| Dark band accent | `--colour-band-accent` | #FFC896 | `0.87 0.09 63.478` | Dates, links, eyebrow pills on dark bands |
| Band washes | `--colour-band-wash`, `-wash-pill`, `-rule` | cream 0.07, ink 0.3, cream 0.2 | `0.967 0.025 73.19 / 0.07`, `0.237 0.033 53.332 / 0.3`, `0.967 0.025 73.19 / 0.2` | Timeline card fill, eyebrow pill fill, hairline rules. The pill wash darkens; a light wash lifts the pill towards the text on it |
| Proof gradient | `--colour-demo-start` → `-end` | #9A3B1D → #A34C27 | `0.48 0.134 37.782` → `0.52 0.125 42.191` | "See it live" proof panel background |
| Sapphire dress | #2F4E8C → `--colour-sapphire-deep` #243C6D on `--colour-sapphire-tint` #E8EDF7 | Sapphire dress thumbnail gradient and backdrop tile |
| Blush dress | #E8A5A0 → `--colour-blush-deep` #D1786F on `--colour-blush-tint` #FBECEB | Blush dress thumbnail gradient and backdrop tile |

- Theme status: single light theme. No dark mode is supported or planned; do not add `prefers-color-scheme` variants. The P3 block is a gamut widening, not a theme.
- The terracotta dead zone: no text-bearing surface may sit between L 0.56 and L 0.68 at the accent hue. Across that band a terracotta is too light for cream text and too dark for ink text, and neither reaches 4.5:1. The proof panel used to sit at L 0.613 → 0.676 and failed at every element, eyebrow included, which is why it now opens at L 0.48. Move the background out of the band; do not try to fix it from the text side.
- Accessibility target: 4.5:1 for normal text and 3:1 for large text on every rendered pair. No formal WCAG conformance is claimed. Enforcement is the browser check "every rendered text element meets its contrast target on its own backdrop", which composites each element through its real ancestor chain, once per gradient colour stop, and scores the worst result. It exists because axe-core cannot judge text over a gradient: it returns those nodes as `incomplete` rather than as violations, and the suite reads only `results.violations`. That gap silently excused 48 nodes on the home page alone, the whole proof panel among them. Elements inside `[aria-hidden="true"]` are exempt as decoration, which covers the CTA snippet cloud and the `✦` avatars.
- Status communication: colour never carries status alone. Paid state = sage fill + tick + text "Paid · order confirmed"; stock state = text ("in stock", "3 left"); badges always contain words. The tick belongs to the paid badge only - the generic `.status` pill also carries neutral ("ready") and negative ("Incomplete") states, where a confirmation mark would misreport them.

## Typography

- Display role: Bricolage Grotesque 700/800 for h1–h3, stat figures, panel headings, and the brand wordmark. Letter-spacing −0.02em to −0.03em. The wordmark is a named lockup (see Brand wordmark below), not ordinary display type.
- Body role: Figtree 400 for copy, 500–600 for meta and labels, 700 for buttons and chip text.
- Label role: Figtree 700, 11.5–12.5px, letter-spacing 0.16–0.2em, uppercase, used in eyebrow pills, timeline dates, connector labels. 11.5px is the floor for the widest-tracked uppercase labels (flow connectors, the time divider, the feed-field heading); everything else starts at 12px. No text on any page renders below 11.5px - the only sub-11.5px value left in the stylesheet is the 10px `✦` glyph inside the 22px hero avatar, which is decorative, not type.
- Mono role: Courier Prime, embed code blocks and code-flavoured decoration only. Never for body copy.
- Scale (approved): hero h1 `clamp(44px, 5.6vw, 72px)` at line-height 1.06; section h2 `clamp(30px, 3.8vw, 46px)` at 1.06; panel h3 24px; body 16.5px/1.65; small meta 12–13.5px. Chat scale: conversation bubbles 14px, hero mini-chat 13px, product rows 13px, product meta and status pills 12px, receipt 13px. The receipt is always smaller than the bubble it follows; it must never inherit 16.5px body copy, which made it read louder than the conversation. Hero line-height is deliberately 1.06, not the prototype's 1.02, and the hero highlight band is sized in em against it - see the highlight rule under Do's and Don'ts.
- Measure and wrapping: body copy capped near 620px; hero subhead 520px; headings wrap freely with `text-wrap: balance` where supported. No truncation or ellipsis anywhere on the marketing pages.
- Numerics and locale: en-AU. Currency as `$189` / `$189.00` exactly as the copy contract specifies; en dashes in ranges (`$3–5T`, `$100K – $500K`); `’` apostrophes in all display strings (project rule).

### Brand wordmark

The `shoppa.` lockup is a named brand mark, shared with the product repository (`/Users/sacino/shoppa/DESIGN.md`). Exact CSS lives in `src/styles/global.css`; this section owns the construction.

- Visible string: all-lowercase `shoppa` plus a terracotta full stop. Render as `shoppa<span aria-hidden="true">.</span>`.
- Face: Bricolage Grotesque 800, tracking −0.025em (inherited from display type), espresso ink (`#3B2416` / `--colour-ink`). The stop uses accent (`#D6552B` / `--colour-accent`).
- Size: 27px in the header and footer; 24px below 640px; 18px for the footer-bottom compact mark.
- Accessible name: `aria-label="Shoppa home"` on the header and footer links. The stop is decoration and must stay `aria-hidden`. The compact footer mark is itself `aria-hidden` because the copyright line already names shoppa.
- Product surfaces in the sibling product repo may append a lowercase product name before the stop (`shoppa console.`). Do not invent other lockup variants on this marketing site.
- Do not title-case the visible lockup (`Shoppa.`). Do not omit the stop. Do not colour the stop in ink.

## Layout

- Spacing rhythm: container max-width 1140px with 32px gutters; sections separated by 72–96px; within a section, intro → content gap 46px; card internal padding 22–32px. `src/styles/global.css` owns the exact values.
- Label-to-content gap: a small label above the thing it names - eyebrow pill in a card head, index numeral, connector - keeps a 10–16px gap, not the 22px the eyebrow uses when it opens a section or the 1em paragraph margin a large numeral would inherit. The wider gaps read as a hole in the card (user-reported, 2026-08-20).
- Above the fold: the hero visual is the tallest hero element, so its lead-in is capped at 104px. The flow stack must finish inside a 1440×900 viewport; check it after changing hero padding, flow-card padding, or the connector height.
- Breakpoints and frames: two functional breakpoints - 960px (multi-column grids stack to one column; hero split becomes a single column with the visual below the copy) and 640px (three-up pill grids stack). Full-bleed is never used for content; the dark timeline band and CTA band are rounded 44px blocks inset within the container.
- Navigation and shell: header = `shoppa.` wordmark left, inline text links (the agent, the catalogue, our process, about us) centre/right, terracotta pill "Contact us" right; below 960px the inline links hide and the full route list lives in the footer (no JavaScript burger menu). Footer = three columns (offer / company / our offices) plus wordmark and dynamic-year copyright line.
- Overflow and dense data: no horizontal scrolling at any viewport ≥ 320px; the order-summary list and timeline cards reflow by stacking. Code blocks in embed panels are the only permitted `overflow-x: auto` regions.
- Touch targets: interactive elements at least 44px tall (buttons, header CTA, footer links with padding) and at least 44px wide where the anchor is the whole target - the footer links carry a `min-width` because the shortest labels (proof, perth) set only 40px of type. Source links and small chips at least 24px with surrounding spacing.

## Elevation & Depth

- Surface hierarchy: canvas → card (`--shadow-border` + `0 10px 30px` warm ambient) → feature card (`--shadow-border` + `0 18px 50px` warm ambient). Dark bands use no shadow of their own; their contrast is the elevation.
- The card edge is a shadow ring, not a border: `--shadow-border` is a 1px `rgba(0,0,0,.06)` ring plus a close lift, and both card tokens open with it. The ring is transparent, so one rule holds its weight on the cream canvas and disappears behind a cream card inset in a dark band, where the card's own contrast is already the edge. The 1.5px `#F0DEC8` border it replaced could not do both: on the about-page band it drew a cream line on a cream card and separated nothing (user-reported, 2026-08-21). Cards, panels, product rows, and the order summary all carry the ring. Dividers stay borders - dashed receipt rules, the catalogue-data rules, the contact rule, the footer rule - and so does the ghost button, whose border is the only thing marking it as a control.
- Overlays and stacking: no modals, dropdowns, or sticky layers; the header scrolls with the page. Two decorative exceptions on the home page, both `aria-hidden` and pointer-transparent: the motif underlay (a `z-index: -1` layer between the page background and the content - which is why `body` carries no background of its own; `html` paints the canvas) and the typing-dots overlay inside the chat surfaces (see Landing motion).
- Expressive depth: primary button glow `0 6px 18px rgba(214,85,43,.28)`; the timeline band carries one soft radial warm glow (top-right, `rgba(231,111,60,.35)` fading to transparent). No other glows, blurs, or glass effects.

## Shapes

- Radius and geometry: pill (999px) for buttons, chips, badges, eyebrow tags, URL pill; 20–28px for cards and panels (conversation widget 28px outer); 44px for the two inset bands; 12–16px for inner rows (product rows, code blocks, chrome bar); chat bubbles 16–20px with a 4–6px "tail" corner pointing at the speaker. Nothing square.
- Icons: no icon library. `✦` in a terracotta circle is the agent avatar; traffic-light dots and connector rules are CSS. The line-icon set is drawn on one 24x24 canvas at one 1.7 stroke weight so it reads as a single hand: the three hero flow-card marks (product grid, robot face, shopper) and the five decorative shopping motifs (price tag, shopping bag, coat hanger, parcel, receipt) used only by the home page's margin-motif layer. Decorative glyphs, thumbnails, and flow icons are `aria-hidden`; where a glyph carries meaning, the adjacent label does the naming.
- Imagery: no photography. All page visuals are typographic/CSS/SVG compositions (flow cards, conversation, dress thumbnails, receipt-style order summary). Anything that stands in for a product photo carries the image edge: a 1px `rgba(0,0,0,.1)` outline at `outline-offset: -1px`, so it is inset and stays out of the layout box. Pure black, never a warm neutral, which would pick up the tile tint and read as dirt on the edge. Browser identity assets in `public/` use the Warm Sunrise palette and keep the outer corners transparent.

## Components

### Interaction and accessibility

- Semantics: native elements only - `a` for navigation, `button` reserved for future form submission, lists as `ul`/`ol`, the conversation as ordered content with visually-hidden speaker labels ("Customer:", "Your agent:") for screen readers. No custom widgets.
- Cursor and stable states: pointer on links/buttons; hover states change colour/elevation without layout shift (transform-based lifts only). No disabled states exist on the marketing site.
- Focus and keyboard: visible focus rings on every interactive element (2px ink outline with 2px offset on light, cream outline on dark/terracotta fills); skip link as first focusable element; DOM order equals visual order.
- Names and announcements: accessible names match visible labels; external links (sources, demo.shoppa.au) carry normal link semantics with the `↗` glyph `aria-hidden`. No live regions until the contact form phase.
- Motion: 200–300ms ease-out transitions for hover lift (−1 to −2px translate) and colour. Every hover that changes colour names its own duration - header links, footer links - and the skip link transitions its `transform`, so no interactive state snaps. Transitions name their exact properties; `transition: all` is never used.
- Press: filled and pill controls scale to `0.96` on `:active` (`.button`, `.demo-link`), through the standalone `scale` property so the press composes with the hover lift rather than overwriting its `transform`. `transition: transform` does not cover `scale`, so the shorthand lists it separately. The contact-page `.email-link` is deliberately excluded: it is display-size text, not a filled control, and scaling a 34px line reads as a jump.
- Hero enter: one CSS-only staggered sequence covering both halves of the hero. The copy fades up at 0/80/160/240ms, then the flow stack draws itself top to bottom at 300/360/420/480/540ms, so the visual arrives as the chain its cards spell out. Each step combines `opacity` and an 18px `translateY` over 400ms, and fills `backwards` only. No enter animation may animate `filter` or fill `forwards`/`both`: an animated 4px `blur` held by `fill-mode: both` stranded the first hero flow card permanently blurred on iOS Safari (user-reported, 2026-08-21), because the forwards fill keeps the element composited with the animation's filter owned by the compositor and a final commit dropped under scroll load is never repainted. Keyframes are correct here because it runs once; interactive states use transitions, which stay interruptible. Scroll-triggered reveals are implemented as part of Landing motion (see Components); they use transitions plus one-shot classes, never fill modes.
- Project rule (from `AGENTS.md` lineage): never gate any animation behind `prefers-reduced-motion` or equivalent conditionals.

### Actions and buttons

Primary: pill, `#B8441F` fill, white 700 text, terracotta glow shadow, hover darkens and lifts 1px. Ghost: pill, transparent fill, 1.5px `#A78561` border, ink text, hover border becomes accent. That border is darker than every other rule on the page on purpose: it is the only thing marking the control, so it carries 3:1 while decorative borders do not. Dark-band variant: ink (`#3B2416`) fill on peach CTA band. Header CTA uses the primary style at compact padding. Every filled or pill control also presses to `scale(0.96)`; see Motion. One primary action per view region.

### Forms and selection

Current scope: none rendered. The contact page publishes a `mailto:` email block (`hello@shoppa.au`) styled as a card. Planned (approved, not implemented): a Formspree-backed enquiry form mirroring the embeddings field set (Name, Email, Company, Phone, Message, Budget radios) restyled to this system - floating labels on `#FFFBF5` fields, 1.5px borders, terracotta focus border, error text in accent-deep with plain-language messages. Build it only when the user schedules the Formspree phase.

### Navigation and search

Header wordmark: the `shoppa.` lockup, left, linking `/` (see Brand wordmark). Header links: Figtree 600, 15px, ink, hover accent; current page marked by a terracotta dot, not colour alone. Footer columns use lowercase link labels matching the nav voice (the agent, why now, the catalogue, proof / our process, about us, contact us). No search.

### Cards, badges, and statuses

- Eyebrow pill: uppercase label on blush fill (`#FDE0D4`, accent text) opening every section. Its right padding is `calc(16px - 0.18em)`: `letter-spacing` adds its full 0.18em after the last letter as well as between letters, so a symmetric pill carries 2.16px of dead space on the right and lands the type left of centre (user-reported, 2026-08-21).
- Proof pills (hero): three tinted cards (peach/sage/blush), stat in display 800 over a 12.5px label 8px below it. The cards hug their content with symmetric 18px padding; no fixed or minimum height, which previously left dead space under the label.
- Flow cards (hero visual): bordered surface cards joined by uppercase connector labels ("feeds", "answers") over short vertical rules. All three cards open with the same title row - a 28px rounded icon tile, the label, then any status pill pushed to the far edge - so the chain reads as three named steps rather than three blocks of text. Tiles: catalogue = product grid, accent text on peach; agent = robot face, white on terracotta (it replaced a bare status dot); customer = shopper, ink on blush. The title row owns the gap to whatever the card holds below it, so the three cards keep one internal rhythm. Below 640px the agent card is a single line - label left, capability chips right - because a wrapped chip row cost more vertical space above the fold than the third chip is worth; the row drops "support" and shrinks the remaining chips to the 11.5px label floor, and the chip list wraps to its own line only under about 340px.
- Conversation widget: surface card, 28px radius, chrome bar (dots + URL pill + brand chip), customer bubbles ink-filled right-aligned, agent bubbles sunken-surface left-aligned with `✦` avatar, product rows with dress thumbnail + name + meta, receipt-style order list, sage paid badge, dashed "3 days later" divider (1px dashed `--colour-border-strong` on both flanking rules).
- Product rows: two columns, thumbnail then text. The meta line sits directly under the name at 4px, at every width - never justified to the opposite edge of the row, which stranded the price ~180px from the item it prices at desktop widths. The thumbnail spans both text rows so it centres against the pair.
- Agent avatar placement: the `✦` avatar bottom-aligns to the first bubble of its message, not to the top of the message and not to the bottom of a multi-part stack, so it reads as the tail of the speech bubble. Both chat surfaces follow this: 30px in the conversation, 22px in the hero mini-chat. The small size is set on `.avatar.avatar-small`, not `.avatar-small`: at equal specificity `.avatar` is declared later in `global.css` and won, so the hero avatar rendered at 30px against 13px chat type (measured, 2026-08-21).
- Paid badge: sage pill with a 1em tick before the label, centred on both chat surfaces - in the conversation it spans the avatar and message columns so it centres in the panel like the time divider, and the hero mini-chat centres it in the single chat column - `#4C6B33` on `#E3ECD2` with a `rgba(76,107,51,.24)` hairline. The tick ink is centred in its own 12-unit viewBox and the label runs at line-height 1, so the mark and the type share one optical centre. The tick side carries 2px less padding than the label side (`7px 12px 7px 10px`), because a lone glyph reads lighter than type at the same distance.
- Dress thumbnails (chat product rows): illustrated dress silhouettes on a 36x44 SVG canvas over a tinted tile - 30x37px at 9px radius in the conversation, 22x27px at 7px radius in the hero mini-chat. Sapphire is a scoop-neck A-line; blush is a V wrap with a crossover seam. Both are `aria-hidden`; the adjacent product name carries the meaning.
- Embed panel: `#40291A` card, peach eyebrow, display heading, two-line code block on `#2B1A0F`.
- Proof panel: terracotta gradient card with cream "See it live." heading and a white pill link to demo.shoppa.au. The pill carries two optical corrections: 2px less padding on the arrow side than the label side, and the `↗` dropped `0.12em`, because its ink centres 1.92px higher above the baseline than the label's does at that size (measured, 2026-08-21).
- Timeline cards: translucent cream-on-espresso cards (`rgba(255,242,226,.07)`) with peach date label, display stat, source link underlined in peach.
- Source links (`src/components/SourceLink.astro`): one "Source · publisher ↗" affordance at 12px 700 for the timeline band, the shift cards, and the about-page stat cards. The label and its glyph sit in a single child element joined by a no-break space, so a wrapping publisher name never strands the ↗ on its own. Where the cards share a stretched grid row, the link is pushed to the bottom of the card so the row's links line up. The `↗` takes the same `0.12em` drop as the demo pill, in em so it tracks the smaller type.
- Comparison card head (before/after catalogue cards): eyebrow pill and status pill on one centred row. The eyebrow's section-intro bottom margin is zeroed here; left in place it sits inside the flex centring and lifts the pill above the status beside it (user-reported, 2026-08-20).
- Capability chips: bordered surface pills, Figtree 600 13px.
- Snippet cloud (CTA band): translucent Courier Prime pills scattered behind the closing action, two of them tilted 5-6deg. Courier Prime reserves 0.78em of ascent against 0.35em of descent, so a symmetrically padded pill centres the font's metrics box and leaves the ink about 2px above the middle (user-reported, 2026-08-20). The pills run at line-height 1 and carry 3px more padding above than below, which puts the ascender-to-baseline band on the pill's centre. Any future pill of centred monospace type needs the same correction; Figtree pills do not.
- Status badges always combine fill + words (see Colors).

### Landing motion (home page only)

The "Live Sale" direction, approved 2026-08-22 after five prototype rounds: the product demo sells itself. One deferred module (`src/components/LandingEffects.astro`) owns all of it; `src/styles/global.css` owns the exact values. Three systems:

- Chat replay: the hero mini-chat replays on load (starting at 600ms, timed to its flow card's enter) and the conversation panel replays once when it scrolls into view. Messages hide with opacity plus a 10px lift only, so every message keeps its layout space and nothing on the page moves while the sale plays - the in-flow typing indicator that resized the chat and recentred the hero every agent turn must never return (user-reported, 2026-08-22). The typing dots are an `aria-hidden` absolute overlay positioned on the upcoming bubble's reserved spot via bounding-rect difference, never `offsetLeft`/`offsetTop`: the hidden message carries a transform, which makes it the `offsetParent` of its own bubble and strands the dots at the top of the chat. The paid badge stamps on (scale 1.7 → 1 with a -7° settle, backwards fill only).
- Scroll reveals: one-shot staggered fade-and-rise (26px, 90ms steps capped at 5) on section blocks, via IntersectionObserver plus transitions - interruptible, no fill modes, no filter, and a block already inside the viewport is never hidden.
- Margin motifs: twelve of the five shopping glyphs on two rails in the side whitespace, hugging the container edges and alternating down the page - decoration in the spare margin, never behind the content column. Field centred and capped at 1560px so the motifs come in toward the content on wide screens; colour `--colour-border-strong` at 0.55 opacity; deterministic placement (no randomness, every load identical); gentle 9s swing and per-motif scroll parallax. The layer only exists at viewports ≥ 1360px, where a real side band (~110px+) is available - below that it is skipped at mount and hidden by media query, because without spare whitespace the motifs sit behind text and read as noise (user decision, 2026-08-22).
- Test invariant: every finite animation is awaited by the browser suite before colour reads; infinite loops (typing-dots bounce, motif swing) are allowed only inside `aria-hidden` decoration, which the contrast checker already exempts.

### Tables and dense data

Only the order summary: a definition-style list with dashed row dividers and a bold total row. Left-align labels, right-align amounts, minimum 14px gap between them (prototype defect fixed by decision 2026-08-18). No tables elsewhere.

### Dialogs, sheets, popovers, and tooltips

None. Do not introduce them on the marketing site.

### Alerts, loading, empty, and error states

The 404 page is the only error surface: display numeral, heading, one-line body, primary button home + ghost link to `/#agent`. No loading or empty states exist while the site is fully static.

## Do's and Don'ts

- Do render the hero highlight as a background gradient on the `actually yours` span, sized `100% 1.06em` at background position `0 0.15em` with `box-decoration-break: clone` and zero vertical padding, with hero line-height 1.06. The band must cover the whole glyph height of its own line (ascenders 0.72em above the baseline, descenders 0.19em below) and still clear the descenders on the line above: the prototype's full-height padded highlight collided with the line above (user-reported overlap, 2026-08-18) and a 72%-height band left the ascenders of `actually yours` uncovered (user-reported gap, 2026-08-19). Neither must be reproduced.
- Do render the brand lockup as lowercase `shoppa.` with a terracotta `aria-hidden` stop.
- Do pair every status with words; never colour alone.
- Do keep every capability claim traceable to `/Users/sacino/shoppa/AGENTS.md` / the approved copy contract before publishing it.
- Do keep small text on dark bands at the single 0.82 alpha, and only where the background sits at L ≤ 0.31. Keep filled primary buttons on `#B8441F`.
- Do zero an element's own vertical margin before putting it in a centred flex or grid row. The margin sits inside the alignment, so the element's ink lands off-centre against everything beside it.
- Do pay back the trailing letter-space on any tracked-out uppercase label. `letter-spacing` adds its value after the last letter too, so the ink sits half that distance left of where the box says it is. A centred single-line label (`.time-divider`, `.flow-connector`) takes a matching `text-indent`, which widens the box on the left by the same amount and re-centres the ink. A centred label that can wrap (`.feed-fields p`) takes a matching `padding-inline-start` instead: `text-indent` pays back the first line only, and the label's second line stayed 0.93px left of centre until the padding moved the whole centring axis (measured, 2026-08-21). A left-aligned label in a padded pill (`.eyebrow`) subtracts it from the right padding instead. Labels that are simply left-aligned in a column need nothing: the dead space falls off the right end where nothing lines up against it.
- Do keep a `dd` flush with the `dt` above it. The user agent indents every `dd` by 40px, and the global reset zeroed only its top margin, so the proof band details sat 40px right of their labels (user-reported, 2026-08-20). `global.css` now resets `margin-inline-start` on `dd` once; a definition list sets its own inline start on top of that.
- Do let a card that is shorter than its neighbours stay short. Where a stretched card would end in empty space, either bottom-anchor its last row (source links) or stop the stretch (`align-items: start` on the contact grid).
- Don't add dark sections, glass effects, purple gradients, photography, icon libraries, or a second accent hue. Hand-built inline SVG marks are allowed and must join the existing set: one canvas size, one stroke weight, `aria-hidden`, meaning carried by adjacent text.
- Don't title-case the `shoppa.` wordmark, omit its terracotta stop, or recolour the stop to ink.
- Don't gate any animation behind `prefers-reduced-motion` or similar conditionals.
- Don't introduce horizontal scrolling anywhere except code blocks.
- Don't use `#9A7B5F` for normal-size text on canvas.

## Product Workflows and Content

- The site is a one-scroll persuasion flow (home) plus three supporting routes (`/about/`, `/process/`, `/contact/`) and utility routes (`/thank-you/`, 404). Section order on home is fixed: hero → the agent → the catalogue → agentic timeline → why now → testimonial → CTA band.
- Copy is a fixed contract, not a styling variable: wording was ported from the embeddings site and adapted to Shoppa product positioning by explicit user decisions (2026-08-18). The full approved wording lives in the implementation plan (`documents/todo/` of this repository). Do not invent, extend, or "improve" user-facing copy to fit a layout; remove the slot instead.
- Terminology: "your agent" (the retailer’s), "the catalogue"/"your feed", "two-line embed", "agentic shopping". Nav and eyebrow labels are lowercase (the agent, the catalogue, proof, our process, about us, contact us); headings are sentence case except the brand wordmark, which is always lowercase `shoppa.`. British English, `’` apostrophes.
- Never disclose internals in copy: the unauthenticated API, mock mode, MVP staging, repository structure, or Convex.
- The conversation script (spring-wedding dress → checkout → order #8412) is verbatim from the approved contract and mirrors the real Harlow demo; do not alter its wording, prices, or order number.

## Approved Exceptions and Drift

- Approved exceptions: the production implementation uses the approved contrast refinements: button fill `#B8441F`, one 0.82 alpha for small text on the espresso bands, the deepened proof panel, and the non-overlapping hero-highlight construction.
- Known implementation drift: none.
- Card borders were replaced by the `--shadow-border` ring on 2026-08-21, and the hero enter sequence was extended over the flow stack on the same date. Both are recorded above as design rules, not drift.
- The "Live Sale" landing motion (chat replay, scroll reveals, margin motifs) was approved on 2026-08-22 through a five-variant prototype session and is recorded under Landing motion. It introduced the home page's single deferred script and the transparent `body` background; both are design rules, not drift.
- Placeholder content: the testimonial quote is user-approved marketing placeholder attributed to an anonymous role, awaiting a real customer quote.

## Design Verification

Current proof: the production site was built and screenshot-reviewed on 2026-08-20 across every route at 1440×900 and 390×844. Automated checks covered semantic rules, keyboard focus, colour contrast, output discovery files, overflow, and the hero highlight band at widths from 320px to 1440px, where the band must cover its own glyphs and clear the line above. The 2026-08-20 pass added measured geometry for the flow-card title rows, the before/after card heads, the source-link rows, and the contact columns, plus the hero flow stack and the single-line agent card at 1440, 1280, 960, 640, 430, 390, 375, 360, 340, and 320px. Evidence is stored in `documents/verification/screenshots/`, including `hero-highlight-<width>.png` crops.

| Viewport or mode | Routes and states | Proof |
| --- | --- | --- |
| 1440×900 desktop | `/`, `/about/`, `/process/`, `/contact/`, `/thank-you/`, 404 | Passed full-page visual review; no horizontal overflow; hero highlight covers its own glyphs and clears adjacent lines |
| 390×844 mobile | Same routes with stacked grids, collapsed header, and inset bands | Passed full-page visual review; single-column reflow and no horizontal overflow |
| Contrast and keyboard pass | Approved colour pairs and representative links | Passed automated contrast targets and visible-focus checks |
| Interface-detail pass, 2026-08-21 | `/`, `/about/`, `/process/`, `/contact/` at 1440×900 and 390×844 | Measured: hero mini-chat avatar 22×22 at 10px against the conversation's 30×30; every tracked-out label centres within 0.01px, including the wrapping feed-fields label; `.button` presses to `scale(0.96)` and releases; no horizontal overflow on any route. Reviewed: the shadow ring reads on the cream canvas and leaves no drawn edge behind the cards on the about-page band; the demo pill's `↗` sits on the label's optical centre |
| Landing-motion pass, 2026-08-22 | `/` at 1440×900, 1720×900, and 390×844 | Measured: the headline and document height hold one value (254px / 6526px) through the whole hero replay; typing dots land on the upcoming bubble's exact x and settled y in both chat surfaces; 12 motifs at 1440 and 1720 with no glyph ink inside the content column (one 2px rotated-corner bounding-box graze at 1440) and motifs inset 106px from the edge at 1720; 0 motifs and no overflow at 390; replay completes with every message shown and both paid badges stamped; no console errors. Evidence in `documents/verification/screenshots/landing-effects-*.png` |

For future UI changes, repeat the full route and viewport pass, then run the default completion gate in `AGENTS.md`. Keep detailed server, browser, and evidence procedures in `documents/AGENTS/testing.md`.
