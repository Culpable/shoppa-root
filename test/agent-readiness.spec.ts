import { expect, test } from '@playwright/test';

const canonicalPages = [
  { html: '/', markdown: '/index.md' },
  { html: '/about/', markdown: '/about/index.md' },
  { html: '/process/', markdown: '/process/index.md' },
  { html: '/contact/', markdown: '/contact/index.md' },
  { html: '/privacy/', markdown: '/privacy/index.md' },
  { html: '/thank-you/', markdown: '/thank-you/index.md' },
  { html: '/404.html', markdown: '/404.md' },
] as const;

const trustAnchorPages = ['/about/', '/contact/', '/privacy/'] as const;

for (const route of trustAnchorPages) {
  test(`trust-anchor page ${route} contains at least 500 characters of substantive main content`, async ({ page }) => {
    await page.goto(route);

    const mainText = (await page.locator('main').innerText()).replace(/\s+/g, ' ').trim();
    expect(mainText.length, `${route} rendered <main> text length`).toBeGreaterThanOrEqual(500);
  });
}

test('a missing path returns Shoppa recovery content with HTTP 404', async ({ page, request }) => {
  const missingResponse = await page.goto('/agent-readiness-missing-page/');
  expect(missingResponse?.status()).toBe(404);
  expect(missingResponse?.headers()['content-type']).toMatch(/^text\/html(?:;.*)?$/i);

  await expect(page.locator('h1')).toHaveText('Page not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://shoppa.au/404.html');

  const recoveryLinks = await page.locator('main a[href]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(recoveryLinks).toEqual(expect.arrayContaining(['/', '/sitemap.xml', '/llms.txt']));
  await expect(page.locator('main a[href="/sitemap.xml"]')).toHaveText('sitemap');

  const markdown404 = await (await request.get('/404.md')).text();
  expect(markdown404).toContain('[Sitemap](https://shoppa.au/sitemap.xml)');
});

test('canonical pages publish explicit Markdown siblings with the correct media type', async ({ request }) => {
  // GitHub Pages cannot negotiate one URL by Accept. Explicit sibling files are
  // the verifiable static fallback, so they must be real Markdown responses.
  for (const route of canonicalPages) {
    const response = await request.get(route.markdown);
    expect(response.status(), route.markdown).toBe(200);
    expect(response.headers()['content-type'], route.markdown).toMatch(/^text\/markdown(?:;.*)?$/i);
    expect(await response.text(), route.markdown).toMatch(/^#\s+\S/m);
  }
});

test('canonical HTML pages advertise their explicit Markdown siblings', async ({ page }) => {
  for (const route of canonicalPages) {
    await page.goto(route.html);
    await expect(
      page.locator(`link[rel="alternate"][type="text/markdown"][href="${route.markdown}"]`),
      `${route.html} must advertise ${route.markdown}`,
    ).toHaveCount(1);
  }
});

test('the homepage publishes SoftwareApplication, WebSite, and verified Organization JSON-LD identities', async ({ page }) => {
  await page.goto('/');

  const documents = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(documents.length).toBeGreaterThan(0);

  const entities = documents.flatMap((document) => {
    const value = JSON.parse(document) as Record<string, unknown>;
    const graph = value['@graph'];
    return Array.isArray(graph) ? graph as Record<string, unknown>[] : [value];
  });
  const website = entities.find((entity) => entity['@type'] === 'WebSite');
  const organization = entities.find((entity) => entity['@type'] === 'Organization');
  const software = entities.find((entity) => entity['@type'] === 'SoftwareApplication');

  expect(website).toMatchObject({
    '@id': 'https://shoppa.au/#website',
    name: 'Shoppa',
    url: 'https://shoppa.au/',
  });
  expect(organization).toMatchObject({
    '@id': 'https://shoppa.au/#organization',
    name: 'Shoppa',
    url: 'https://shoppa.au/',
    email: 'hello@shoppa.au',
  });
  expect(organization?.description).toEqual(expect.any(String));
  expect(organization?.logo).toMatch(/^https:\/\/shoppa\.au\//);
  expect(organization?.contactPoint).toMatchObject({
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'hello@shoppa.au',
    areaServed: 'AU',
  });
  expect(organization?.address).toEqual(expect.arrayContaining([
    expect.objectContaining({
      '@type': 'PostalAddress',
      addressLocality: 'Perth',
      addressRegion: 'WA',
      addressCountry: 'AU',
    }),
    expect.objectContaining({
      '@type': 'PostalAddress',
      addressLocality: 'Melbourne',
      addressRegion: 'VIC',
      addressCountry: 'AU',
    }),
  ]));
  expect(software).toMatchObject({
    '@id': 'https://shoppa.au/#software',
    name: 'Shoppa',
    url: 'https://shoppa.au/',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    provider: { '@id': 'https://shoppa.au/#organization' },
  });
});

test('llms.txt explains specifically when an agent should use Shoppa', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^text\/plain(?:;.*)?$/i);

  const document = await response.text();
  expect(document).toMatch(/^## When to use Shoppa$/m);
  expect(document).toMatch(/product discovery/i);
  expect(document).toMatch(/checkout/i);
  expect(document).toMatch(/order support/i);
  expect(document).toMatch(/Australian retailer/i);
});

test('the homepage publishes a usable Open Graph image response', async ({ page, request }) => {
  await page.goto('/');

  const imageURL = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(imageURL).toBe('https://shoppa.au/images/shoppa-ai-shopping-agent-og.png');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /Shoppa/i);

  const imageResponse = await request.get('/images/shoppa-ai-shopping-agent-og.png');
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()['content-type']).toBe('image/png');
  expect((await imageResponse.body()).byteLength).toBeGreaterThan(10_000);
});

test('a substantive privacy page is public and included in site discovery', async ({ page, request }) => {
  const response = await request.get('/privacy/');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^text\/html(?:;.*)?$/i);

  await page.goto('/privacy/');
  await expect(page.locator('h1')).toContainText(/privacy/i);
  expect(await page.locator('main h2').count()).toBeGreaterThanOrEqual(4);
  expect((await page.locator('main').innerText()).length).toBeGreaterThan(800);
  await expect(page.locator('main a[href="mailto:hello@shoppa.au"]')).toHaveCount(1);

  const headingSpacing = await page.locator('.utility-card > h2').evaluateAll((headings) =>
    headings.map((heading) => {
      const previous = heading.previousElementSibling;
      const next = heading.nextElementSibling;
      if (!previous || !next) throw new Error('Privacy headings must sit between content blocks');

      return {
        above: heading.getBoundingClientRect().top - previous.getBoundingClientRect().bottom,
        below: next.getBoundingClientRect().top - heading.getBoundingClientRect().bottom,
      };
    }),
  );
  for (const spacing of headingSpacing) {
    expect(spacing.above).toBeCloseTo(30, 3);
    expect(spacing.below).toBeCloseTo(14, 3);
  }

  await page.goto('/');
  await expect(page.locator('footer a[href="/privacy/"]')).toHaveCount(1);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://shoppa.au/privacy/</loc>');
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('[Privacy](https://shoppa.au/privacy/index.md)');
});
