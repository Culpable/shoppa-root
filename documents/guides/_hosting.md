# Shoppa Cloudflare Workers hosting

Shoppa Root is migrating its public marketing site from GitHub Pages to Cloudflare Workers Static Assets, following `documents/todo/astro_workers_migration_plan.md`. This guide is the single evidence document for the migration: the pre-migration inventory, the token map, the release path, the parity and performance evidence, and the exact rollback payloads.

## Status

| Stage | State |
| --- | --- |
| Baseline snapshot (plan Step 1) | Complete - 8 September 2026 |
| Worker runtime in the repository | Complete - 8 September 2026 |
| Local Worker contract | Complete - 8 September 2026 |
| Workers provisioning | Complete - 8 September 2026 |
| Staging proof | Not started |
| Production cutover | Not started |
| Decommission | Not started |

`https://shoppa.au/` is still served by GitHub Pages. Workers `shoppa-root` and `shoppa-root-preview` exist with no custom domain yet.

## Final topology

Planned. Applied only after the recorded cutover approval.

| Concern | Owner |
| --- | --- |
| Public site | Worker `shoppa-root` on `shoppa.au`, Cloudflare Workers Static Assets serving `dist/` |
| Canonical origin | `https://shoppa.au` |
| `www` | Proxied placeholder `A 192.0.2.0` plus a zone `http_request_dynamic_redirect` rule, one `308` to the matching apex URL |
| Plain HTTP | Zone setting `always_use_https: on`, applied at the edge before the Worker |
| Response headers | `src/headers/_headers`, copied onto document responses by `src/worker.ts` |
| Branch previews | Worker `shoppa-root-preview` on `webpop.workers.dev`, noindexed, never promoted |
| Staging | `staging.shoppa.au` on `shoppa-root` until post-cutover removal |
| Release path | Cloudflare Workers Builds from `main`; GitHub Pages and `.github/workflows/deploy.yml` remain until Step 7 |
| Rollback | Restore the four snapshotted apex `A` records and the `www` `CNAME`, delete Worker custom domains, disable the redirect rule, set `always_use_https` back to `off` |

### Accepted deferrals

- **HSTS is not enabled.** The header policy deliberately omits `Strict-Transport-Security`; enabling it is a separate, explicit decision because it is hard to reverse in browsers that have already cached the directive.
- **`browser_cache_ttl` stays at `14400` unless staging HTML returns a `max-age` above `0`.** Then set it to `0` with the recorded rollback (plan D-14).
- **The `_github-pages-challenge-culpable` TXT record is left in place.** Removing it would surrender the verified-domain claim for no benefit.
- **`_email_routing.md` remains the Email Routing authority.** Nothing there changes.

## Account and zone inventory

Read from the Cloudflare API on 8 September 2026 at `2026-09-08T04:21:00Z` with the Global API Key loaded from Keychain service `cloudflare-global-api-key` (account `jake.sacino@gmail.com`). No write was made.

| Fact | Value |
| --- | --- |
| Account ID | `213ab3604485056376263d22fa242742` |
| Account name | Jake.sacino@gmail.com’s Account |
| Member | `jake.sacino@gmail.com`, Super Administrator, accepted |
| Zone | `shoppa.au` |
| Zone ID | `dae30eef9757b84c7217dbd9dd624ff9` |
| Zone status | `active`, unpaused, type `full` |
| Plan | Free Website |
| Nameservers | `vita.ns.cloudflare.com`, `will.ns.cloudflare.com` |
| `workers.dev` subdomain | `webpop` |

Existing Workers scripts in the account: `bulma-root`, `bulma-root-preview`, `fintrace-root`, `fintrace-root-preview`, `hfmlegal`, `musclehacking-astro-preview`, `taxgenie-root`, `taxgenie-root-preview`. No Worker named `shoppa-root` or `shoppa-root-preview` exists yet. Every listed script reports `has_assets: true` and `handlers: [fetch]`.

Existing Workers custom domains: `taxgenie.com.au` (`taxgenie-root`), `fintrace.com.au` (`fintrace-root`), `bulma.com.au` (`bulma-root`). No `shoppa.au` hostname is attached to any Worker.

Cloudflare Pages projects in the account: none.

Zone rulesets are the three managed entrypoints only - `Cloudflare Normalization Ruleset` (`70339d97bdb34195bbf054b1ebe81f76`), `Cloudflare Managed Free Ruleset` (`77454fe2d30c4220b5701f6fdfb893ba`) and `DDoS L7 ruleset` (`4d21379b4f9f4bb088e0729962c8b3cf`). There is no custom `http_request_dynamic_redirect` ruleset (`GET .../rulesets/phases/http_request_dynamic_redirect/entrypoint` returns `10003`).

