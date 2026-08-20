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

- Framework and rendering: Astro static export. All pages are prerendered; the production pages ship no browser JavaScript.
- Styling and token authority: plain CSS with custom properties in `src/styles/global.css`; this document owns their semantic roles and constraints.
- Components and icons: hand-built Astro components; no UI framework, no icon library. The agent mark is the `✦` glyph. Decorative dots and connectors are CSS; the dress thumbnails in the chat product rows and the three hero flow-card marks are inline SVG (`src/components/DressThumbnail.astro`, `src/components/FlowIcon.astro`).
- Fonts and charts: Bricolage Grotesque (display), Figtree (body), Courier Prime (embed code only), self-hosted through Astro Fonts. No charts.

## Colors

Approved palette roles. `src/styles/global.css` owns the exact production values:

| Role | Token or source | Use |
| --- | --- | --- |
| Canvas | `--colour-canvas` #FFF4E9 | Page background |
| Surface | `--colour-surface` #FFFBF5 | Cards, conversation widget, panels on canvas |
| Surface sunken | `--colour-surface-sunken` #FFF2E2 | Chat chrome bar, agent bubbles, inset fields |
| Ink | `--colour-ink` #3B2416 | Headings, primary text, customer bubbles |
| Ink secondary | `--colour-ink-secondary` #6B4A31 | Body copy, small meta text |
| Ink muted | `--colour-ink-muted` #9A7B5F | Large or decorative secondary text only (fails 4.5:1 on canvas; never for normal-size copy) |
| Accent | `--colour-accent` #D6552B | Highlights, links on light, decorative accents, large text |
| Accent deep | `--colour-accent-deep` #B8441F | Filled primary button background (white text passes 4.5:1); hover darkens further |
| Accent text | `--colour-accent-text` #AE3E1B | Small accent text on blush fills; passes 4.5:1 |
| Highlight | `--colour-highlight` #FFD9B4 → #FFC896 gradient | Hero headline highlight, warm tints |
| Tint peach / blush / sage | #FFE3C6 / #FDE0D4 / #E7EFD9 | Proof-pill card fills |
| Success | `--colour-success` #4C6B33 on #E7EFD9 | Paid badge, "enriched" badge; always paired with text |
| Border | `--colour-border` #F0DEC8 (strong: #EAD3BC) | Card borders, dividers, dashed rules |
| Dark band | `--colour-band` #3A2414 (panel: #40291A, code: #2B1A0F) | Timeline band, embed panel, code blocks |
| Dark band text | `--colour-band-text` #FFF2E2 | Text on dark bands; small text at ≥ 0.75 alpha, never 0.6 |
| Dark band accent | `--colour-band-accent` #FFC896 | Dates, links, accents on dark bands |
| Proof gradient | #D6552B → #E76F3C | "See it live" proof panel background |
| Sapphire dress | #2F4E8C → `--colour-sapphire-deep` #243C6D on `--colour-sapphire-tint` #E8EDF7 | Sapphire dress thumbnail gradient and backdrop tile |
| Blush dress | #E8A5A0 → `--colour-blush-deep` #D1786F on `--colour-blush-tint` #FBECEB | Blush dress thumbnail gradient and backdrop tile |

- Theme status: single light theme. No dark mode is supported or planned; do not add `prefers-color-scheme` variants.
- Accessibility target: working check of 4.5:1 for normal text and 3:1 for large text on every rendered pair, enforced by `#B8441F` button fill, `#AE3E1B` small accent text, `#6B4A31` small neutral labels, and ≥ 0.75 alpha for small dark-band text. No formal WCAG conformance is claimed; the automated contrast and axe-core checks measure rendered output.
- Status communication: colour never carries status alone. Paid state = sage fill + tick + text "Paid · order confirmed"; stock state = text ("in stock", "3 left"); badges always contain words. The tick belongs to the paid badge only - the generic `.status` pill also carries neutral ("ready") and negative ("Incomplete") states, where a confirmation mark would misreport them.

## Typography

