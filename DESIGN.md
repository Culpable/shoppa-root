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
- Components and icons: hand-built Astro components; no UI framework, no icon library. The agent mark is the `✦` glyph. Decorative dots, swatches, and connectors are CSS.
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
| Product swatches | sapphire #2F4E8C, blush #E8A5A0 | Dress colour dots in conversation product rows |

- Theme status: single light theme. No dark mode is supported or planned; do not add `prefers-color-scheme` variants.
- Accessibility target: working check of 4.5:1 for normal text and 3:1 for large text on every rendered pair, enforced by `#B8441F` button fill, `#AE3E1B` small accent text, `#6B4A31` small neutral labels, and ≥ 0.75 alpha for small dark-band text. No formal WCAG conformance is claimed; the automated contrast and axe-core checks measure rendered output.
- Status communication: colour never carries status alone. Paid state = sage fill + tick-free text "Paid · order confirmed"; stock state = text ("in stock", "3 left"); badges always contain words.

## Typography

- Display role: Bricolage Grotesque 700/800 for h1–h3, stat figures, panel headings, brand wordmark ("shoppa" lowercase with a terracotta full stop). Letter-spacing −0.02em to −0.03em.
- Body role: Figtree 400 for copy, 500–600 for meta and labels, 700 for buttons and chip text.
- Label role: Figtree 700, 12–12.5px, letter-spacing 0.16–0.2em, uppercase, used in eyebrow pills, timeline dates, connector labels.
- Mono role: Courier Prime, embed code blocks and code-flavoured decoration only. Never for body copy.
- Scale (approved): hero h1 `clamp(44px, 5.6vw, 72px)` at line-height 1.06; section h2 `clamp(30px, 3.8vw, 46px)` at 1.06; panel h3 24px; body 16.5px/1.65; small meta 12–13.5px. Hero line-height is deliberately 1.06, not the prototype's 1.02 — see the highlight rule under Components.
- Measure and wrapping: body copy capped near 620px; hero subhead 520px; headings wrap freely with `text-wrap: balance` where supported. No truncation or ellipsis anywhere on the marketing pages.
- Numerics and locale: en-AU. Currency as `$189` / `$189.00` exactly as the copy contract specifies; en dashes in ranges (`$3–5T`, `$100K – $500K`); `’` apostrophes in all display strings (project rule).

## Layout

- Spacing rhythm: container max-width 1140px with 32px gutters; sections separated by 72–96px; within a section, intro → content gap 44–48px; card internal padding 22–32px. `src/styles/global.css` owns the exact values.
- Breakpoints and frames: two functional breakpoints — 960px (multi-column grids stack to one column; hero split becomes a single column with the visual below the copy) and 640px (three-up pill grids stack). Full-bleed is never used for content; the dark timeline band and CTA band are rounded 44px blocks inset within the container.
- Navigation and shell: header = brand wordmark left, inline text links (the agent, the catalogue, our process, about us) centre/right, terracotta pill "Contact us" right; below 960px the inline links hide and the full route list lives in the footer (no JavaScript burger menu). Footer = three columns (offer / company / our offices) plus wordmark and dynamic-year copyright line.
- Overflow and dense data: no horizontal scrolling at any viewport ≥ 320px; the order-summary list and timeline cards reflow by stacking. Code blocks in embed panels are the only permitted `overflow-x: auto` regions.
- Touch targets: interactive elements at least 44px tall (buttons, header CTA, footer links with padding); source links and small chips at least 24px with surrounding spacing.

## Elevation & Depth

- Surface hierarchy: canvas → bordered card (1.5px `#F0DEC8` border + `0 10px 30px rgba(107,74,49,.08)`) → feature card (`0 18px 50px rgba(107,74,49,.12)`, no border). Dark bands use no shadow; their contrast is the elevation.
- Overlays and stacking: none. No modals, dropdowns, or sticky layers; the header scrolls with the page.
- Expressive depth: primary button glow `0 6px 18px rgba(214,85,43,.28)`; the timeline band carries one soft radial warm glow (top-right, `rgba(231,111,60,.35)` fading to transparent). No other glows, blurs, or glass effects.

## Shapes

- Radius and geometry: pill (999px) for buttons, chips, badges, eyebrow tags, URL pill; 20–28px for cards and panels (conversation widget 28px outer); 44px for the two inset bands; 12–16px for inner rows (product rows, code blocks, chrome bar); chat bubbles 16–20px with a 4–6px "tail" corner pointing at the speaker. Nothing square.
- Icons: no icon library. `✦` in a terracotta circle is the agent avatar; traffic-light dots, colour swatch circles, and the pulsing status dot are CSS circles. Decorative glyphs are `aria-hidden`.
- Imagery: no photography. All page visuals are typographic/CSS compositions (flow cards, conversation, receipt-style order summary). Browser identity assets in `public/` use the Warm Sunrise palette.

## Components

### Interaction and accessibility

