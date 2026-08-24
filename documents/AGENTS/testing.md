# Testing and verification

## Test environments and isolation

- Development runs locally with `pnpm dev`. Browser tests serve the built `dist/` directory through `scripts/serve-build.mjs`; the default is `127.0.0.1:4321`, and `PLAYWRIGHT_PORT` selects an isolated port when 4321 is occupied. The test server maps a missing path to `dist/404.html` with status 404 so one response proves the deployed GitHub Pages contract.
- The site has no database, authentication, credentials, or production service calls. Do not use production deployment as a test environment.

## Test selection

| Change | Required checks | Command |
| --- | --- | --- |
| Copy, metadata, routes, or discovery files | Astro checks, static build, output manifest assertions | `pnpm build && pnpm test:build-output` |
| Layout, component, stylesheet, asset, or interaction | Full build-output and browser suite | `pnpm build && pnpm test` |
| Test or browser configuration | Full build-output and browser suite | `pnpm build && pnpm test` |
| Deployment workflow | Full build and workflow syntax review | `pnpm build` |

## Validation commands

- Default completion gate: `pnpm build && pnpm test`.
- `pnpm test:agent-a11y` runs the browser suite directly when `dist/` is already current.
- `pnpm test:build-output` checks required HTML and Markdown routes, `CNAME`, sitemap, robots, `llms.txt`, alternate links, and JSON-LD identity data.

## Fixtures and identities

- All pages are public and static. No test identity or fixture data is required.
- `test/agent-accessibility.rules.ts` contains exactly 33 project rules and is test input, not generated output.

## Database and external-service policy

- No database exists in this repository.
- Do not make external network calls in the browser suite. Fonts and all page assets must load from the built site.

## Development-server ownership

- Health check: `http://127.0.0.1:4321/` must return HTTP 200.
- Start or reuse: let Playwright start its configured server for automated tests. For manual review, use `pnpm preview` and verify the port is free first.
- Cleanup: stop every server started for manual verification. Playwright owns and stops its automated server.

## Browser verification

- Primary browser tool: Ego Browser for page state, structure, and interaction. Use Playwright for deterministic screenshots or when Ego Browser capture fails without an application error.
- Routes and states: `/`, `/about/`, `/process/`, `/contact/`, `/privacy/`, `/thank-you/`, and `/404.html`, all unauthenticated and fully rendered. Also verify the matching `.md` routes, `llms.txt`, `sitemap.xml`, and `robots.txt` as raw responses.
- Trust anchors: `/about/`, `/contact/`, and `/privacy/` must each expose at least 500 characters of substantive rendered `<main>` text.
- Viewports: 1440×900 desktop and 390×844 mobile for every route. Check the hero at 1440, 960, 640, 390, and 320 pixels after headline or typography changes.
- Evidence: inspect titles, headings, navigation collapse, keyboard focus, contrast, horizontal overflow, fonts, console errors, external requests, and full-page screenshots. Store implementation evidence in `documents/verification/screenshots/`.

## Generated and compiled artifacts

- Run `pnpm build` before output or browser checks. Treat `dist/` as disposable generated output and never as the source under review.

## Completion evidence

- Report commands, exit results, browser scenarios, skipped checks, reasons, and residual risk.
- For visual changes, compare full-page desktop and mobile screenshots against `DESIGN.md` before claiming completion.
