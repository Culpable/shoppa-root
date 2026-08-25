# ~~Remove Public Markdown Routes Plan~~ ✅ **COMPLETED**

<critical_warning>
> **CRITICAL WARNING:** Remove only the seven generated public page Markdown routes and their active code, tests, and documentation. Keep repository documentation such as `README.md`, `DESIGN.md`, `AGENTS.md`, and files under `documents/`.
</critical_warning>

<important_note>
> **IMPORTANT NOTE:** Shoppa Root must remain a fully static Astro site on GitHub Pages. Do not add middleware, edge compute, a proxy, redirects, fake `Vary: Accept` headers, or a hosting migration.
</important_note>

## 1. Goal

Remove `/index.md`, `/about/index.md`, `/process/index.md`, `/contact/index.md`, `/privacy/index.md`, `/thank-you/index.md`, and `/404.md` from Shoppa Root.

These files duplicate page content and add build, metadata, link-parity, and test maintenance. They do not resolve the outstanding agent-readiness issues because GitHub Pages cannot return Markdown from the canonical URL for `Accept: text/markdown`, cannot emit cache-safe `Vary: Accept`, and cannot return a Markdown recovery body at the original missing URL. The user has accepted those static-host limitations and decided the separate `.md` files provide too little benefit for their cost.

The site must keep semantic HTML, `/llms.txt`, `/sitemap.xml`, `/robots.txt`, JSON-LD, trust pages, and the real HTML 404.

---

## 2. Current State Analysis

- `src/data/agentContent.ts` duplicates seven pages as Markdown strings.
- `src/pages/[...document].md.ts` prerenders the seven public `.md` routes.
- All seven HTML pages set `markdownPath`; `src/lib/metadata.ts` validates it; `src/components/head/PageMetadata.astro` emits a Markdown alternate link.
- `src/data/site.ts` points `/llms.txt` entries at `.md` URLs.
- `scripts/validate-build.mjs`, `scripts/serve-build.mjs`, and `test/agent-readiness.spec.ts` enforce Markdown files, media types, and alternate links.
- `README.md`, `DESIGN.md`, and `documents/AGENTS/testing.md` describe the Markdown routes as active architecture.

The current build produces seven `.md` files, but a canonical page request with `Accept: text/markdown` still receives HTML. A request to a nonexistent canonical path still cannot receive Markdown recovery on GitHub Pages.

---

## 3. Desired State

- **MUST:** `dist/` contains no `.md` files after `pnpm build`.
- **MUST:** Built HTML contains no `rel="alternate" type="text/markdown"` links.
- **MUST:** `/llms.txt` links to canonical HTML URLs: `/`, `/about/`, `/process/`, `/contact/`, and `/privacy/`.
- **MUST:** Former `.md` paths return the existing Shoppa HTML 404 with HTTP 404 in local integration tests.
- **MUST:** Existing HTML routes, metadata, JSON-LD, sitemap, robots, trust content, `CNAME`, assets, and deployment configuration remain unchanged apart from removing Markdown discovery.
- **MUST NOT:** Add replacement Markdown routes, content negotiation, runtime selectors, redirects, proxies, or hosting changes.
- **MUST:** Update active architecture and testing documentation. Preserve completed plans, audit XML, screenshots, and historical verification records.

Default behaviour remains canonical prerendered HTML. `/llms.txt`, sitemap, and robots provide fixed machine-readable discovery. Missing paths use the existing Shoppa HTML 404.

---

## 4. Additional Context

The decision is based on the outstanding scan at `https://is-agentic.com/scan/shoppa.au`: separate `.md` siblings did not satisfy same-URL Markdown negotiation or full Markdown 404 recovery. Retaining them would preserve the maintenance cost without resolving those findings.

The phrase “remove these `.md` files” means the seven generated public routes listed in the Goal. It does not include repository-authored Markdown documentation or `/llms.txt`.

---

## 5. Implementation Plan

### ~~Step 1: Update regression expectations~~ ✅ **COMPLETED**

**Objective:** Make tests express the file-only contract before removing the implementation.