Universal certificate pack `35955aaa-0f0b-4160-8adb-cdeb395dc3d9` is `active` for `shoppa.au` and `*.shoppa.au` (certificate expires `2026-11-16T01:13:35Z`).

Relevant zone settings before the migration:

| Setting | Value |
| --- | --- |
| `always_use_https` | `off` |
| `automatic_https_rewrites` | `on` |
| `browser_cache_ttl` | `14400` |
| `ssl` | `full` |
| `min_tls_version` | `1.0` |
| `security_level` | `medium` |

Bot-management object before the migration (complete read; D-6 will change only `ai_bots_protection` and `is_robots_txt_managed` at staging attach):

| Field | Value |
| --- | --- |
| `ai_bots_protection` | `block` |
| `is_robots_txt_managed` | `true` |
| `ai_bots_migration_opt_out` | `false` |
| `ai_search` | `disabled` |
| `ai_training` | `disabled` |
| `ai_user` | `disabled` |
| `bot_preference_sync_enabled` | `false` |
| `cf_robots_variant` | `off` |
| `content_bots_protection` | `disabled` |
| `crawler_protection` | `disabled` |
| `enable_js` | `false` |
| `fight_mode` | `false` |
| `using_latest_model` | `true` |

`GET /accounts/213ab3604485056376263d22fa242742/rum/site_info/list` returns seven Web Analytics sites. None of them is attached to zone `shoppa.au`. The listed zones are `electrical4u.com`, `fintrace.au`, `fintrace.com.au`, `legalgenie.com.au`, `sacino.au`, `slevia.com`, and `trackmytrail.com.au`.

Workers Builds token registry already holds `fintrace-root-cloudflare-build-api-token`, `bulma-root-cloudflare-build-api-token`, and `TaxGenie Root Workers Builds deploy`. No Shoppa token exists yet.

## DNS before-state

Nineteen records, all unproxied. The plan’s planning-time “twenty” count listed these same nineteen rows. Only the four apex `A` records and the `www` `CNAME` are migration targets; every other record must stay byte-identical. TTL `1` is Cloudflare’s automatic TTL.