- Display role: Bricolage Grotesque 700/800 for h1–h3, stat figures, panel headings, brand wordmark ("shoppa" lowercase with a terracotta full stop). Letter-spacing −0.02em to −0.03em.
- Body role: Figtree 400 for copy, 500–600 for meta and labels, 700 for buttons and chip text.
- Label role: Figtree 700, 11.5–12.5px, letter-spacing 0.16–0.2em, uppercase, used in eyebrow pills, timeline dates, connector labels. 11.5px is the floor for the widest-tracked uppercase labels (flow connectors, the time divider, the feed-field heading); everything else starts at 12px. No text on any page renders below 11.5px - the only sub-11.5px value left in the stylesheet is the 10px `✦` glyph inside the 22px hero avatar, which is decorative, not type.
- Mono role: Courier Prime, embed code blocks and code-flavoured decoration only. Never for body copy.
- Scale (approved): hero h1 `clamp(44px, 5.6vw, 72px)` at line-height 1.06; section h2 `clamp(30px, 3.8vw, 46px)` at 1.06; panel h3 24px; body 16.5px/1.65; small meta 12–13.5px. Chat scale: conversation bubbles 14px, hero mini-chat 13px, product rows 13px, product meta and status pills 12px, receipt 13px. The receipt is always smaller than the bubble it follows; it must never inherit 16.5px body copy, which made it read louder than the conversation. Hero line-height is deliberately 1.06, not the prototype's 1.02, and the hero highlight band is sized in em against it - see the highlight rule under Do's and Don'ts.
- Measure and wrapping: body copy capped near 620px; hero subhead 520px; headings wrap freely with `text-wrap: balance` where supported. No truncation or ellipsis anywhere on the marketing pages.
- Numerics and locale: en-AU. Currency as `$189` / `$189.00` exactly as the copy contract specifies; en dashes in ranges (`$3–5T`, `$100K – $500K`); `’` apostrophes in all display strings (project rule).

## Layout

- Spacing rhythm: container max-width 1140px with 32px gutters; sections separated by 72–96px; within a section, intro → content gap 46px; card internal padding 22–32px. `src/styles/global.css` owns the exact values.
- Label-to-content gap: a small label above the thing it names - eyebrow pill in a card head, index numeral, connector - keeps a 10–16px gap, not the 22px the eyebrow uses when it opens a section or the 1em paragraph margin a large numeral would inherit. The wider gaps read as a hole in the card (user-reported, 2026-08-20).
- Above the fold: the hero visual is the tallest hero element, so its lead-in is capped at 104px. The flow stack must finish inside a 1440×900 viewport; check it after changing hero padding, flow-card padding, or the connector height.
- Breakpoints and frames: two functional breakpoints - 960px (multi-column grids stack to one column; hero split becomes a single column with the visual below the copy) and 640px (three-up pill grids stack). Full-bleed is never used for content; the dark timeline band and CTA band are rounded 44px blocks inset within the container.
- Navigation and shell: header = brand wordmark left, inline text links (the agent, the catalogue, our process, about us) centre/right, terracotta pill "Contact us" right; below 960px the inline links hide and the full route list lives in the footer (no JavaScript burger menu). Footer = three columns (offer / company / our offices) plus wordmark and dynamic-year copyright line.
- Overflow and dense data: no horizontal scrolling at any viewport ≥ 320px; the order-summary list and timeline cards reflow by stacking. Code blocks in embed panels are the only permitted `overflow-x: auto` regions.
- Touch targets: interactive elements at least 44px tall (buttons, header CTA, footer links with padding); source links and small chips at least 24px with surrounding spacing.

## Elevation & Depth

- Surface hierarchy: canvas → bordered card (1.5px `#F0DEC8` border + `0 10px 30px rgba(107,74,49,.08)`) → feature card (`0 18px 50px rgba(107,74,49,.12)`, no border). Dark bands use no shadow; their contrast is the elevation.
- Overlays and stacking: none. No modals, dropdowns, or sticky layers; the header scrolls with the page.
- Expressive depth: primary button glow `0 6px 18px rgba(214,85,43,.28)`; the timeline band carries one soft radial warm glow (top-right, `rgba(231,111,60,.35)` fading to transparent). No other glows, blurs, or glass effects.

