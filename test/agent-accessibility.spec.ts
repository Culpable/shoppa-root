import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { AGENT_ACCESSIBILITY_RULES } from './agent-accessibility.rules';

const routes = ['/', '/about/', '/process/', '/contact/', '/thank-you/', '/404.html'];

for (const route of routes) {
  test(`${route} has stable, accessible rendered output`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    expect(await page.title()).not.toBe('');
    expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toBe('');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https:\/\/shoppa\.au\//);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const focusStyle = await page.locator('.skip-link').evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusStyle).not.toBe('none');

    expect(AGENT_ACCESSIBILITY_RULES).toHaveLength(33);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    expect(browserErrors).toEqual([]);
  });
}

test('hero highlight paint clears the preceding line', async ({ page }) => {
  for (const width of [1440, 960, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const overlap = await page.locator('.hero h1').evaluate((heading) => {
      const highlight = heading.querySelector('.hero-highlight');
      if (!highlight || !heading.firstChild) return true;
      const previous = document.createRange();
      previous.selectNodeContents(heading.firstChild);
      const previousRects = [...previous.getClientRects()];
      const highlightRects = [...highlight.getClientRects()];
      return highlightRects.some((highlightRect) => {
        const paintedTop = highlightRect.top + highlightRect.height * 0.28;
        return previousRects.some((previousRect) => previousRect.bottom > paintedTop && previousRect.top < highlightRect.bottom && previousRect.right > highlightRect.left && previousRect.left < highlightRect.right);
      });
    });
    expect(overlap, `highlight overlap at ${width}px`).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('representative links expose visible keyboard focus', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  for (const selector of ['.hero .button-primary', '.timeline-card .source-link', '.site-footer nav a']) {
    const link = page.locator(selector).first();
    await link.focus();
    await expect(link).toBeFocused();
    expect(await link.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  }
});

test('header exposes one accurate current-page state', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.header-nav [aria-current="page"]')).toHaveCount(0);

  await page.goto('/about/', { waitUntil: 'networkidle' });
  await expect(page.locator('.header-nav [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.header-nav a[href="/about/"]')).toHaveAttribute('aria-current', 'page');
});

test('all routes reflow at the 200% desktop zoom equivalent', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(640);
  }
});

test('approved colour pairs meet their contrast targets', async () => {
  const luminance = (hex: string) => {
    const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const ratio = (a: string, b: string) => {
    const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (bright + 0.05) / (dark + 0.05);
  };
  expect(ratio('#3B2416', '#FFF4E9')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#6B4A31', '#FFF4E9')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#FFFFFF', '#B8441F')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#FFF2E2', '#3A2414')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#AE3E1B', '#FDE0D4')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#6B4A31', '#FFFBF5')).toBeGreaterThanOrEqual(4.5);
});
