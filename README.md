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

## Status

Repository scaffold only. No framework or landing-page code is committed yet - the stack is still to be decided.

## Precedent

The intended shape follows [`Culpable/fintrace-root`](https://github.com/Culpable/fintrace-root): a static export built in CI and published to GitHub Pages via `actions/deploy-pages`, with the custom domain set on the Pages configuration.
