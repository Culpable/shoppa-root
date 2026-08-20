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

test('hero highlight paints over its own glyphs and clears the preceding line', async ({ page }) => {
  for (const width of [1440, 960, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const bands = await page.locator('.hero h1').evaluate((heading) => {
      const highlight = heading.querySelector('.hero-highlight');
      if (!highlight || !heading.firstChild) return null;
      const styles = getComputedStyle(highlight);
      // The computed background box is the painted band; measuring it avoids re-deriving the em values from the stylesheet.
      const bandHeight = parseFloat(styles.backgroundSize.split(' ')[1]);
      const bandOffset = parseFloat(styles.backgroundPositionY);
      const context = document.createElement('canvas').getContext('2d');
      if (!context) return null;
      context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      const highlightText = context.measureText(highlight.textContent ?? '');
      const previousText = context.measureText(heading.firstChild.textContent ?? '');
      const previous = document.createRange();
      previous.selectNodeContents(heading.firstChild);
      // Ink bounds come from the baseline, which sits one font ascent below the top of each inline text box.
      const previousInkBottoms = [...previous.getClientRects()].map((rect) => ({
        bottom: rect.top + highlightText.fontBoundingBoxAscent + previousText.actualBoundingBoxDescent,
        left: rect.left,
        right: rect.right,
      }));
      return [...highlight.getClientRects()].map((rect) => {
        const baseline = rect.top + highlightText.fontBoundingBoxAscent;
        return {
          bandTop: bandOffset + rect.top,
          bandBottom: bandOffset + rect.top + bandHeight,
          inkTop: baseline - highlightText.actualBoundingBoxAscent,
          inkBottom: baseline + highlightText.actualBoundingBoxDescent,
          previousInkBottom: Math.max(
            ...previousInkBottoms
              .filter((previousInk) => previousInk.right > rect.left && previousInk.left < rect.right && previousInk.bottom < rect.bottom)
              .map((previousInk) => previousInk.bottom),
            Number.NEGATIVE_INFINITY,
          ),
        };
      });
    });
    expect(bands, `highlight bands at ${width}px`).not.toBeNull();
    for (const band of bands ?? []) {
      expect(band.bandTop, `highlight covers ascenders at ${width}px`).toBeLessThanOrEqual(band.inkTop);
      expect(band.bandBottom, `highlight covers descenders at ${width}px`).toBeGreaterThanOrEqual(band.inkBottom);
      expect(band.previousInkBottom, `highlight clears the previous line at ${width}px`).toBeLessThanOrEqual(band.bandTop);
    }
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

test('the paid badge centres in both chat surfaces', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  // The conversation list, not the padded panel, is the conversation's chat
  // width, so both surfaces are measured against the box their messages sit in.
  const badges = await page.evaluate(() => ['.mini-chat', '.conversation-list'].map((selector) => {
    const chat = document.querySelector(selector);
    const badge = chat?.querySelector('.paid-badge');
    const centre = (element: Element) => { const box = element.getBoundingClientRect(); return (box.left + box.right) / 2; };
    return { selector, offset: chat && badge ? centre(badge) - centre(chat) : null };
  }));
  for (const badge of badges) {
    expect(Math.abs(badge.offset ?? Infinity), `paid badge is off-centre in ${badge.selector}`).toBeLessThanOrEqual(1);
  }
});

test('every CTA snippet pill centres its type between the pill edges', async ({ page }) => {
  // The cloud is desktop-only, so pin the width rather than inherit the project viewport.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const pills = await page.evaluate(() => [...document.querySelectorAll('.snippet-cloud span')]
    .filter((pill) => getComputedStyle(pill).display !== 'none')
    .map((pill) => {
      const style = getComputedStyle(pill);
      const text = pill.textContent ?? '';
      const context = document.createElement('canvas').getContext('2d')!;
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = context.measureText(text);

      // Two pills are tilted, so their bounding box is not their border box.
      // Everything here is measured down from the border box's own top edge,
      // which the transform cannot disturb.
      const px = (value: string) => Number.parseFloat(value);
      const lineBox = px(style.lineHeight);
      const top = px(style.borderTopWidth) + px(style.paddingTop);
      const height = top + lineBox + px(style.paddingBottom) + px(style.borderBottomWidth);

      // The line box is centred in the content box and the font's own ascent and
      // descent are centred in the line box, so the baseline is one half-leading
      // plus one ascent below the content edge.
      const fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      const baseline = top + (lineBox - fontHeight) / 2 + metrics.fontBoundingBoxAscent;

      // Descenders always hang below, so the band the eye levels on runs from the
      // tallest ink down to the baseline.
      const inkCentre = baseline - metrics.actualBoundingBoxAscent / 2;
      return { text, lines: pill.getClientRects().length, offset: inkCentre - height / 2 };
    }));

  expect(pills.length).toBeGreaterThan(0);
  for (const pill of pills) {
    // One line, or the single-line baseline maths above would not describe it.
    expect(pill.lines, `"${pill.text}" wrapped`).toBe(1);
    // Courier Prime carries more ascent than descent, so a symmetric pill floats
    // its type high. 1px covers the cap-height strings riding a shade above the
    // ascender strings, and nothing else: the symmetric pill it replaced
    // missed by 1.33px on every mixed-case snippet.
    expect(Math.abs(pill.offset), `"${pill.text}" sits ${pill.offset.toFixed(2)}px off centre`).toBeLessThanOrEqual(1);
  }
});
