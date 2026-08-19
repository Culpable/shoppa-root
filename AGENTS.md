# Shoppa Landing Page Repository Instructions

- These instructions apply to the `shoppa-root` repository root. Paths are relative to this repository; `/Users/sacino/...` paths are sibling checkouts on this machine.
- Read a linked reference only when its listed trigger matches the current task.

<container_guidelines>

<build_directives>
- Build and keep the site as an Astro fully static export. Do not add another framework or client-side application runtime.
- Configure the apex domain with `site: 'https://shoppa.au'` and no `base` subpath. Do not add a `/shoppa-root/` base for the temporary GitHub Pages URL.
- Keep `public/CNAME` exactly where it is. It is the custom-domain source of truth and must copy into `dist/CNAME`.
- Deploy through `.github/workflows/deploy.yml` with the GitHub Actions Pages source. Never add branch deployment.
</build_directives>

<copy_rules>
- Landing-page copy is ported from `/Users/sacino/embeddings/src/app/page.jsx` and its `about/`, `process/`, `contact/`, `thank-you/`, and `not-found.jsx` routes. Read the relevant source and `documents/todo/shoppa_landing_site_plan.md` before editing display copy.
- Use British English and `’`, never `'`, in display strings.
- Never use em dashes in display strings, documentation, or other repository-authored prose. Replace each em dash with a standard dash (`-`).
- Never disclose the unauthenticated API, mock mode, MVP staging, repository structure, or Convex in public copy.
- Verify product claims against `/Users/sacino/shoppa/AGENTS.md` and `/Users/sacino/shoppa/README.md` before publishing them.
</copy_rules>

<code_standards>
- Read [code-standards.md](documents/AGENTS/code-standards.md) in full before changing application, test, script, or build-configuration code. It governs module boundaries, naming, copy-safe implementation, generated files, exceptions, and enforcement. Do not implement code changes until its applicable rules are identified.
- Keep route metadata inputs with each page, site identity in `src/config/site.ts`, metadata resolution in `src/lib/metadata.ts`, shared head output in `src/components/head/PageMetadata.astro`, and render that component exactly once from `src/layouts/BaseLayout.astro`.
- Mechanical enforcement: `pnpm build && pnpm test`.
- Keep this repository marketing-only and static. Do not add product, widget, API, backend, database, blog, or CMS code.
</code_standards>

</container_guidelines>

<container_information>

<description>
Public marketing site for Shoppa, an out-of-the-box AI shopping agent for Australian retailers. It owns only the landing pages at `https://shoppa.au`; the product monorepo at `/Users/sacino/shoppa` owns the platform API, demo store, widget, and backend.
</description>

<design_documentation>

| Work | Source | Read when |
| --- | --- | --- |
| Visual implementation contract | [DESIGN.md](DESIGN.md) | Read before changing any page, layout, component, stylesheet, browser identity asset, responsive rule, or animation. Apply its design rules before implementation and update it when a durable visual decision changes. |

</design_documentation>

<environments>
- Development: `pnpm dev` serves the local static site at `http://localhost:4321`; no database, authentication, or external service is required.
- Test: `pnpm build && pnpm test` builds `dist/`, validates required artefacts, and serves it through a Playwright-owned local server. Tests must not target the deployed site.
- Production: GitHub Pages serves the static `dist/` artifact at `https://shoppa.au`; pushes to `main` deploy only through `.github/workflows/deploy.yml`.
</environments>

<technology_stack>
The site is an Astro static export with plain CSS and Playwright verification.

For exact authority, read:

- Installed packages and versions: `package.json` and `pnpm-lock.yaml`. Never copy dependency versions into documentation.
- Build behaviour: `astro.config.mjs` and `.github/workflows/deploy.yml`.
- Browser verification: `playwright.config.ts`, `test/`, and `scripts/validate-build.mjs`.
- Visual and theming system: `DESIGN.md` and `src/styles/global.css`.
</technology_stack>

<testing_rules>
- Default completion gate: `pnpm build && pnpm test`.
- Read [testing.md](documents/AGENTS/testing.md) before selecting or running focused, browser, build-output, deployment, or visual checks. It governs test selection, server ownership, routes, viewports, evidence, and cleanup. Do not report implementation complete until the applicable checks pass.
- Never use production deployment as a verification step.
</testing_rules>

</container_information>