- Update `scripts/validate-build.mjs` to require zero `.md` files and zero Markdown alternate links.
- Update `/llms.txt` assertions to require canonical HTML URLs.
- Update `test/agent-readiness.spec.ts` to require HTTP 404 with HTML recovery for all seven former `.md` paths and zero Markdown alternate links on all HTML pages.
- Retain all existing HTML 404, trust-page, JSON-LD, sitemap, robots, metadata, and image assertions.

**Success Criteria:**

- `pnpm test:build-output` fails against the current implementation because `.md` output or alternate links still exist.
- Tests cover all seven former `.md` paths and require HTTP 404 plus an HTML content type.
- No non-Markdown readiness assertion is removed.

### ~~Step 2: Remove Markdown generation and discovery~~ ✅ **COMPLETED**

**Objective:** Delete the public Markdown owners and all dead metadata support.

- Move `src/data/agentContent.ts` and `src/pages/[...document].md.ts` to Trash.
- Remove `markdownPath` from all seven page metadata objects and from `src/lib/metadata.ts`.
- Remove Markdown URL resolution and alternate-link output from `src/components/head/PageMetadata.astro`.
- Remove the `.md` MIME entry from `scripts/serve-build.mjs`.

**Success Criteria:**

- Both Markdown source-owner files no longer exist in the repository.
- `rg -n "markdownPath|agentMarkdownDocuments|text/markdown|rel=\"alternate\" type=\"text/markdown\"" src scripts/serve-build.mjs` returns no match.
- `pnpm build` exits 0 and `find dist -type f -name '*.md' -print` returns no path.

### ~~Step 3: Retarget `llms.txt`~~ ✅ **COMPLETED**

**Objective:** Keep concise agent guidance while using canonical HTML as the only page representation.

- Change the `llmsDocument` links in `src/data/site.ts` from `.md` paths to `/`, `/about/`, `/process/`, `/contact/`, and `/privacy/`.
- Keep the current summary, when-to-use guidance, descriptions, and action guidance.

**Success Criteria:**

- `dist/llms.txt` contains the five canonical `https://shoppa.au` HTML destinations.
- `dist/llms.txt` contains no URL path ending in `.md`.
- Every internal Shoppa link in `dist/llms.txt` returns HTTP 200 from the local test server.

### ~~Step 4: Synchronise documentation and verify~~ ✅ **COMPLETED**

**Objective:** Document the implemented static boundary and prove no unrelated behaviour changed.

- Update current-state wording in `README.md`, `DESIGN.md`, and `documents/AGENTS/testing.md`.
- State that the file-only deployment publishes canonical HTML plus fixed `/llms.txt`, sitemap, and robots files, with no page `.md` routes or Markdown alternates.
- Record same-URL Markdown negotiation and Markdown recovery at the original missing URL as known GitHub Pages limitations.
- Leave historical plans, audits, screenshots, and verification records unchanged.
- Run `pnpm build && pnpm test`, then review the complete scoped diff.

**Success Criteria:**

- `pnpm build && pnpm test` exits 0.
- `rg -n 'rel="alternate" type="text/markdown"|https://shoppa.au/[^ )]+\.md' dist` returns no match.
- Requests to the seven former `.md` paths return HTTP 404; canonical HTML routes, `/llms.txt`, `/sitemap.xml`, and `/robots.txt` return HTTP 200 locally.
- `git diff --check` exits 0.
- No changes appear in `astro.config.mjs`, `.github/workflows/deploy.yml`, `public/CNAME`, dependencies, CSS, visual components, or display copy.

---

## 6. Testing Plan

### 6.1 Source-of-Truth Artefacts

- `src/pages/[...document].md.ts` and `src/data/agentContent.ts` prove the exact route and duplicated-content owners to remove.
- `scripts/validate-build.mjs` proves the current build contract requires seven `.md` files and alternate links.
- `test/agent-readiness.spec.ts` proves the current browser contract expects successful Markdown responses.
- The current generated files under `dist/` prove the exact build outputs being removed. They are disposable and must be regenerated, never hand-edited.
- `https://is-agentic.com/scan/shoppa.au` explains why the separate files do not justify their maintenance cost. Do not use a new external scan as a completion gate because deployment and rescanning are outside scope.