- Semantics: native elements only — `a` for navigation, `button` reserved for future form submission, lists as `ul`/`ol`, the conversation as ordered content with visually-hidden speaker labels ("Customer:", "Your agent:") for screen readers. No custom widgets.
- Cursor and stable states: pointer on links/buttons; hover states change colour/elevation without layout shift (transform-based lifts only). No disabled states exist on the marketing site.
- Focus and keyboard: visible focus rings on every interactive element (2px ink outline with 2px offset on light, cream outline on dark/terracotta fills); skip link as first focusable element; DOM order equals visual order.
- Names and announcements: accessible names match visible labels; external links (sources, demo.shoppa.au) carry normal link semantics with the `↗` glyph `aria-hidden`. No live regions until the contact form phase.
- Motion: 200–300ms ease-out transitions for hover lift (−1 to −2px translate) and colour; one CSS-only staggered fade-up sequence on hero load; optional scroll-triggered reveals via a small IntersectionObserver script. Project rule (from `AGENTS.md` lineage): never gate any animation behind `prefers-reduced-motion` or equivalent conditionals.

### Actions and buttons

Primary: pill, `#B8441F` fill, white 700 text, terracotta glow shadow, hover darkens and lifts 1px. Ghost: pill, transparent fill, 1.5px `#EAD3BC` border, ink text, hover border becomes accent. Dark-band variant: ink (`#3B2416`) fill on peach CTA band. Header CTA uses the primary style at compact padding. One primary action per view region.

### Forms and selection

Current scope: none rendered. The contact page publishes a `mailto:` email block (`hello@shoppa.au`) styled as a card. Planned (approved, not implemented): a Formspree-backed enquiry form mirroring the embeddings field set (Name, Email, Company, Phone, Message, Budget radios) restyled to this system — floating labels on `#FFFBF5` fields, 1.5px borders, terracotta focus border, error text in accent-deep with plain-language messages. Build it only when the user schedules the Formspree phase.

### Navigation and search

Header links: Figtree 600, 15px, ink, hover accent; current page marked by a terracotta dot, not colour alone. Footer columns use lowercase link labels matching the nav voice (the agent, why now, the catalogue, proof / our process, about us, contact us). No search.

### Cards, badges, and statuses

- Eyebrow pill: uppercase label on blush fill (`#FDE0D4`, accent text) opening every section.
- Proof pills (hero): three tinted cards (peach/sage/blush), stat in display 800 over a 12.5px label.
- Flow cards (hero visual): bordered surface cards joined by uppercase connector labels ("feeds", "answers") over short vertical rules.
- Conversation widget: surface card, 28px radius, chrome bar (dots + URL pill + brand chip), customer bubbles ink-filled right-aligned, agent bubbles sunken-surface left-aligned with `✦` avatar, product rows with colour swatch + name + meta, receipt-style order list, sage paid badge, dashed "3 days later" divider.
- Embed panel: `#40291A` card, peach eyebrow, display heading, two-line code block on `#2B1A0F`.
- Proof panel: terracotta gradient card with cream "See it live." heading and a white pill link to demo.shoppa.au.
- Timeline cards: translucent cream-on-espresso cards (`rgba(255,242,226,.07)`) with peach date label, display stat, source link underlined in peach.
- Capability chips: bordered surface pills, Figtree 600 13px.
- Status badges always combine fill + words (see Colors).

### Tables and dense data

Only the order summary: a definition-style list with dashed row dividers and a bold total row. Left-align labels, right-align amounts, minimum 14px gap between them (prototype defect fixed by decision 2026-08-18). No tables elsewhere.

### Dialogs, sheets, popovers, and tooltips

None. Do not introduce them on the marketing site.

### Alerts, loading, empty, and error states

The 404 page is the only error surface: display numeral, heading, one-line body, primary button home + ghost link to `/#agent`. No loading or empty states exist while the site is fully static.

## Do's and Don'ts

- Do render the hero highlight as a bottom-anchored background gradient on the `actually yours` span, sized to about 72% of the line box with `box-decoration-break: clone` and zero vertical padding, with hero line-height 1.06 — the prototype's full-height padded highlight collided with the ascenders/descenders of the previous line (user-reported overlap, 2026-08-18) and must not be reproduced.
- Do pair every status with words; never colour alone.
- Do keep every capability claim traceable to `/Users/sacino/shoppa/AGENTS.md` / the approved copy contract before publishing it.
- Do keep small text on dark bands at ≥ 0.75 alpha and filled primary buttons on `#B8441F`.
- Don't add dark sections, glass effects, purple gradients, photography, icon libraries, or a second accent hue.
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

Current proof: the production site was built and screenshot-reviewed on 2026-08-18 across every route at 1440×900 and 390×844. Automated checks covered semantic rules, keyboard focus, colour contrast, output discovery files, overflow, and the hero highlight at widths from 320px to 1440px. Evidence is stored in `documents/verification/screenshots/`.

| Viewport or mode | Routes and states | Proof |
| --- | --- | --- |
| 1440×900 desktop | `/`, `/about/`, `/process/`, `/contact/`, `/thank-you/`, 404 | Passed full-page visual review; no horizontal overflow; hero highlight clears adjacent lines |
| 390×844 mobile | Same routes with stacked grids, collapsed header, and inset bands | Passed full-page visual review; single-column reflow and no horizontal overflow |
| Contrast and keyboard pass | Approved colour pairs and representative links | Passed automated contrast targets and visible-focus checks |

For future UI changes, repeat the full route and viewport pass, then run the default completion gate in `AGENTS.md`. Keep detailed server, browser, and evidence procedures in `documents/AGENTS/testing.md`.