## Shapes

- Radius and geometry: pill (999px) for buttons, chips, badges, eyebrow tags, URL pill; 20–28px for cards and panels (conversation widget 28px outer); 44px for the two inset bands; 12–16px for inner rows (product rows, code blocks, chrome bar); chat bubbles 16–20px with a 4–6px "tail" corner pointing at the speaker. Nothing square.
- Icons: no icon library. `✦` in a terracotta circle is the agent avatar; traffic-light dots and connector rules are CSS. The only line icons are the three hero flow-card marks - product grid, robot face, and shopper - drawn on one 24x24 canvas at one stroke weight so the trio reads as a set. Decorative glyphs, thumbnails, and flow icons are `aria-hidden`; the card label beside each one carries the meaning.
- Imagery: no photography. All page visuals are typographic/CSS/SVG compositions (flow cards, conversation, dress thumbnails, receipt-style order summary). Browser identity assets in `public/` use the Warm Sunrise palette and keep the outer corners transparent.

## Components

### Interaction and accessibility

- Semantics: native elements only - `a` for navigation, `button` reserved for future form submission, lists as `ul`/`ol`, the conversation as ordered content with visually-hidden speaker labels ("Customer:", "Your agent:") for screen readers. No custom widgets.
- Cursor and stable states: pointer on links/buttons; hover states change colour/elevation without layout shift (transform-based lifts only). No disabled states exist on the marketing site.
- Focus and keyboard: visible focus rings on every interactive element (2px ink outline with 2px offset on light, cream outline on dark/terracotta fills); skip link as first focusable element; DOM order equals visual order.
- Names and announcements: accessible names match visible labels; external links (sources, demo.shoppa.au) carry normal link semantics with the `↗` glyph `aria-hidden`. No live regions until the contact form phase.
- Motion: 200–300ms ease-out transitions for hover lift (−1 to −2px translate) and colour; one CSS-only staggered fade-up sequence on hero load; optional scroll-triggered reveals via a small IntersectionObserver script. Project rule (from `AGENTS.md` lineage): never gate any animation behind `prefers-reduced-motion` or equivalent conditionals.

### Actions and buttons

Primary: pill, `#B8441F` fill, white 700 text, terracotta glow shadow, hover darkens and lifts 1px. Ghost: pill, transparent fill, 1.5px `#EAD3BC` border, ink text, hover border becomes accent. Dark-band variant: ink (`#3B2416`) fill on peach CTA band. Header CTA uses the primary style at compact padding. One primary action per view region.

### Forms and selection

Current scope: none rendered. The contact page publishes a `mailto:` email block (`hello@shoppa.au`) styled as a card. Planned (approved, not implemented): a Formspree-backed enquiry form mirroring the embeddings field set (Name, Email, Company, Phone, Message, Budget radios) restyled to this system - floating labels on `#FFFBF5` fields, 1.5px borders, terracotta focus border, error text in accent-deep with plain-language messages. Build it only when the user schedules the Formspree phase.

### Navigation and search

Header links: Figtree 600, 15px, ink, hover accent; current page marked by a terracotta dot, not colour alone. Footer columns use lowercase link labels matching the nav voice (the agent, why now, the catalogue, proof / our process, about us, contact us). No search.

### Cards, badges, and statuses