No synthetic fixture is needed because the real local build is deterministic and safe.

### 6.2 Required Verification

| Test | Location | Expected result | Command |
| --- | --- | --- | --- |
| Build-output contract | `scripts/validate-build.mjs` | Zero `.md` files, zero Markdown alternates, canonical HTML links in `/llms.txt` | `pnpm build && pnpm test:build-output` |
| Former Markdown routes | `test/agent-readiness.spec.ts` | Seven HTTP 404 HTML responses with Shoppa recovery content | `pnpm test` |
| Preserved site behaviour | Existing build and Playwright suites | HTML routes, metadata, JSON-LD, trust pages, sitemap, robots, assets, and HTML 404 continue to pass | `pnpm build && pnpm test` |

Final commands:

```bash
pnpm build && pnpm test
find /Users/sacino/shoppa-root/dist -type f -name '*.md' -print
rg -n 'rel="alternate" type="text/markdown"|https://shoppa.au/[^ )]+\.md' /Users/sacino/shoppa-root/dist
git -C /Users/sacino/shoppa-root diff --check
```

The first and fourth commands must exit 0. The second and third commands must print no matches. Do not deploy or rescan production as part of implementation verification.

## Implemented Solution

- **Public Markdown routes removed.** Trashed `src/data/agentContent.ts` and `src/pages/[...document].md.ts`. `pnpm build` now emits seven HTML pages, `/llms.txt`, `/sitemap.xml`, and `/robots.txt`, with no `.md` files in `dist/`.
- **Markdown discovery removed.** Dropped `markdownPath` from all seven page metadata objects and from `src/lib/metadata.ts`. `src/components/head/PageMetadata.astro` no longer emits `rel="alternate" type="text/markdown"`. `scripts/serve-build.mjs` no longer maps `.md` to `text/markdown`.
- **`/llms.txt` retargeted.** `src/data/site.ts` now links to `/`, `/about/`, `/process/`, `/contact/`, and `/privacy/`. Summary, when-to-use copy, descriptions, and action guidance are unchanged. Built `dist/llms.txt` contains those five `https://shoppa.au` HTML destinations and no `.md` paths.
- **Regression contract inverted.** `scripts/validate-build.mjs` requires zero `.md` files, zero Markdown alternate links, and canonical HTML links in `/llms.txt`. `test/agent-readiness.spec.ts` requires HTTP 404 with Shoppa HTML recovery for `/index.md`, `/about/index.md`, `/process/index.md`, `/contact/index.md`, `/privacy/index.md`, `/thank-you/index.md`, and `/404.md`, and zero Markdown alternate links on all HTML pages. Existing HTML 404, trust-page, JSON-LD, sitemap, robots, metadata, and image assertions remain.
- **Active docs updated.** `README.md`, `DESIGN.md`, and `documents/AGENTS/testing.md` now describe canonical HTML plus fixed `/llms.txt`, sitemap, and robots, and record same-URL Markdown negotiation and Markdown recovery at the original missing URL as GitHub Pages limits. Historical plans, audits, screenshots, and verification records were not changed.
- **Unchanged surfaces.** No edits to `astro.config.mjs`, `.github/workflows/deploy.yml`, `public/CNAME`, dependencies, CSS, visual components, or display copy.
- **Validation.** `pnpm build` exited 0. `pnpm test` exited 0 (56 Playwright tests passed; `scripts/validate-build.mjs` validated 20 artefacts). `find dist -type f -name '*.md'` printed no paths. `rg` for Markdown alternates and `https://shoppa.au/...md` in `dist/` returned no matches. `git diff --check` exited 0. An orphaned `astro preview` on `127.0.0.1:4321` was stopped so the default Playwright port could bind; a separate `webpop` `astro dev` on `[::1]:4321` was left running.
- **Pending / skipped.** No new is-agentic.com scan. Production deploy is out of implementation verification; a push to `origin/main` is a separate requested release action.
