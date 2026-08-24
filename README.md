# shoppa-root

Marketing landing page for **Shoppa** - an out-of-the-box AI shopping agent platform retailers deploy with a two-line `<script>` embed.

This repository is intentionally separate from the product monorepo:

| Repository | Owns | Hosting |
| --- | --- | --- |
| [`Culpable/shoppa`](https://github.com/Culpable/shoppa) | Platform API (`api.shoppa.au`), Harlow demo store (`demo.shoppa.au`), widget, Convex backend | Vercel |
| `Culpable/shoppa-root` (this repo) | Public landing page | GitHub Pages |

## Target domain

`https://shoppa.au` (apex, plus `www.shoppa.au`), served as a static site from GitHub Pages.

Until a custom domain is configured, the site publishes at `https://culpable.github.io/shoppa-root/`.

## Deployment

The workflow in `.github/workflows/deploy.yml` builds the static export and publishes `dist/` with `actions/deploy-pages` after a push to `main`. The Pages source is **GitHub Actions**, not branch deploy, and the custom domain is set in the Pages configuration.

`public/CNAME` is the source of truth for the custom domain. It must stay in Astro’s static-assets directory so it is copied into `dist/` on every build. Do not delete or move it.

## Status

The Astro landing site is implemented as a fully static export. It includes the home, about, process, contact, privacy, thank-you, and 404 pages, plus sitemap, robots, LLM discovery, Markdown sibling routes, HTML alternate links, and homepage JSON-LD identity data.

GitHub Pages cannot vary a canonical URL by the request `Accept` header. Agents can use the explicit Markdown URLs advertised by each HTML page and `llms.txt`; full same-URL Markdown negotiation would require an authorised request-time edge in front of GitHub Pages.

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Astro serves the development site at `http://localhost:4321`.

## Validation

```bash
pnpm build
pnpm test
```

`pnpm build` runs Astro’s type and content checks before creating `dist/`. `pnpm test` validates the static output and runs the desktop and mobile browser suite.