| Type | Name | Content | Priority | TTL | Proxied | Record ID | Role |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| A | `shoppa.au` | `185.199.108.153` | | 1 | false | `c9faedf776a91f559f60810ba0f481f1` | **target** (GitHub Pages) |
| A | `shoppa.au` | `185.199.109.153` | | 1 | false | `361c9d0f3f1ad0d75cd6122972c59c7b` | **target** (GitHub Pages) |
| A | `shoppa.au` | `185.199.110.153` | | 1 | false | `ac55355c895f86f3b4c58765beef15d3` | **target** (GitHub Pages) |
| A | `shoppa.au` | `185.199.111.153` | | 1 | false | `d1250c61d842ba2819a4b1cf4eae95c5` | **target** (GitHub Pages) |
| CNAME | `www.shoppa.au` | `culpable.github.io` | | 1 | false | `6b24bcee2bc397e10fdf6947ca0ae89e` | **target** (becomes placeholder) |
| CNAME | `api.shoppa.au` | `0b6c388bd64c13a1.vercel-dns-016.com` | | 1 | false | `21e064b93c58362f52a5f2878c17abb4` | product API, untouched |
| CNAME | `app.shoppa.au` | `39123217a4b35b6a.vercel-dns-016.com` | | 1 | false | `733ed2ed3f0b5093f864984fa61fdabf` | product app, untouched |
| CNAME | `demo.shoppa.au` | `44ebdd479a4d5c78.vercel-dns-016.com` | | 1 | false | `cf2c0631bc3099afce749bf765896ed5` | demo store, untouched |
| MX | `shoppa.au` | `route1.mx.cloudflare.net` | 59 | 1 | false | `a7633beabd79bd19264458b58794d815` | Email Routing, untouched |
| MX | `shoppa.au` | `route2.mx.cloudflare.net` | 73 | 1 | false | `a33bf99342c416779d97da9651ed1110` | Email Routing, untouched |
| MX | `shoppa.au` | `route3.mx.cloudflare.net` | 95 | 1 | false | `2a6d20b2ef66cdb7cb2fe8b9d9089420` | Email Routing, untouched |
| TXT | `shoppa.au` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | | 1 | false | `e14ee27648298a92b475f662247679fd` | Email Routing SPF, untouched |
| TXT | `cf2024-1._domainkey.shoppa.au` | `v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiweykoi+o48IOGuP7GR3X0MOExCUDY/BCRHoWBnh3rChl7WhdyCxW3jgq1daEjPPqoi7sJvdg5hEQVsgVRQP4DcnQDVjGMbASQtrY4WmB1VebF+RPJB2ECPsEDTpeiI5ZyUAwJaVX7r6bznU67g7LvFq35yIo4sdlmtZGV+i0H4cpYH9+3JJ78km4KXwaf9xUJCWF6nxeD+qG6Fyruw1Qlbds2r85U9dkNDVAS3gioCvELryh1TxKGiVTkg4wqHTyHfWsp7KD3WQHYJn0RyfJJu6YEmL77zonn7p2SRMvTMP3ZEXibnC9gz3nnhR6wcYL8Q7zXypKTMD58bTixDSJwIDAQAB` | | 1 | false | `d0697748a6a11b29bc38d966d161a27d` | Email Routing DKIM, untouched |
| MX | `send.notifications.shoppa.au` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 | 3600 | false | `f15ef39b42f61eb1946e328ab80ce32c` | Resend/SES, untouched |
| TXT | `send.notifications.shoppa.au` | `v=spf1 include:amazonses.com ~all` | | 3600 | false | `1a103e1a3a822ef266c55c088827b348` | Resend/SES, untouched |
| TXT | `resend._domainkey.notifications.shoppa.au` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDk6jpIyOk5Y08S6whmLdgZBYkoFN9DBku/y3dvXXwPCGWxG/5o0OdSvjdV4cXifDg7FQ/X0tHagNv356dV25mfQrIYFYfnJZoiDXVGTP+tIp+Z30Jugoac6CcBADT8W19ehbFE5Pl2ZkHHnkh3PJB1j9u9QZ8icuKOhYLaP446rwIDAQAB` | | 3600 | false | `72527418955306c2e591fcb4da689ab3` | Resend DKIM, untouched |
| TXT | `_dmarc.notifications.shoppa.au` | `v=DMARC1; p=none;` | | 1 | false | `5e506573945ebb81fcf08f43ff467144` | DMARC, untouched |
| TXT | `shoppa.au` | `google-site-verification=3lopm8ke5X-USUbVZV1JCkWIDHv03yeY0k05m_w9f3w` | | 1 | false | `ed38e006d0f776cc57d1c2e1804d1e7d` | GSC verification, untouched |
| TXT | `_github-pages-challenge-culpable.shoppa.au` | `13c99b3166160650f8c3eaa6f06754` | | 1 | false | `538a4bd0ef854dae3f4cab4cd53752a5` | GH domain verification, left in place |

The four `A` records and the `www` `CNAME` above are the complete rollback payload for restoring GitHub Pages. The refreshed pre-cutover snapshot required by plan Step 5 is added to this guide immediately before the DNS write.

Public resolvers on 8 September 2026: `dig +short A shoppa.au` returned the four `185.199.*` addresses; `www.shoppa.au` was `culpable.github.io.`; `AAAA shoppa.au` was empty.

## GitHub state

| Fact | Value |
| --- | --- |
| Repository | `Culpable/shoppa-root` |
| Repository ID | `1337853951` |
| Owner | `Culpable` (`31677655`) |
| Default branch | `main` |
| Visibility | public |
| Local `HEAD` at snapshot | `9a577001a14088c514c598e9d439f29e5a870ee7` (plan file; not yet on `origin/main`) |
| `origin/main` at snapshot | `65786d0532627c4d7fa3ca551282167b38f7dcb4` |
| Pages `status` | `built` |
| Pages `build_type` | `workflow` |
| Pages `cname` | `shoppa.au` |
| Pages `html_url` | `https://shoppa.au/` |
| Pages `protected_domain_state` | `verified` |
| Pages HTTPS | enforced, certificate approved for `shoppa.au` and `www.shoppa.au`, expires 2026-11-16 |
| Actions secrets | none (`0`) |
| Actions variables | none (`0`) |
| Workflow | `Deploy to GitHub Pages` (`.github/workflows/deploy.yml`, active) |
| Latest deploy | run `34184772135`, `success`, head `65786d0`, created `2026-09-08T03:48:17Z` |

## Live HTTP before the migration

Captured `2026-09-08T04:22:53Z`. Decoded-body SHA-256 values for the six HTML routes, the unknown-path 404, the three discovery files, six Open Graph images, and three identity files all equal a fresh local `pnpm build` of `HEAD`. Manifest: `documents/guides/parity/production-baseline.json`.

