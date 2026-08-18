# Shoppa Landing Site (Astro, Warm Sunrise) Plan ✅ **COMPLETED**

<critical_warning>
> **CRITICAL WARNING:** Deployment-stack exception to the `build-astro-websites` skill. This build deploys to **GitHub Pages via GitHub Actions**, exactly as `AGENTS.md` (`<build_directives>`) and `README.md` mandate. GitHub Pages is not one of the skill's three supported stacks (Vercel, Cloudflare Workers Builds, Cloudflare Pages) - the user explicitly directed: use GitHub Pages per the AGENTS + README, and note this as an exception when using the skill. Therefore: apply the skill's architecture, engineering, and verification standards in full, but do **not** read or apply any of its provider reference files, and do not migrate hosting. `public/CNAME` is the custom-domain source of truth and must survive verbatim into the build output (`dist/CNAME`). Never move or delete it.
</critical_warning>

<important_note>
> **IMPORTANT NOTE:** Copy is a fixed contract, not a styling variable. Section 7 of this plan contains the complete approved site wording - port it verbatim (British English, `’` apostrophes in display strings). Every capability claim in it has been verified against the product repository (`/Users/sacino/shoppa/AGENTS.md`, `/Users/sacino/shoppa/README.md`). Do not invent, extend, or "improve" user-facing copy to fit a layout; if a design slot lacks approved content, remove the slot. Never mention internals: the unauthenticated API, mock mode, MVP staging, repository structure, or Convex.
</important_note>

## 1. Goal

Build the complete public marketing site for **Shoppa** (`https://shoppa.au`) in this repository (`shoppa-root`), as a fully static Astro export deployed to GitHub Pages, implementing the approved **Warm Sunrise** visual direction defined in `DESIGN.md` and the approved copy contract in Section 7.

Shoppa is an out-of-the-box AI shopping agent a retailer deploys on their own site with a two-line `<script>` embed. The agent runs the complete journey in one conversation: product discovery, add to cart, in-chat checkout, post-sale order status. The site's job is to persuade Australian retail executives to put their own agent on their storefront instead of ceding the customer relationship to third-party marketplace chat.

Done means:

- All routes build and render per `DESIGN.md`: `/`, `/about/`, `/process/`, `/contact/`, `/thank-you/`, 404.
- Every visible string matches Section 7 exactly.
- The hero highlight renders without overlapping adjacent text lines (fixing the defect the user reported from the prototype).
- Browser identity assets are redrawn in the Warm Sunrise palette.
- Sitemap, robots.txt, and llms.txt publish on the canonical origin.
- A GitHub Actions workflow builds and publishes to GitHub Pages (Pages source = GitHub Actions), with `dist/CNAME` intact.
- The prototype bundle is removed (via `trash`), `DESIGN.md` authority is transferred to the implementation, and `AGENTS.md` is recreated per the `agents-md-creator` skill, referencing `DESIGN.md`.

---

## 2. Current State Analysis

### 2.1 Current Implementation Overview

The repository is a scaffold with **no framework code**:

| Path | Contents |
| --- | --- |
| `AGENTS.md` | Repository instructions: Astro static export decided, GitHub Pages deployment, copy porting rules, `<design_documentation>` routing to `DESIGN.md` |
| `DESIGN.md` | Approved visual implementation contract (Warm Sunrise). Validated with the design-md `google` profile. Canonical design authority until implementation exists |
| `README.md` | Repo purpose, GitHub Pages intent, CNAME rationale. Its "Status" section still says the stack is undecided - now stale (Astro is decided and this plan implements it) |
| `public/CNAME` | Custom domain file (`shoppa.au`), must be copied verbatim into the build output |
| `src/app/icon.svg`, `src/app/favicon.ico`, `src/app/apple-icon.png` | Committed browser identity assets in the **old amber `#f5a623` / plum `#4a083c` palette** - a known drift from Warm Sunrise, approved for redraw |
| `prototypes/round-1-landing-directions.html`, `prototypes/prototype-manifest.json` | Throwaway prototype bundle (8 variants + picker). Variant 3 (`v3`, "Warm Sunrise") is the approved design evidence; the other 7 variants are rejected. Deleted at the end of this plan |
| `documents/todo/shoppa_landing_site_plan.md` | This plan |

### 2.2 The Core Problem

Shoppa has no public web presence. The product monorepo (`Culpable/shoppa`, locally `/Users/sacino/shoppa`) hosts the platform API (`api.shoppa.au`) and the Harlow demo store (`demo.shoppa.au`) on Vercel, but `shoppa.au` serves nothing. All marketing copy exists only on the sibling **embeddings** site (`/Users/sacino/embeddings`, a Next.js agency site), written in agency voice ("we build", "our four services") with several claims that are untrue of the Shoppa product and must not be published (see 2.5).

### 2.3 Affected User Scenarios

| Scenario | Impact today |
| --- | --- |
| Retailer hears about Shoppa and visits shoppa.au | Nothing is served; the product looks unreal |
| Prospect wants proof before a call | No page links the live Harlow demo at demo.shoppa.au |
| Prospect wants to contact the company | No published contact route exists |

### 2.4 Technical Constraints

