import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { AGENT_ACCESSIBILITY_RULES } from './agent-accessibility.rules';

const routes = ['/', '/about/', '/process/', '/contact/', '/thank-you/', '/404.html'];

// The hero and flow-stack reveals fade opacity for up to 940ms after load, so a
// colour read straight after networkidle samples a half-faded element and
// reports a contrast the reader never sees. Every animation here is finite.
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))));

for (const route of routes) {
  test(`${route} has stable, accessible rendered output`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    await settle(page);
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
  expect(ratio('#AE3E1B', '#FEE1D5')).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#6B4A31', '#FFFBF5')).toBeGreaterThanOrEqual(4.5);
});

// axe-core cannot judge text painted over a gradient: it reports those nodes as
// "incomplete" rather than as violations, and the assertion above only reads
// results.violations. On this site that silently excused 48 nodes, including
// every word in the demo panel, so contrast is measured here from the rendered
// page instead. Each element is composited through its own ancestor chain, once
// per gradient colour stop, so the worst point of a gradient is the one scored.
test('every rendered text element meets its contrast target on its own backdrop', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await settle(page);
    const measured = await page.evaluate(() => {
      const COLOUR = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-fA-F]{3,8}/g;
      const stops = (value: string) => (value === 'none' ? [] : value.match(COLOUR) ?? []);

      // Painting the stack is how the browser itself resolves alpha, so the
      // measured pixel is the one a reader actually sees.
      const paint = (layers: string[]) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d')!;
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        for (const layer of layers) {
          context.fillStyle = layer;
          context.fillRect(0, 0, 1, 1);
        }
        const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
        return [red, green, blue] as [number, number, number];
      };

      const luminance = ([red, green, blue]: [number, number, number]) => {
        const [r, g, b] = [red, green, blue].map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return r * 0.2126 + g * 0.7152 + b * 0.0722;
      };
      const ratio = (a: [number, number, number], b: [number, number, number]) => {
        const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (bright + 0.05) / (dark + 0.05);
      };

      // Every ancestor contributes its background colour; a gradient ancestor
      // branches the stack so each of its colour stops is scored separately.
      const backdrops = (element: Element) => {
        const chain: Element[] = [];
        for (let node: Element | null = element; node; node = node.parentElement) chain.unshift(node);
        let branches: string[][] = [[]];
        for (const node of chain) {
          const style = getComputedStyle(node);
          const fill = style.backgroundColor === 'rgba(0, 0, 0, 0)' ? [] : [style.backgroundColor];
          const gradient = stops(style.backgroundImage);
          branches = branches.flatMap((branch) => {
            const base = [...branch, ...fill];
            return gradient.length ? gradient.map((stop) => [...base, stop]) : [base];
          });
        }
        return branches;
      };

      return [...document.querySelectorAll('body *')]
        .filter((element) => ![...element.childNodes].every((node) => node.nodeType !== Node.TEXT_NODE || !(node.textContent ?? '').trim()))
        .filter((element) => !element.closest('[aria-hidden="true"]') && element.getClientRects().length > 0)
        .filter((element) => getComputedStyle(element).visibility !== 'hidden')
        .map((element) => {
          const style = getComputedStyle(element);
          const size = Number.parseFloat(style.fontSize);
          const weight = Number(style.fontWeight) || 400;
          // WCAG large text: 18pt, or 14pt when bold.
          const large = size >= 24 || (size >= 18.66 && weight >= 700);
          const worst = backdrops(element).reduce<{ ratio: number; backdrop: string } | null>((lowest, stack) => {
            const background = paint(stack);
            const current = { ratio: ratio(paint([...stack, style.color]), background), backdrop: stack[stack.length - 1] ?? 'white' };
            return lowest && lowest.ratio <= current.ratio ? lowest : current;
          }, null)!;
          return {
            label: `${element.tagName.toLowerCase()}.${element.className || '(none)'} "${(element.textContent ?? '').trim().slice(0, 30)}"`,
            colour: style.color,
            backdrop: worst.backdrop,
            ratio: worst.ratio,
            required: large ? 3 : 4.5,
          };
        });
    });

    expect(measured.length, `no text measured on ${route}`).toBeGreaterThan(20);
    for (const item of measured) {
      expect(
        item.ratio,
        `${route} ${item.label}: ${item.colour} on ${item.backdrop} is ${item.ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(item.required);
    }
  }
});

test('every description detail clears the user-agent indent so it lines up with its term', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const indented = await page.evaluate(() => [...document.querySelectorAll('dd')]
      .map((detail) => ({ text: (detail.textContent ?? '').trim().slice(0, 40), margin: getComputedStyle(detail).marginInlineStart }))
      .filter((detail) => detail.margin !== '0px'));
    expect(indented, `unreset user-agent dd indent on ${route}`).toEqual([]);
  }
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

// An animated `filter: blur()` held by `animation-fill-mode: both` left the
// first hero flow card permanently blurred on iOS Safari (user-reported,
// 2026-08-21): the forwards fill keeps the element on its own compositing layer
// with the animation's filter owned by the compositor, so a final commit
// dropped while the page scrolls is never repainted, and no later style change
// clears it. A rendered screenshot cannot catch that here - every capture path
// forces the repaint the device skipped - so the guard is structural: no page
// animation may animate `filter`, and none may keep its animated style after it
// ends. Both halves must hold, or the stranding is possible again.
test('no page animation can strand an element in its start frame', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const animations = await page.evaluate(() => [...document.getAnimations()].map((animation) => {
    const effect = animation.effect as KeyframeEffect;
    const target = effect.target as Element;
    return {
      target: `${target.tagName.toLowerCase()}.${target.className || '(no class)'}`,
      fill: effect.getTiming().fill,
      properties: [...new Set(effect.getKeyframes().flatMap((frame) => Object.keys(frame)))],
    };
  }));

  expect(animations.length).toBeGreaterThan(0);
  for (const animation of animations) {
    expect(animation.properties, `${animation.target} animates a filter`).not.toContain('filter');
    expect(['none', 'backwards'], `${animation.target} fills ${animation.fill}`).toContain(animation.fill);
  }

  // The stack ends where its base style already sits, so the backwards fill
  // costs nothing visually: everything is sharp, opaque and in place.
  await settle(page);
  const settled = await page.evaluate(() => [...document.querySelectorAll('.hero-copy > *, .flow-stack > *')]
    .map((element) => {
      const style = getComputedStyle(element);
      return { filter: style.filter, opacity: style.opacity, transform: style.transform };
    }));
  expect(settled.length).toBeGreaterThan(0);
  for (const element of settled) {
    expect(element.filter).toBe('none');
    expect(element.opacity).toBe('1');
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(element.transform);
  }
});