| Request | Result |
| --- | --- |
| `GET https://shoppa.au/` | `200`, `server: GitHub.com`, `content-type: text/html; charset=utf-8`, `cache-control: max-age=600`, `vary: Accept-Encoding`, no CSP or other security header, body 71,567 bytes |
| `GET http://shoppa.au/about/` | `301` to `https://shoppa.au/about/`, `Server: GitHub.com` |
| `GET https://www.shoppa.au/about/?x=1` | `301` to `https://shoppa.au/about/?x=1` |
| `GET https://shoppa.au/about` | `301` to `https://shoppa.au/about/` |
| `GET https://shoppa.au/llms.txt` | `200`, `text/plain; charset=utf-8` |
| `GET https://shoppa.au/robots.txt` | `200`, `text/plain; charset=utf-8` |
| `GET https://shoppa.au/sitemap.xml` | `200`, `application/xml` |
| `GET https://shoppa.au/__missing-parity-probe/` | `404`, Shoppa `404.html` bytes |
| IPv4 `GET https://shoppa.au/` | `200`, remote `185.199.108.153`, body hash equal to the dual-stack request |
| IPv6 | No public `AAAA` record. `curl -6` connected through the IPv4-mapped address `::ffff:185.199.108.153` and returned the same decoded body |

## Token map

Secrets live only in the macOS Keychain under account `jake.sacino@gmail.com`. Values are never printed, logged or committed.

| Purpose | Keychain service | Created |
| Cloudflare Global API Key (pre-existing, all accounts) | `cloudflare-global-api-key` | before this migration |
| Workers Builds deploy token value | `shoppa-root-cloudflare-build-api-token` | plan Step 4 |
| Workers Builds deploy token ID | `shoppa-root-cloudflare-build-api-token-id` | plan Step 4 |
| Workers Builds token registry UUID | `shoppa-root-cloudflare-build-api-token-uuid` | plan Step 4 |

## Root validation baseline

Run at local `HEAD` `9a57700` on 8 September 2026:

- `pnpm build` - Astro check 0 errors / 0 warnings / 0 hints; 7 pages built.
- `pnpm test` - `validate-build.mjs` passed (20 artefacts, 7 HTML routes, 48 colour tokens); Playwright 60 passed.

## Parity baseline

`documents/guides/parity/production-baseline.json` records status, content type, selected headers, decoded-body SHA-256, and the matching local `dist/` hash for:

- six HTML routes: `/`, `/about/`, `/process/`, `/contact/`, `/privacy/`, `/thank-you/`
- the 404 document via `/__missing-parity-probe/`
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`
- six files under `/images/`
- `/favicon.ico`, `/icon.svg`, `/apple-icon.png`

Every HTML hash equalled the local `dist/` hash at the Step 1 snapshot. After the Step 2 Pages deploy of `151c26d`, `/about/` still matches that snapshot; `/` changed because the landing module is now `/_astro/LandingEffects.astro_astro_type_script_index_0_lang.BRopPWLb.js` (`200`, `application/javascript`). `https://shoppa.au/_headers` returns `404`.

## Local Worker contract

Run against `wrangler dev` (`http://127.0.0.1:8787`) on 8 September 2026 with `pnpm build:worker` output from commit `151c26d`:

