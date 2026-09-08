// Captures the retained full-page screenshots for the Workers migration gate.
// Usage: node scripts/capture-hosted-screenshots.mjs --base=<origin> --prefix=<label> [--out=<dir>]
//
// The plan's browser-acceptance section keeps one full-page capture per route
// and viewport for staging and again for the apex, so the two hosts can be
// compared by eye after the cutover. `verify-browser-runtime.mjs` proves the
// runtime is clean; this script only produces the pictures.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { browserResolverArguments } from './host-override.mjs';

const argument = (name, fallback) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.split('=', 2)[1] ?? fallback;

const base = argument('base');
const prefix = argument('prefix');
if (!base || !prefix) {
  throw new Error('Usage: node scripts/capture-hosted-screenshots.mjs --base=<origin> --prefix=<label> [--out=<dir>]');
}
const outDir = resolve(
  argument('out', resolve(import.meta.dirname, '../documents/verification/screenshots/workers-migration')),
);
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const ROUTES = [
  ['home', '/'],
  ['about', '/about/'],
  ['process', '/process/'],
  ['contact', '/contact/'],
  ['privacy', '/privacy/'],
  ['thank-you', '/thank-you/'],
  ['not-found', '/__missing-parity-probe/'],
];

// Settles the landing reveals and every looped animation so two captures of the
// same page agree, then waits for each image this origin serves to decode.
async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      animation.currentTime = 0;
      animation.pause();
    }
  });
  await page.waitForTimeout(200);
}

const browser = await chromium.launch({
  args: [
    ...browserResolverArguments(),
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewportName === 'mobile',
    hasTouch: viewportName === 'mobile',
  });

  for (const [routeName, routePath] of ROUTES) {
    const page = await context.newPage();
    await page.goto(base + routePath, { waitUntil: 'load' });
    await settle(page);
    const name = `${prefix}-${routeName}-${viewportName}.png`;
    // A tall full-page capture can fail while the compositor is mid-frame, so
    // it is retried before the capture is treated as an error.
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      try {
        await page.screenshot({ path: resolve(outDir, name), fullPage: true, type: 'png', animations: 'disabled' });
        break;
      } catch (error) {
        if (attempt === 8) throw error;
        await page.waitForTimeout(500);
      }
    }
    process.stdout.write(`captured ${name}\n`);
    await page.close();
  }

  await context.close();
}

await browser.close();