- Eyebrow pill: uppercase label on blush fill (`#FDE0D4`, accent text) opening every section.
- Proof pills (hero): three tinted cards (peach/sage/blush), stat in display 800 over a 12.5px label 8px below it. The cards hug their content with symmetric 18px padding; no fixed or minimum height, which previously left dead space under the label.
- Flow cards (hero visual): bordered surface cards joined by uppercase connector labels ("feeds", "answers") over short vertical rules. All three cards open with the same title row - a 28px rounded icon tile, the label, then any status pill pushed to the far edge - so the chain reads as three named steps rather than three blocks of text. Tiles: catalogue = product grid, accent text on peach; agent = robot face, white on terracotta (it replaced a bare status dot); customer = shopper, ink on blush. The title row owns the gap to whatever the card holds below it, so the three cards keep one internal rhythm. Below 640px the agent card is a single line - label left, capability chips right - because a wrapped chip row cost more vertical space above the fold than the third chip is worth; the row drops "support" and shrinks the remaining chips to the 11.5px label floor, and the chip list wraps to its own line only under about 340px.
- Conversation widget: surface card, 28px radius, chrome bar (dots + URL pill + brand chip), customer bubbles ink-filled right-aligned, agent bubbles sunken-surface left-aligned with `✦` avatar, product rows with dress thumbnail + name + meta, receipt-style order list, sage paid badge, dashed "3 days later" divider (1px dashed `--colour-border-strong` on both flanking rules).
- Product rows: two columns, thumbnail then text. The meta line sits directly under the name at 4px, at every width - never justified to the opposite edge of the row, which stranded the price ~180px from the item it prices at desktop widths. The thumbnail spans both text rows so it centres against the pair.
- Agent avatar placement: the `✦` avatar bottom-aligns to the first bubble of its message, not to the top of the message and not to the bottom of a multi-part stack, so it reads as the tail of the speech bubble. Both chat surfaces follow this: 30px in the conversation, 22px in the hero mini-chat.
- Paid badge: sage pill with a 1em tick before the label, left-aligned in the conversation and centred in the hero mini-chat (where there is no avatar column to align to), `#4C6B33` on `#E7EFD9` with a `rgba(76,107,51,.24)` hairline. The tick ink is centred in its own 12-unit viewBox and the label runs at line-height 1, so the mark and the type share one optical centre.
- Dress thumbnails (chat product rows): illustrated dress silhouettes on a 36x44 SVG canvas over a tinted tile - 30x37px at 9px radius in the conversation, 22x27px at 7px radius in the hero mini-chat. Sapphire is a scoop-neck A-line; blush is a V wrap with a crossover seam. Both are `aria-hidden`; the adjacent product name carries the meaning.
- Embed panel: `#40291A` card, peach eyebrow, display heading, two-line code block on `#2B1A0F`.
- Proof panel: terracotta gradient card with cream "See it live." heading and a white pill link to demo.shoppa.au.
- Timeline cards: translucent cream-on-espresso cards (`rgba(255,242,226,.07)`) with peach date label, display stat, source link underlined in peach.
- Source links (`src/components/SourceLink.astro`): one "Source · publisher ↗" affordance at 12px 700 for the timeline band, the shift cards, and the about-page stat cards. The label and its glyph sit in a single child element joined by a no-break space, so a wrapping publisher name never strands the ↗ on its own. Where the cards share a stretched grid row, the link is pushed to the bottom of the card so the row's links line up.
- Comparison card head (before/after catalogue cards): eyebrow pill and status pill on one centred row. The eyebrow's section-intro bottom margin is zeroed here; left in place it sits inside the flex centring and lifts the pill above the status beside it (user-reported, 2026-08-20).
- Capability chips: bordered surface pills, Figtree 600 13px.
- Status badges always combine fill + words (see Colors).

### Tables and dense data

Only the order summary: a definition-style list with dashed row dividers and a bold total row. Left-align labels, right-align amounts, minimum 14px gap between them (prototype defect fixed by decision 2026-08-18). No tables elsewhere.

### Dialogs, sheets, popovers, and tooltips

None. Do not introduce them on the marketing site.

### Alerts, loading, empty, and error states

The 404 page is the only error surface: display numeral, heading, one-line body, primary button home + ghost link to `/#agent`. No loading or empty states exist while the site is fully static.

## Do's and Don'ts

