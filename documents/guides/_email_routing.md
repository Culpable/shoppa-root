# Shoppa Email Routing

## Operational contract

- Inbound provider after cutover: Cloudflare Email Routing.
- Catch-all route: every `@shoppa.au` address forwards to `solutions@embeddings.au`.
- Literal route: `hello@shoppa.au` to `solutions@embeddings.au` remains enabled.
- Shoppa has no outbound transactional provider.
- Do not add Resend or change application email configuration.

## Pre-change snapshot

Captured from the Cloudflare API at `2026-08-29T07:27:53Z`, before any write.

- Zone ID: `dae30eef9757b84c7217dbd9dd624ff9`.
- Account ID: `213ab3604485056376263d22fa242742`.
- Zone state: active, unpaused, full.
- Email Routing: `enabled: false`, `status: unconfigured`, `synced: true`.
- Rules: only catch-all rule `c8736c064dd24a00aaeb8e5455b310a7`, action `drop`, `enabled: false`.
- No apex MX or SPF existed.
- Required destination `solutions@embeddings.au` was absent at snapshot time.

### Complete DNS export

| ID | Type | Name | Content | Priority | TTL | Proxied |
| --- | --- | --- | --- | ---: | ---: | --- |
| `538a4bd0ef854dae3f4cab4cd53752a5` | TXT | `_github-pages-challenge-culpable.shoppa.au` | `13c99b3166160650f8c3eaa6f06754` | | 1 | false |
| `21e064b93c58362f52a5f2878c17abb4` | CNAME | `api.shoppa.au` | `0b6c388bd64c13a1.vercel-dns-016.com` | | 1 | false |
| `cf2c0631bc3099afce749bf765896ed5` | CNAME | `demo.shoppa.au` | `44ebdd479a4d5c78.vercel-dns-016.com` | | 1 | false |
| `c9faedf776a91f559f60810ba0f481f1` | A | `shoppa.au` | `185.199.108.153` | | 1 | false |
| `361c9d0f3f1ad0d75cd6122972c59c7b` | A | `shoppa.au` | `185.199.109.153` | | 1 | false |
| `ac55355c895f86f3b4c58765beef15d3` | A | `shoppa.au` | `185.199.110.153` | | 1 | false |
| `d1250c61d842ba2819a4b1cf4eae95c5` | A | `shoppa.au` | `185.199.111.153` | | 1 | false |
| `ed38e006d0f776cc57d1c2e1804d1e7d` | TXT | `shoppa.au` | `google-site-verification=3lopm8ke5X-USUbVZV1JCkWIDHv03yeY0k05m_w9f3w` | | 1 | false |
| `6b24bcee2bc397e10fdf6947ca0ae89e` | CNAME | `www.shoppa.au` | `culpable.github.io` | | 1 | false |

### Cloudflare-generated routing records

Cloudflare returned three apex MX records for `route1.mx.cloudflare.net.`, `route2.mx.cloudflare.net.` and `route3.mx.cloudflare.net.`, plus apex SPF `v=spf1 include:_spf.mx.cloudflare.net ~all` and TXT DKIM at `cf2024-1._domainkey.shoppa.au`. The live post-write IDs and exact priorities are recorded below after cutover.

## Exact rollback

1. Disable Email Routing with `DELETE /zones/dae30eef9757b84c7217dbd9dd624ff9/email/routing/dns`.
2. Read back apex MX/TXT and `cf2024-1._domainkey.shoppa.au`; remove any remaining Cloudflare routing records only.
3. Confirm the former no-apex-MX and no-apex-SPF state on authoritative and public resolvers.
4. Confirm the apex, `www`, `api`, `demo`, GitHub Pages challenge and Google verification records still match the snapshot.
5. Do not change website or application records and do not add an outbound provider.

## Verification commands

```bash
dig +short MX shoppa.au
dig +short TXT shoppa.au
dig +short TXT cf2024-1._domainkey.shoppa.au
dig +short A shoppa.au
dig +short CNAME www.shoppa.au
dig +short CNAME api.shoppa.au
dig +short CNAME demo.shoppa.au
```

## Observed post-change state

- Cloudflare Email Routing is `enabled: true` and `status: ready`.
- Routing MX IDs and priorities: `a7633beabd79bd19264458b58794d815` route1 priority 59, `a33bf99342c416779d97da9651ed1110` route2 priority 73, and `2a6d20b2ef66cdb7cb2fe8b9d9089420` route3 priority 95.
- Routing SPF ID: `e14ee27648298a92b475f662247679fd`.
- Routing DKIM ID: `d0697748a6a11b29bc38d966d161a27d`.
- Literal rule: `71fe2e95cbf74934a99c318cf8012181`, `hello@shoppa.au` to `solutions@embeddings.au`, enabled.
- Catch-all rule `c8736c064dd24a00aaeb8e5455b310a7` is enabled and forwards all otherwise unmatched addresses to `solutions@embeddings.au`.
- No `sign-in@shoppa.au` rule or outbound provider was created.
- Authoritative Cloudflare DNS, 1.1.1.1 and 8.8.8.8 returned the same three routing MX records, routing SPF and routing DKIM.
- `shoppa.au`, `api.shoppa.au` and `demo.shoppa.au` each returned HTTP 200 after cutover. Their DNS records and both verification TXT records are unchanged.
- Primary Resend test `8a82c874-7924-4b6a-90f8-ec8bbb2be816` reported `delivered`; subject `SHOPPA-INBOUND-HELLO-d4a0612b-8e30-46da-b2eb-41bac4ddfbb9`.
- The historical negative test predates catch-all activation and is no longer the expected behaviour.
- Resend catch-all tests `c55e6c27-94da-4e69-846c-a7ec302d745d` and `ad9d38f4-2526-48f1-b25d-3e5ab0f00c81` reported `delivered` for `hello@shoppa.au` and `jake@shoppa.au`; subjects `CATCHALL-SHOPPA-HELLO-95d7bab1-730f-4205-8bf1-37cfee3ab61e` and `CATCHALL-SHOPPA-JAKE-95d7bab1-730f-4205-8bf1-37cfee3ab61e`.
- The user confirmed both catch-all test subjects arrived in `solutions@embeddings.au`.