- **Framework**: Astro static export only; no other framework is permitted (`AGENTS.md` `<technology_stack>`). Config: `site: 'https://shoppa.au'`, **no `base` subpath** (do not add `/shoppa-root/` for the temporary `culpable.github.io/shoppa-root/` URL).
- **Hosting**: GitHub Pages with the GitHub Actions source (`actions/deploy-pages`), never branch deploy. Deploys come from `main`.
- **`public/CNAME`**: source of truth for the custom domain; Astro copies `public/` into `dist/` verbatim, which is exactly why it lives there. Never move it to the repo root or delete it.
- **Copy rules** (`AGENTS.md` `<copy_rules>`): British English; `’` never `'` in display strings; no disclosure of internals; product claims verified against `/Users/sacino/shoppa/AGENTS.md` and `/Users/sacino/shoppa/README.md`.
- **Motion rule**: never add `prefers-reduced-motion` checks or similar accessibility/timing conditionals to animation code (user's global standard, restated in `DESIGN.md`).
- **Design**: `DESIGN.md` is binding - palette, typography, layout, component, motion, and accessibility-refinement rules (notably: primary button fill `#B8441F`, small dark-band text ≥ 0.75 alpha, muted `#9A7B5F` never for normal-size text).

### 2.5 Claims that must NOT be published (verified against the product repo)

The embeddings site claims these; Shoppa's product docs explicitly exclude them (MVP out-of-scope list: admin UI, end-user authentication, RAG, A2A delegation, analytics dashboards, page-context awareness, real payments, BYO search adapters):

- "Plugs into the search you already run: Algolia, Coveo, Elasticsearch, Google Retail Search, or your own index" / "bring your own search".
- Self-service control panels ("Change it yourself. Live in seconds", prompt/versioning/rollback controls).
- Analytics dashboards / "revenue analytics" / reporting tiles.
- Returns handling (the product does post-sale **order status**; returns are not a verified capability).
- Agency services as product features (LLM enrichment pipelines, trend-signal integrations, audits) - the catalogue section is reframed instead (Section 7.4).

### 2.6 Existing Infrastructure That Can Be Reused

- `prototypes/round-1-landing-directions.html` variant `v3`: the approved rendered reference for every component's look (until Step 11 deletes it, keep it open as visual reference during implementation).
- `public/CNAME`: reused as-is.
- Copy sources for porting: `/Users/sacino/embeddings/src/app/page.jsx` plus `about/`, `process/`, `contact/`, `thank-you/`, `not-found.jsx` under the same `src/app/` - already mined into the Section 7 contract; consult them only if a Section 7 string seems ambiguous.
- The real embed snippet shape, from the product README: two synchronous script tags calling `Shoppa.init({ retailerId, apiBase })` against `https://api.shoppa.au`.

---

## 3. Desired State

### 3.1 Desired State Requirements

- **REQ-1 (MUST)**: Astro static site at the repository root; `output: 'static'`, `trailingSlash: 'always'`, `site: 'https://shoppa.au'`, no `base`; every page prerendered; zero request-time handlers.
- **REQ-2 (MUST)**: Routes `/`, `/about/`, `/process/`, `/contact/`, `/thank-you/`, and a static 404, each with unique title + description from one typed metadata source, rendering the Section 7 copy verbatim.
- **REQ-3 (MUST)**: Implementation follows `DESIGN.md` (Warm Sunrise): tokens as CSS custom properties in one global stylesheet, Bricolage Grotesque / Figtree / Courier Prime self-hosted, component specs as documented.
- **REQ-4 (MUST)**: Hero highlight on "actually yours" is a bottom-anchored background gradient (~72% of line box, `box-decoration-break: clone`, no vertical padding) with hero line-height 1.06, and does not intersect the bounding boxes of adjacent text lines at any viewport ≥ 320px.
- **REQ-5 (MUST)**: `pnpm build` emits `dist/CNAME` containing exactly `shoppa.au`.
- **REQ-6 (MUST)**: GitHub Actions workflow builds on push to `main` and publishes `dist/` with `actions/deploy-pages`.
- **REQ-7 (MUST)**: Browser identity assets (SVG icon, favicon, apple touch icon) redrawn in the Warm Sunrise palette (terracotta `#D6552B` tile, cream `#FFF4E9`/`#FFFBF5` glyph) and served from `public/`.
- **REQ-8 (MUST)**: Sitemap (routes `/`, `/about/`, `/process/`, `/contact/` only), `robots.txt` referencing it, and `llms.txt` publish at the canonical origin.
- **REQ-9 (MUST NOT)**: No claim listed in 2.5 appears anywhere in the built output; no `Embeddings` brand string appears in user-visible copy; no `prefers-reduced-motion` conditional appears in any stylesheet or script.
- **REQ-10 (MUST)**: Contact page publishes the direct email `hello@shoppa.au` (mailto) with a clearly marked, non-rendering placeholder slot for a future Formspree form (Section 7.7). No form backend is built now.
- **REQ-11 (MUST)**: `prototypes/` is removed with `trash` after verification; `DESIGN.md` Source map is updated to the implementation (authority transfer) and re-validated; `README.md` "Status" is updated; `AGENTS.md` is recreated per the `agents-md-creator` skill and references `DESIGN.md`.
- **REQ-12 (SHOULD)**: Minimal browser JavaScript - at most a small processed script for scroll-reveal animation; no client framework, no islands.

### 3.2 Defaults and Fallbacks

- **Defaults**: pnpm, strict TypeScript, ESM (skill defaults for a new project). Current stable Astro from the wizard. Scoped component styles + one global stylesheet.
- **Fallback order (fonts)**: self-hosted via the Astro Fonts API per the skill's `fonts.md` reference; if a family is unavailable there, self-host woff2 files with `@font-face`; system-stack fallbacks declared either way.
- **Compatibility**: until DNS points `shoppa.au` at Pages, the site publishes at `https://culpable.github.io/shoppa-root/` - accept broken asset paths at that temporary URL rather than adding a `base` (explicit `AGENTS.md` directive).

### 3.3 Verification Checklist

**Functional:**
- [x] All six routes render with Section 7 copy, verbatim, at 1440×900 and 390×844.
- [x] Hero highlight clears adjacent lines (REQ-4) - verified against the regression screenshot in 6.1.
- [x] `dist/CNAME` == `shoppa.au`; internal links all end in `/`; canonical URLs use `https://shoppa.au`.

**Defaults/Fallbacks:**
- [x] Fonts self-hosted (no external font CDN request in the production waterfall).

**Compatibility:**
- [x] No `base` subpath configured; grep of `dist/` finds no `/shoppa-root/` paths.

**Ops/Docs:**
- [x] Workflow is present and syntax-validated; README status updated; `DESIGN.md` re-validated after authority transfer; new `AGENTS.md` in place referencing `DESIGN.md`. The first hosted workflow run remains a post-push user check.

---

## 4. Additional Context

### 4.1 User-Provided Context

- The user ran a prototype round (8 directions, one HTML bundle with a picker) and chose **Variant 3 "Warm Sunrise"**: terracotta/peach/cream, Bricolage Grotesque + Figtree, rounded cards.
- The user reported a visual defect in the chosen variant with a screenshot: the hero's peach highlight box behind "actually yours" collides with the text line above it. Regression artefact: `/Users/sacino/.t3/userdata/attachments/ae85fa7b-6e21-4acb-b8e6-a78409e529dd-9947c88b-63e7-40c3-875e-f0e5df81794a.png`.
- Hosting: the user initially suggested Cloudflare Workers, then corrected: *"for this build, make it clear we are using GitHub Pages as per the AGENTS + README. Note in the plan that this is an exception noted when using the skill."*
- Contact: *"Just go with the direct email for now, and have a placeholder for a formspree form akin to embeddings post-completion for us to add."* Published address: **hello@shoppa.au** (user-selected; a pre-launch mailbox check is Step 12's responsibility to flag, not to perform silently).
- Copy positioning: adapt embeddings copy to product positioning now (user chose this over verbatim porting). Approved adaptations: embed-led hero subhead; proof pill 3 = "2 lines / of code to go live"; agent side panels = real two-line embed + demo.shoppa.au proof; true-claim capability chips; returns and search-stack claims removed.
- Services section: reframe as the catalogue story (user choice); section label **"the catalogue"**, anchor `/#catalogue` (user choice).
- Testimonial: keep the slot with a product-specific placeholder quote, Draft A (user choice; wording in 7.4). Attribution stays anonymous: "Australian retail executive · Head of Digital, National Retailer".
- The plan must reference (not inline) the `build-astro-websites` and `agents-md-creator` skills; DESIGN.md was created first per `design-md-creator` and is committed context.
- Cleanup of unused prototypes and end-of-work AGENTS.md recreation were explicitly requested.

### 4.2 Background and Decisions

- **Rejected: Cloudflare Workers/Pages hosting** - superseded by the user's GitHub Pages correction above.
- **Rejected: Formspree form now** - deferred to a post-completion phase; the placeholder must make the future drop-in trivial (7.7 documents the exact future form contract so no re-research is needed).
- **Rejected: porting the embeddings controls/reporting panels, search-integration claims, four-service section, returns copy, and agency testimonial** - each conflicts with the product truth (2.5).
- **Skill usage**: before any scaffolding, read the `build-astro-websites` skill (`/Users/sacino/.agents/skills/build-astro-websites/SKILL.md`) and its conditional references as they trigger (project-structure, fonts, accessibility-for-agents, content-and-build-data if content collections are used, sitemap, robots-txt, llms-txt, third-party-scripts only if a script is ever added). Skip all three provider references (deployment-stack exception). At the end, read and follow `agents-md-creator` (`/Users/sacino/.agents/skills/agents-md-creator/SKILL.md`) to recreate `AGENTS.md`.
- **Nav voice**: lowercase labels (the agent, the catalogue, proof, our process, about us, contact us); headings sentence case. The embeddings full-screen burger nav is **not** ported: header carries inline links on desktop and hides them below 960px, with the full route list in the footer (DESIGN.md, Layout).
- **Anchors**: `#agent`, `#catalogue`, `#why-now` (dark timeline band), `#proof` (testimonial). Footer "why now" links to `/#why-now`. The agent-section demo panel uses eyebrow "the demo" to avoid clashing with the `#proof` testimonial anchor.
- **The conversation script is real**: it mirrors the seeded Harlow demo in the product repo (sapphire dress $189, order #8412 "out for delivery"). Do not alter its wording, prices, or order number.
- **Embed snippet**: rendered as display code with `retailerId: "yourstore"` (matching the `yourstore.com.au` mock chrome). It is illustrative of the real integration documented in the product README; keep it to two logical script tags.
- **`src/app/` identity assets**: a Next.js-style location that predates Astro. Assets move to `public/` (Astro serves favicons from `public/`), redrawn per REQ-7; originals are removed with `trash` in the same step (they are committed, so git history preserves them).

---

## 5. Implementation Plan

### ~~Step 1: Preconditions and skill gates~~ ✅ **COMPLETED**
**Objective:** Load every binding instruction before touching the repository.

#### 1.1 High-Level Approach
- Read `AGENTS.md`, `DESIGN.md`, this plan in full.
- Read `/Users/sacino/.agents/skills/build-astro-websites/SKILL.md` in full; note the deployment-stack exception (critical warning above); read `references/project-structure.md` before scaffolding and `references/accessibility-for-agents.md` before building pages.

**Success Criteria:**
- `AGENTS.md`, `DESIGN.md`, this plan, and `/Users/sacino/.agents/skills/build-astro-websites/SKILL.md` have each been read in full before any file is created or edited.
- The skill's `references/project-structure.md` is read before Step 2 and `references/accessibility-for-agents.md` before Step 6.
- Zero provider reference files (`references/vercel.md`, `references/cloudflare-workers-builds-github.md`, `references/cloudflare-pages-github.md`) are read or applied at any point in this plan.

### ~~Step 2: Scaffold Astro~~ ✅ **COMPLETED**
**Objective:** Create the static-first project at the repository root.

#### 2.1 High-Level Approach
- Current-stable Astro via the wizard; pnpm; strict TypeScript; ESM. Configure `output: 'static'`, `trailingSlash: 'always'`, `site: 'https://shoppa.au'`, no `base`, no adapter, no integrations beyond what sitemap generation requires.
- Follow the skill's `project-structure.md` for the tree. Preserve `public/CNAME`, `AGENTS.md`, `DESIGN.md`, `README.md`, `documents/`, `prototypes/` untouched.

**Success Criteria:**
- `pnpm build` succeeds; `dist/CNAME` contains exactly `shoppa.au`; `dist/index.html` exists.
- `astro.config.*` contains `site: 'https://shoppa.au'`, `trailingSlash: 'always'`, and no `base` key.
- `package.json` scripts include `dev`, `build`, `preview`.

### ~~Step 3: Fonts and global styles~~ ✅ **COMPLETED**
**Objective:** Encode the DESIGN.md token system.

#### 3.1 High-Level Approach
- Read the skill's `references/fonts.md`, then self-host Bricolage Grotesque (700/800), Figtree (400/500/600/700), Courier Prime (400/700).
- One global stylesheet defining every custom property named in `DESIGN.md` Colors (canvas `#FFF4E9`, surface `#FFFBF5`, sunken `#FFF2E2`, ink `#3B2416`, ink-secondary `#6B4A31`, ink-muted `#9A7B5F`, accent `#D6552B`, accent-deep `#B8441F`, highlight `#FFD9B4→#FFC896`, tints `#FFE3C6`/`#FDE0D4`/`#E7EFD9`, success `#4C6B33`, borders `#F0DEC8`/`#EAD3BC`, band `#3A2414`/`#40291A`/`#2B1A0F`, band-text `#FFF2E2`, band-accent `#FFC896`), spacing, radius ladder, shadows, and the type scale.

**Success Criteria:**
- Production build's network waterfall contains no third-party font origin.
- Global stylesheet defines every colour custom property listed above; grep confirms no component hard-codes a palette hex outside it.
- No `prefers-reduced-motion` string anywhere in `src/`.

### ~~Step 4: Base layout, metadata, header, footer~~ ✅ **COMPLETED**
**Objective:** The shared shell every page uses.

#### 4.1 High-Level Approach
- Base layout: `lang="en-AU"`, skip link, landmarks, metadata defaults from one typed metadata module (title template `%s / Shoppa`, OG siteName `Shoppa`, canonical from `site`), header and footer per DESIGN.md Navigation and Section 7.1 copy.

**Success Criteria:**
- Every built page has a unique `<title>` and meta description sourced from the metadata module; canonical URLs are `https://shoppa.au/...` with trailing slashes.
- Header renders brand + 4 inline links + Contact us button ≥ 960px; links hidden below 960px; footer renders the three columns and `© shoppa` + current year on every page.
- Skip link is the first focusable element on every page.

### ~~Step 5: Brand identity assets~~ ✅ **COMPLETED**
**Objective:** Resolve the approved palette drift.

#### 5.1 High-Level Approach
- Redraw `icon.svg` in Warm Sunrise: terracotta `#D6552B` rounded tile, cream chat-bubble + bag-handle + sparkle glyphs (same composition as the current amber/plum icon). Regenerate `favicon.ico` and `apple-icon.png` from it. Serve from `public/`; wire `<link rel="icon">` / `<link rel="apple-touch-icon">` in the base layout. `trash` the superseded `src/app/` originals.

**Success Criteria:**
- Built output serves the new icons; no `#f5a623` or `#4a083c` fill remains in any shipped asset.
- `src/app/` no longer exists in the working tree (originals recoverable from git history).

### ~~Step 6: Home page~~ ✅ **COMPLETED**
**Objective:** The full one-scroll persuasion flow, Section 7.2–7.4 copy, DESIGN.md components.

#### 6.1 High-Level Approach
- Sections in fixed order: hero (headline with fixed highlight, subhead, CTAs, proof pills, flow visual) → the agent (`#agent`: intro, conversation widget, embed + demo panels, capability chips) → the catalogue (`#catalogue`: intro, Before/After cards, feed-field pills) → agentic timeline (`#why-now` dark band) → why-now cards → testimonial (`#proof` dark band) → CTA band.
- Hero highlight per REQ-4/DESIGN.md Do's and Don'ts. Conversation, order summary, badges, timeline cards, and panels per DESIGN.md Components.
- Motion: hero CSS stagger + optional IntersectionObserver reveal script (small, processed, no gating conditionals).

**Success Criteria:**
- Rendered home page contains every string of Sections 7.2–7.4 exactly once each (except deliberate repeats noted there), and none of the 2.5 forbidden claims (grep the built HTML for `Algolia`, `self-service`, `analytics`, `returns`, `Embeddings` - all absent).
- Highlight bounding box does not intersect the line above at 1440, 960, 640, 390, and 320 px widths (visual check against the 6.1 artefact).
- Anchors `#agent`, `#catalogue`, `#why-now`, `#proof` land with `scroll-margin` clearing the content.
- Timeline source links point at the four exact URLs in 7.4 with `target="_blank" rel="noreferrer"`.

### ~~Step 7: Subpages~~ ✅ **COMPLETED**
**Objective:** `/about/`, `/process/`, `/contact/`, `/thank-you/`, 404 with Section 7.5–7.9 copy.

#### 7.1 High-Level Approach
- Shared page-intro pattern (eyebrow pill + display title + body) restyled to Warm Sunrise; contact page renders the email card + offices column and the commented Formspree placeholder slot (7.7); thank-you and 404 per 7.8–7.9.

**Success Criteria:**
- Each route renders its Section 7 copy verbatim; `hello@shoppa.au` appears as a `mailto:` link on `/contact/`.
- The Formspree placeholder produces zero rendered output in the built HTML (comment or unrendered component only) and is discoverable by grepping for `FORMSPREE`.
- 404 page is emitted at the Pages-conventional path (`dist/404.html`).

### ~~Step 8: Discovery outputs~~ ✅ **COMPLETED**
**Objective:** Sitemap, robots.txt, llms.txt.

#### 8.1 High-Level Approach
- Read the skill's `references/sitemap.md`, `references/robots-txt.md`, `references/llms-txt.md`, then implement: sitemap containing exactly `/`, `/about/`, `/process/`, `/contact/` (thank-you and 404 excluded); robots.txt allowing all and naming the sitemap URL; llms.txt derived from the same verified site facts.

**Success Criteria:**
- `dist/` contains the three files; sitemap URLs all start `https://shoppa.au/` and end with `/`; robots.txt references `https://shoppa.au/sitemap-index.xml` (or the emitted sitemap filename); llms.txt mentions only shipped routes and verified product facts.

### ~~Step 9: GitHub Pages workflow~~ ✅ **COMPLETED**
**Objective:** Automated deploy from `main`.

#### 9.1 High-Level Approach
- `.github/workflows/deploy.yml`: on push to `main` - pnpm install, `pnpm build`, upload `dist/` artefact, `actions/deploy-pages`. Enabling the Pages "GitHub Actions" source and DNS remain user actions; the workflow must not require secrets.

**Success Criteria:**
- Workflow YAML validates (`act`-free check: correct `permissions: pages: write, id-token: write`, upload-pages-artifact + deploy-pages pairing).
- Local `pnpm build` (the same command the workflow runs) passes on a fresh install (`pnpm install --frozen-lockfile && pnpm build`).
- Pushing/deploying is **not** performed without explicit user authorisation; the plan step ends with the workflow committed locally.

### ~~Step 10: Verification pass~~ ✅ **COMPLETED**
**Objective:** Prove the site against DESIGN.md Design Verification.

#### 10.1 High-Level Approach
- Build; inspect rendered output at 1440×900 and 390×844 for all routes; contrast-measure the pairs listed in DESIGN.md Colors; keyboard/focus/skip-link pass; link check over `dist/`.

**Success Criteria:**
- No horizontal overflow at 320–1440 px on any route (scrollWidth ≤ viewport width, code blocks excepted).
- Measured contrast: body text pairs ≥ 4.5:1; large display pairs ≥ 3:1; white-on-`#B8441F` ≥ 4.5:1.
- Zero console errors; zero broken internal links; every internal href ends in `/` or `#anchor`.
- Regression artefact check (6.1) passes.

### ~~Step 11: Prototype cleanup and DESIGN.md authority transfer~~ ✅ **COMPLETED**
**Objective:** Remove throwaway code; make the implementation the design authority.

#### 11.1 High-Level Approach
- `trash prototypes/` (both manifest-listed files; nothing else).
- Update `DESIGN.md`: Source map rows for prototype → replaced by the implementation's global stylesheet and components; "Purpose and authority" updated to implementation-authoritative; Approved Exceptions updated (icon drift resolved; prototype note removed). Re-run `python3 /Users/sacino/.agents/skills/design-md-creator/scripts/validate_design_md.py /Users/sacino/shoppa-root/DESIGN.md --project-root /Users/sacino/shoppa-root --profile compatibility`.

**Success Criteria:**
- `prototypes/` no longer exists in the working tree; recoverable from Trash.
- Validator exits 0; no Source-map path errors; DESIGN.md no longer references `prototypes/`.

### ~~Step 12: Documentation truth~~ ✅ **COMPLETED**
**Objective:** Repository docs match reality.

#### 12.1 High-Level Approach
- Update `README.md`: Status section (Astro implemented; commands; deploy pipeline as-built). Keep the CNAME and Pages rationale.
- Flag to the user (in the completion report, not silently): confirm the `hello@shoppa.au` mailbox or forward exists before DNS cutover.

**Success Criteria:**
- README contains the actual build/dev commands and no "stack is still to be decided" text.
- Completion report includes the mailbox flag and the two user actions (enable Pages Actions source, point DNS).

### ~~Step 13: Recreate AGENTS.md~~ ✅ **COMPLETED**
**Objective:** Repository instructions reflect the implemented site.

#### 13.1 High-Level Approach
- Read `/Users/sacino/.agents/skills/agents-md-creator/SKILL.md` in full and follow it to recreate `AGENTS.md` for the implemented repository. It must preserve the binding build directives (GitHub Pages, CNAME, no base), the copy rules, and a `<design_documentation>` section routing UI work to `DESIGN.md`.

**Success Criteria:**
- New `AGENTS.md` exists, contains a `<design_documentation>` reference to `DESIGN.md`, retains the CNAME/Pages/no-base directives and copy rules, and passes whatever validation the agents-md-creator skill defines.

---

## 6. Testing Plan

### 6.1 Source-of-Truth Regression Artefacts

- **`/Users/sacino/.t3/userdata/attachments/ae85fa7b-6e21-4acb-b8e6-a78409e529dd-9947c88b-63e7-40c3-875e-f0e5df81794a.png`** - user's screenshot of the prototype hero showing the peach highlight box behind "actually yours" colliding with the line above ("agent that's"). This is the defect REQ-4 fixes. Expected post-fix behaviour: at the same composition (~750 px wide hero column), the highlight's painted box starts below the previous line's descender zone; no pixel of the highlight background touches the glyph bounds of the line above. Verify manually by screenshotting the implemented hero at matching widths and comparing against this artefact. Use the artefact directly (side-by-side) - do not substitute a synthetic mock-up.
- **`prototypes/round-1-landing-directions.html` (variant `v3`)** - the approved look reference for every component until Step 11 removes it. Expected behaviour: the implementation visually matches `v3` except the documented refinements (highlight fix, `#B8441F` button fill, ≥ 0.75 alpha dark-band small text, redrawn icons). Scoped use: visual comparison only; its code must not be promoted into production files.

<critical_warning>
> **CRITICAL WARNING:** The overlap screenshot above is the regression source of truth for REQ-4 and must be used for the visual comparison; a clean synthetic reproduction does not replace it. The prototype file is deleted in Step 11 - complete all visual comparisons before that step.
</critical_warning>

### 6.2 Unit Tests

No unit-test framework exists and the site has no logic modules; content invariants are tested as build-output assertions instead (6.3). If a metadata or sitemap helper module is created with non-trivial logic, add a Vitest spec beside the skill's conventions; otherwise add no test scaffolding.

### 6.3 Integration Tests

1. Build-output copy and claim audit
   - Action: `pnpm build`, then grep `dist/**/*.html`.
   - Expected: zero matches for `Algolia`, `Coveo`, `Elasticsearch`, `self-service`, `analytics`, `Embeddings`, `Convex`, `mock mode`; ≥ 1 match on the home page for each hero/agent/catalogue heading string of Section 7; every apostrophe in display copy is `’` (grep for `'` inside rendered text nodes of headings returns nothing).
   - Verify: exit codes of the greps as pass/fail.
2. Static contract
   - Action: inspect `dist/`.
   - Expected: `dist/CNAME` == `shoppa.au`; `dist/404.html` exists; sitemap/robots/llms.txt present; no file references `/shoppa-root/`.
   - Verify: file assertions + grep.
3. Rendered verification
   - Action: `pnpm preview`, browse all routes at 1440×900 and 390×844 (headless Chrome screenshots acceptable).
   - Expected: DESIGN.md Design Verification table outcomes; REQ-4 comparison against the 6.1 screenshot; keyboard tab order and visible focus on header, hero CTAs, source links, footer.
   - Verify: screenshot review + documented pass/fail per route.
4. Workflow dry-run equivalence
   - Action: `pnpm install --frozen-lockfile && pnpm build` from a clean state.
   - Expected: identical success to the CI workflow's steps; no network font fetch, no secret required.
   - Verify: command exit code.

---

## 7. Approved Copy Contract (verbatim; `’` apostrophes)

### 7.1 Global chrome and metadata

- Site title: `Shoppa: The AI Shopping Agent Australian Retailers Own`
- Site description: `An out-of-the-box AI shopping agent you own. Two lines of code put discovery, checkout, and order support on your own site, answering from your catalogue.`
- Title template: `%s / Shoppa`; OG siteName `Shoppa`; locale `en-AU`.
- Skip link: `Skip to content`
- Header: brand wordmark `shoppa.` (lowercase, terracotta full stop) · links `the agent` (`/#agent`), `the catalogue` (`/#catalogue`), `our process` (`/process/`), `about us` (`/about/`) · button `Contact us` (`/contact/`).
- Footer column `offer`: `the agent` `/#agent` · `why now` `/#why-now` · `the catalogue` `/#catalogue` · `proof` `/#proof`. Column `company`: `our process` · `about us` · `contact us`. Column `our offices`: `perth` · `melbourne`. Bottom bar: wordmark + `© shoppa {currentYear}`.

### 7.2 Home - hero

- H1: `The shopping agent that’s actually yours` (highlight on `actually yours`)
- Subhead: `Shoppa drops into your site with two lines of code. Your agent takes customers from first question to checkout, and keeps helping after the sale.`
- Buttons: `Contact us` → `/contact/` · `Learn how it works` → `/process/`
- Proof pills: `Sold` / `in one conversation` · `Yours` / `not rented` · `2 lines` / `of code to go live`
- Flow visual: card `Your catalogue` + badge `ready` + meta `details · descriptions · stock` → connector `feeds` → card `Your agent` + chips `discover` `checkout` `support` → connector `answers` → card `Your customer` containing mini chrome `yourstore.com.au` / `✦ your brand` and mini chat: customer `Do you have the Sapphire Blue Midi in size 10?` · agent `Found it: in stock and in your size.` · product row `Sapphire Blue Midi` / `$189 · size 10 · in stock` · agent `Pay here in the chat?` · badge `Paid · order confirmed`

### 7.3 Home - the agent (`#agent`)

- Eyebrow `the agent`; H2 `One conversation from ‘I’m looking for…’ to ‘it’s on its way’`
- Intro P1: `Your agent greets customers on your site, answers from your catalogue, takes payment in the chat, and handles the follow-ups, starting with ‘where’s my order?’`
- Intro P2: `It’s grounded in your own product catalogue, ingested from the feed you already have.`
- Conversation (chrome `yourstore.com.au` / `✦ your brand`; sr-only speaker labels `Customer:` / `Your agent:`):
  1. Customer: `I need a dress for a spring wedding, size 10, under $200`
  2. Agent: `Lovely occasion. These two suit an outdoor spring wedding, and both are in your size right now:` + product cards `Sapphire Blue A-Line Midi Dress` / `$189 · size 10 · in stock` and `Blush Crepe Wrap Midi Dress` / `$159 · size 10 · 3 left`
  3. Customer: `The sapphire one, with express delivery please. Can I pay here?`
  4. Agent: `Of course. Here’s your order:` + order rows `Sapphire Blue A-Line Midi` `$189.00` / `Express delivery` `$9.95` / `Total` `$198.95` + badge `Paid · order confirmed`
  5. Divider: `3 days later`
  6. Customer: `Where’s my order?`
  7. Agent: `Good news. Order #8412 is out for delivery and should be with you today.`
- Embed panel: eyebrow `the embed`; H3 `Two lines of code.`; body `No rebuild, no platform migration.`; code block:
  `<script src="https://api.shoppa.au/embed/shoppa.js"></script>`
  `<script>Shoppa.init({ retailerId: "yourstore", apiBase: "https://api.shoppa.au" })</script>`
- Demo panel: eyebrow `the demo`; H3 `See it live.`; body `Harlow the Label, a demo boutique running the real embed.`; link `demo.shoppa.au ↗` → `https://demo.shoppa.au`
- Capability chips: `conversational discovery` · `checkout in the chat` · `order support` · `catalogue-grounded` · `on-brand` · `two-line embed`

### 7.4 Home - remaining sections

**The catalogue (`#catalogue`)** - eyebrow `the catalogue`; H2 `Your catalogue is your agent’s brain.`; body: `Everything your agent says starts with your product data. Shoppa ingests the feed you already have — titles, descriptions, prices, sizes, stock — and answers only from it. A complete, current feed is the difference between a guess and a confident answer.`
Before card: eyebrow `Before`; badge `Incomplete`; title `Blue Dress`; GTIN row empty; description `A blue dress for women.`; facts `coverage` / `thin`, `agent signal` / `unclear`; muted tags `colour?` `silhouette?` `occasion?` `material?`; footnote `Last updated: 8 months ago`.
After card: eyebrow `After`; badge `Agentic-ready`; title `Women’s A-Line Midi Dress — Sapphire Blue, Taylor Swift-inspired`; `GTIN` / `0614141123456`; description `Flattering A-line midi dress in sapphire blue crepe. Features a fitted bodice with subtle darting, a flowing midi-length skirt, and concealed side zip. Inspired by the blue dress trend popularised by Taylor Swift. Perfect for weddings, racing carnivals, and cocktail events. Machine washable. Available in sizes 6–18.`; facts `coverage` / `complete`, `agent signal` / `clear`; tags `Sapphire Blue` `A-Line` `Midi` `Wedding Guest` `Crepe` `Sizes 6–18`; trend row `Trending: Taylor Swift blue dress`; footnote `Last updated: 2 hours ago`.
Between the cards, feed-field pills under the caps label `what your feed carries`: `titles` · `descriptions` · `prices` · `sizes & colours` · `stock & availability` · `images`. Closing line: `Fresh feed in, accurate agent out.`

**Agentic timeline (`#why-now`, dark band)** - H2 `Agentic shopping isn’t coming. It’s here.` Cards:
1. `Sep 2025` / `700M+` / `weekly users` / `OpenAI launches Instant Checkout in ChatGPT` / `Source · OpenAI Instant Checkout` → `https://openai.com/index/buy-it-in-chatgpt/`
2. `Jan 2026` / `UCP` / `agent checkout standard` / `Google launches UCP, an open standard for agent checkout` / `Source · Google UCP` → `https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/`
3. `2026` / `81%` / `of retail executives` / `say AI will weaken brand loyalty (Deloitte)` / `Source · Deloitte 2026 outlook` → `https://www.deloitte.com/us/en/insights/industry/retail-distribution/retail-distribution-industry-outlook.html`
4. `2030` / `$3–5T` / `agentic commerce` / `McKinsey projects $3–5 trillion globally` / `Source · McKinsey` → `https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-automation-curve-in-agentic-commerce`
Closing: `Retailers who own the conversation keep the customer.` / `The rest are handing their relationships to someone else’s agent.`

**Why now** - eyebrow `the shift`; H2 `Your customers will talk to an AI agent. Make sure it’s yours.`; body `When shopping moves into a third-party chat, the platform owns the relationship, the data, and the follow-up sale. A shopping agent you own keeps discovery, checkout, and after-sales support on your site, in your brand, answering from your catalogue.` Cards:
1. Title-led `Disintermediation` - `AI agents become the storefront. If the agent belongs to a platform, the customer relationship, loyalty activation, and first-party data go with it. Your own agent keeps them.` / `Source · McKinsey` (same URL as timeline card 4)
2. Stat-led `393%` / `YoY growth in AI-driven retail traffic in Q1 2026` / title `The data foundation` - `An agent is only as good as the catalogue behind it. Missing descriptions, stale inventory, and inconsistent taxonomy produce wrong answers, whether the agent is yours or a platform’s.` / `Source · Adobe Digital Insights` → `https://business.adobe.com/blog/ai-traffic-surge-retail-sites-not-machine-readable`
3. Title-led `The race is on` - `Early movers are already putting branded agents in front of their customers. Every month without one is a month of conversations, and conversions, happening somewhere else.` / `Source · Deloitte 2026 outlook` (same URL as timeline card 3)

**Testimonial (`#proof`, dark band)** - quote: `We went from a script tag to a live agent in an afternoon. Customers ask, pay, and track orders without leaving the chat — and it’s our brand doing the talking.` (underline emphasis on `in an afternoon` and `our brand doing the talking`). Attribution: `Australian retail executive` / `Head of Digital, National Retailer`.

**CTA band** - H2 `Put your own agent in the conversation`; body `The retailers deploying their own shopping agents today are building customer relationships that compound tomorrow.`; button `Contact us` → `/contact/`. Decorative floating snippets (aria-hidden): `GTIN 0614141123456` · `colour: Sapphire Blue` · `silhouette: A-Line` · `occasion: Wedding Guest` · `material: Crepe` · `Women’s Midi Dress` · `checkout: in conversation` · `order #8412: shipped` · `agent: on-brand reply sent` · `price: $189.00 AUD`

### 7.5 About (`/about/`)

- Meta: title `About Us`; description `The team building Shoppa, the AI shopping agent Australian retailers deploy and own on their own sites.`
- Eyebrow `about us`; Title `The team building Australia’s retailer-owned shopping agents`
- P1: `Shoppa was built on a single conviction: the retailers who win in agentic commerce will be the ones who own the conversation and have the best product data behind it. So we made owning the conversation as simple as two lines of code.`
- P2: `We don’t hand you a strategy deck and wish you luck. Shoppa is a working agent: point it at your catalogue feed, drop the embed on your site, and your customers start conversations that end in checkouts.`
- Proof band: `focus` / `retailer-owned shopping agents` · `built as` / `an out-of-the-box agent you deploy` · `based in` / `Perth + Melbourne`
- Continuation P1: `Shoppa was built by engineers who spent years building large language model pipelines and enterprise data systems. When agentic shopping emerged — AI agents autonomously researching and purchasing on behalf of consumers — we saw the critical gap: retailers had no way to put their own agent in front of customers without ceding the relationship to a platform. We built Shoppa to close that gap.`
- Continuation P2: `Our approach is engineering-led and outcome-driven. Success is a customer who asks, pays, and gets a straight answer about their order without ever leaving your site.`
- Dark block: eyebrow `our approach`; Title `Built for retail conversations, not generic AI chat`; body `Most AI tools bolt a chat window onto a website and stop there. We chose a different path: one product for one problem. Putting a trustworthy agent between a retailer and their customer, on the retailer’s terms, grounded in the retailer’s own product data.`
- Capability cards: `01` `The agent` - `Discovery, checkout, and order support in one conversation. Your agent greets customers, answers from your catalogue, takes payment in the chat, and handles ‘where’s my order?’ follow-ups.` · `02` `The embed` - `The complete integration is two script tags. No rebuild, no platform migration, no new storefront — your agent lives on the site you already have, in your brand.` · `03` `The catalogue` - `Your agent is grounded in the product feed you already run. Complete titles, descriptions, prices, sizes, and stock are what turn a chat window into a salesperson.`
- Stats band (with source pills): `393%` / `YoY growth in AI-driven e-commerce` / `Adobe` (URL as 7.4) · `$3–5T` / `Projected agentic commerce by 2030` / `McKinsey` (URL as 7.4) · `81%` / `Of retail execs say AI will weaken brand loyalty` / `Deloitte` (URL as 7.4)
- Page ends with the CTA band (7.4).

### 7.6 Process (`/process/`)

- Meta: title `From Catalogue to Live Agent`; description `How Shoppa goes live on your site: connect your catalogue, add the two-line embed, and let your agent sell in conversation.`
- Eyebrow `our process`; Title `How Shoppa takes you from catalogue to live agent`; body `It starts with your product data, because your agent is only as good as what it knows. Then the embed puts the agent on your site, and the conversation does the rest.`
- Stage `01` `Connect` - heading `Point Shoppa at the feed you already have`
  - P1: `Shoppa ingests your product feed — JSON or CSV — and turns it into the knowledge your agent sells from. Titles, descriptions, categories, prices, sizes, colours, stock, and images: the fields you already maintain are all it needs.`
  - P2: `Updates are incremental: re-ingest the feed and only changed products are touched. Mark a product out of stock and it leaves the agent’s in-stock answers — your agent never recommends what you can’t sell.`
  - `Included in this phase` tags: `Product Feed` · `JSON or CSV` · `Prices in AUD` · `Sizes & Colours` · `Stock & Availability` · `Images`
- Stage `02` `Embed` - heading `Two lines of code, in your brand`
  - P1: `The complete integration is two script tags. Drop them on your site, point them at your retailer ID, and the agent appears in your storefront — designed to sit inside your brand rather than a bolted-on chat box.`
  - P2: `There’s nothing to rebuild and nothing to migrate: your site stays exactly as it is, and the agent runs on top of it.`
  - Code block: same two-line embed as 7.3.
- Stage `03` `Sell` - heading `One conversation, start to finish`
  - P1: `Your agent runs the whole journey: product discovery, add to cart, checkout in the chat, and post-sale order status. Customers ask in their own words and get answers grounded in your catalogue — with the sale and the relationship staying on your site.`
  - P2: `After the sale, the same conversation keeps working: ‘where’s my order?’ gets a real answer, tied to the order the agent just took.`
- Values: eyebrow `our values`; Title `Built for retail conversations, not generic AI adoption`; body `Putting a trustworthy agent between you and your customer is a technical and commercial problem. These principles keep Shoppa focused on answer quality and revenue rather than AI theatre.` Grid:
  - `Agent-readable data` - `Product records need complete identifiers, attributes, descriptions, and categories that agents can compare without guessing.`
  - `Freshness as a signal` - `Stock, price, availability, and status changes must reach your agent before stale data costs a sale.`
  - `Grounded answers` - `Your agent answers from your catalogue, not from the open internet. If it isn’t in your data, it isn’t in the answer.`
  - `Brand-safe conversations` - `The agent lives in your brand, on your site, speaking to your customers — never a third-party surface between you.`
  - `Ownership` - `The conversation, the checkout, and the customer relationship stay yours. That is the point.`
  - `One conversation` - `Discovery, checkout, and order support belong in the same thread, not three different tools.`
- Page ends with the CTA band (7.4).

### 7.7 Contact (`/contact/`)

- Meta: title `Contact Us`; description `Contact us to put your own AI shopping agent on your site.`
- Eyebrow `contact us`; Title `Your agent starts here`; body `Ready to own the conversation with your customers? Tell us about your store and your catalogue, and we’ll map the fastest path to a live agent.`
- Enquiry card (current build): heading `business enquiries`; body `Email us and we’ll respond with the right next step.`; link `hello@shoppa.au` (`mailto:hello@shoppa.au`).
- Details column: heading `our offices`; body `We’re based in Perth and Melbourne, and work with retailers all over Australia.`; offices `perth` · `melbourne`; heading `email us`; term `business enquiries` / `hello@shoppa.au` (mailto).
- **Formspree placeholder (do not render):** a clearly marked comment/unrendered slot labelled `FORMSPREE` where the future form mounts, documenting the deferred contract: fields `Name`, `Email`, `Company`, `Phone`, `Message` (all required) + `Budget` radios `Less than 100k` / `$100K – $500K` / `$500K – $1M` / `More than $1M`; submit `Send message`; hidden `_subject` = `New business enquiry from shoppa.au`, `_next` = `https://shoppa.au/thank-you/`, `_gotcha` honeypot; error fallbacks reference `hello@shoppa.au`. Built only when the user schedules the Formspree phase with their form ID.

### 7.8 Thank you (`/thank-you/`)

- Meta: title `Thank You`; description `Confirmation that Shoppa received your business enquiry.` Excluded from the sitemap.
- Eyebrow `message received`; Title `We’ll review your enquiry`; body `Thanks for getting in touch. We’ll look at your store and respond with the fastest path to a live agent.`
- Card `What to expect`: P1 `We’ll reply with the next step: a look at your catalogue feed, and how the two-line embed goes onto your site.` P2 `If anything is urgent, email hello@shoppa.au directly and include the company name from your enquiry.` Buttons: `Back to home` → `/` · `See the agent` → `/#agent`.

### 7.9 404

- Numeral `404`; heading `Page not found`; body `Sorry, we couldn’t find the page you’re looking for.`; buttons `Go to the home page` → `/` · `See the agent` → `/#agent`.

---

## Implemented Solution

Completed on 2026-08-18.

- Scaffolded Astro as a fully static pnpm project with strict TypeScript, canonical origin `https://shoppa.au`, trailing-slash routes, no base path, and self-hosted Bricolage Grotesque, Figtree, and Courier Prime fonts.
- Built the complete Warm Sunrise site: home, about, process, contact, thank-you, and 404 pages with the approved fixed copy and responsive shared header, footer, page intro, and CTA components.
- Implemented the retailer-owned agent story, catalogue comparison, agentic-shopping timeline, proof content, two-line embed example, direct email contact, and non-rendering Formspree placeholder.
- Added Warm Sunrise browser identity assets under `public/` and removed the superseded `src/app/` copies through Trash.
- Added canonical metadata, a four-route sitemap, robots policy, `llms.txt`, and build-output assertions for required files, forbidden claims, links, and discovery membership.
- Added the GitHub Pages Actions workflow that installs with the frozen lockfile, builds `dist/`, uploads the Pages artifact, and deploys from `main` without secrets.
- Added a 33-rule agent accessibility contract plus full axe-core scans, contrast assertions, focus and skip-link checks, current-navigation checks, route metadata checks, no-overflow checks, and the hero-highlight regression at 1440, 960, 640, 390, and 320 pixels.
- Verified all six routes visually at 1440×900 and 390×844. Final full-page screenshots are stored in `documents/verification/screenshots/`.
- Ran two independent post-change audits. Fixed all three confirmed findings: a hard-coded Playwright checkout path, three low-contrast small-label pairs, and duplicate current-page navigation states. The combined record is `documents/todo/bugs/codex/subagent_bug_sweep_20260818_combined.xml`.
- Moved the prototype bundle to Trash after visual comparison. Updated `DESIGN.md`, `README.md`, and the routed `AGENTS.md` instruction bundle to match the shipped implementation.

Final validation:

- `pnpm install --frozen-lockfile` - passed.
- `pnpm build` - passed with 0 errors, 0 warnings, and 0 hints; built six pages and all discovery outputs.
- `pnpm test` - passed build-output validation and 22 Playwright tests across desktop and mobile, including the 200% desktop zoom equivalent.
- Design contract validator - passed with no findings.
- Agent instruction bundle validator - passed within the active instruction budget.
- GitHub Actions workflow YAML parser - passed.
- Consolidated audit XML - passed XML parsing.

Deployment was not run. Before launch, confirm that `hello@shoppa.au` receives mail, enable GitHub Pages with the GitHub Actions source, and point the apex and `www` DNS records at GitHub Pages.