- `wrangler deploy --dry-run --env=""` and `--env preview` both exit 0 with `main: src/worker.ts`, one `ASSETS` binding, and no other binding.
- 20 of 20 `test/http-contract.json` cases pass: six documents as HTML and Markdown, both cache orders, slashless `307` to `/about/`, unknown-path `404` in both representations, `406` for `image/png`, Markdown `HEAD`, blocked `/_agent-markdown/`, `robots.txt`, `sitemap.xml`, `llms.txt` with charset and `’` intact, fingerprinted `/_astro/*.js` immutable, favicon icon type.
- `scripts/verify-negotiated-content.mjs` passes: built Markdown equals the Worker body on all six routes; HTML `304` and Markdown `200` at the same URL; slashless `307`; `HEAD` empty.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8787 playwright test` - 60 passed at `1440x900` and `390x844`, including the landing-effects regression (external module executes).
- `scripts/verify-browser-runtime.mjs` - 14 of 14 route/viewport pairs: zero console errors, zero page errors, zero CSP violations, zero failed first-party requests, zero horizontal overflow.
- GitHub Pages deploy `34187563410` for `151c26d` succeeded. Production remains `server: GitHub.com`.

## Release path

Workers Builds is the sole intended release controller. Created on 8 September 2026. GitHub Pages still deploys `pnpm build` in parallel until Step 7.

| Field | Value |
| --- | --- |
| API token name | `shoppa-root-cloudflare-build-api-token` |
| API token ID | `c44eb43e27eab75a464b6ecff08768bf` |
| API token status | Active; verified through `/user/tokens/verify` |
| Account permissions | `Workers CI Write` (`2e095cf436e2455fa62c9a9c2e18c478`), `Workers Scripts Write` (`e086da7e2179491d91ee5f35b3ca210a`), `Account Settings Read` (`c1fde68c7bcc44588cbb6ddbc16d6480`) |
| Zone permission | `Workers Routes Write` (`28f4b596e7d643029c524985477ae49a`), scoped only to `shoppa.au` |
| Builds token registry UUID | `25242576-556c-4c18-8a1a-fda12c660c48` |
| Repository connection | `Culpable/shoppa-root`, GitHub account ID `31677655`, repository ID `1337853951` |
| Repository connection UUID | `f30a1af6-9b79-4e5b-9d97-cb7160ef6828`, created `2026-09-08T04:44:24.809Z` |
| Production Worker | `shoppa-root`, script tag `6183324c7ea64aa4b7a6720782168958`, first Wrangler version `9e80bf1c-deb9-4ab0-a954-549f200ecc56` |
| Preview Worker | `shoppa-root-preview`, script tag `bcb40a15063945e89a3303b2853e646a`, bootstrap version `847b59e9-4310-4910-9869-e23b191eb312` |
| Preview migration version | `e0affa6c-c848-4ea5-820a-5f7b305cf8bd` |
| Version preview URL | `https://e0affa6c-shoppa-root-preview.webpop.workers.dev` |
| Version preview alias | `https://migration-shoppa-root-preview.webpop.workers.dev/` |
| Production trigger | `9e22741b-0ac5-4a05-9c21-0beee04fef34`; script tag `6183324c7ea64aa4b7a6720782168958`; `main`; `pnpm build:worker`; `pnpm deploy` |
| Preview trigger | `948138fc-8271-47f1-8f7d-9f06ee374160`; script tag `bcb40a15063945e89a3303b2853e646a`; every branch except `main`; `pnpm build:worker`; `pnpm deploy:preview` |
| Trigger root and paths | Root `/`; include `*` |
| Build variables | `NODE_VERSION=22.23.1`; `PNPM_VERSION=11.22.0` |

Each trigger is attached to its own script tag, so a preview build can never upload a version to the production Worker.

Permission groups were revalidated by name against `GET /accounts/{account_id}/tokens/permission_groups` immediately before the token write. `POST /accounts/{account_id}/builds/tokens` required `build_token_name`, `build_token_secret`, and `cloudflare_token_id`.

### Preview Worker verification

Against `https://migration-shoppa-root-preview.webpop.workers.dev/` on 8 September 2026:

- All 20 HTTP contract cases pass.
- `X-Robots-Tag: noindex` is present alongside the CSP, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Vary: Accept` and `cache-control: public, max-age=0, must-revalidate`.
- Playwright 60 passed at `1440x900` and `390x844`.
- `GET /accounts/{account_id}/workers/scripts/shoppa-root/subdomain` returns `enabled: false, previews_enabled: false`; the preview Worker returns both `true`.
- `GET /accounts/{account_id}/workers/domains` still lists only `taxgenie.com.au`, `fintrace.com.au`, and `bulma.com.au`. DNS remains 19 records, IDs unchanged.

### First Git-connected builds

| Build | Trigger | Commit | Outcome |
| --- | --- | --- | --- |
| `b6edfa9c-5d40-4117-a68e-d3ef84a64a7d` | production | `main` (manual) | success; production now serves version `6ee3f9a9-8d0e-4d96-8e89-3638d6de1c67` at 100% |
| `35fce291-4309-4053-be02-6532e672cd6f` | preview | `8d6fc80` on `claude/astro-workers-preview-check` | success; uploaded version `09274b03-5bb0-4470-88d8-83bfd557b59a` with alias `claude-astro-workers-preview-check` |

The preview build uploaded a version and promoted nothing: `shoppa-root-preview` stayed on bootstrap deployment `fb98d340-a511-4469-9151-e6143d23daf3` serving version `847b59e9-4310-4910-9869-e23b191eb312`. The throwaway branch was deleted locally and remotely.