- Do render the hero highlight as a background gradient on the `actually yours` span, sized `100% 1.06em` at background position `0 0.15em` with `box-decoration-break: clone` and zero vertical padding, with hero line-height 1.06. The band must cover the whole glyph height of its own line (ascenders 0.72em above the baseline, descenders 0.19em below) and still clear the descenders on the line above: the prototype's full-height padded highlight collided with the line above (user-reported overlap, 2026-08-18) and a 72%-height band left the ascenders of `actually yours` uncovered (user-reported gap, 2026-08-19). Neither must be reproduced.
- Do pair every status with words; never colour alone.
- Do keep every capability claim traceable to `/Users/sacino/shoppa/AGENTS.md` / the approved copy contract before publishing it.
- Do keep small text on dark bands at ≥ 0.75 alpha and filled primary buttons on `#B8441F`.
- Do zero an element's own vertical margin before putting it in a centred flex or grid row. The margin sits inside the alignment, so the element's ink lands off-centre against everything beside it.
- Do let a card that is shorter than its neighbours stay short. Where a stretched card would end in empty space, either bottom-anchor its last row (source links) or stop the stretch (`align-items: start` on the contact grid).
- Don't add dark sections, glass effects, purple gradients, photography, icon libraries, or a second accent hue. Hand-built inline SVG marks are allowed and must join the existing set: one canvas size, one stroke weight, `aria-hidden`, meaning carried by adjacent text.
- Don't gate any animation behind `prefers-reduced-motion` or similar conditionals.
- Don't introduce horizontal scrolling anywhere except code blocks.
- Don't use `#9A7B5F` for normal-size text on canvas.

## Product Workflows and Content

- The site is a one-scroll persuasion flow (home) plus three supporting routes (`/about/`, `/process/`, `/contact/`) and utility routes (`/thank-you/`, 404). Section order on home is fixed: hero → the agent → the catalogue → agentic timeline → why now → testimonial → CTA band.
- Copy is a fixed contract, not a styling variable: wording was ported from the embeddings site and adapted to Shoppa product positioning by explicit user decisions (2026-08-18). The full approved wording lives in the implementation plan (`documents/todo/` of this repository). Do not invent, extend, or "improve" user-facing copy to fit a layout; remove the slot instead.
- Terminology: "your agent" (the retailer's), "the catalogue"/"your feed", "two-line embed", "agentic shopping". Nav and eyebrow labels are lowercase (the agent, the catalogue, proof, our process, about us, contact us); headings are sentence case. British English, `’` apostrophes.
- Never disclose internals in copy: the unauthenticated API, mock mode, MVP staging, repository structure, or Convex.
- The conversation script (spring-wedding dress → checkout → order #8412) is verbatim from the approved contract and mirrors the real Harlow demo; do not alter its wording, prices, or order number.

## Approved Exceptions and Drift

- Approved exceptions: the production implementation uses the approved contrast refinements: button fill `#B8441F`, ≥ 0.75 alpha small text on dark bands, and the non-overlapping hero-highlight construction.
- Known implementation drift: none.
- Placeholder content: the testimonial quote is user-approved marketing placeholder attributed to an anonymous role, awaiting a real customer quote.

## Design Verification

Current proof: the production site was built and screenshot-reviewed on 2026-08-20 across every route at 1440×900 and 390×844. Automated checks covered semantic rules, keyboard focus, colour contrast, output discovery files, overflow, and the hero highlight band at widths from 320px to 1440px, where the band must cover its own glyphs and clear the line above. The 2026-08-20 pass added measured geometry for the flow-card title rows, the before/after card heads, the source-link rows, and the contact columns, plus the hero flow stack and the single-line agent card at 1440, 1280, 960, 640, 430, 390, 375, 360, 340, and 320px. Evidence is stored in `documents/verification/screenshots/`, including `hero-highlight-<width>.png` crops.

| Viewport or mode | Routes and states | Proof |
| --- | --- | --- |
| 1440×900 desktop | `/`, `/about/`, `/process/`, `/contact/`, `/thank-you/`, 404 | Passed full-page visual review; no horizontal overflow; hero highlight covers its own glyphs and clears adjacent lines |
| 390×844 mobile | Same routes with stacked grids, collapsed header, and inset bands | Passed full-page visual review; single-column reflow and no horizontal overflow |
| Contrast and keyboard pass | Approved colour pairs and representative links | Passed automated contrast targets and visible-focus checks |

For future UI changes, repeat the full route and viewport pass, then run the default completion gate in `AGENTS.md`. Keep detailed server, browser, and evidence procedures in `documents/AGENTS/testing.md`.
