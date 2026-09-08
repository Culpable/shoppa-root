// Loads every route in a real browser and reports console errors, page errors,
// CSP violations, failed first-party requests and horizontal overflow.
// Usage: node scripts/verify-browser-runtime.mjs [baseUrl]
import { chromium } from '@playwright/test';
import { browserResolverArguments } from './host-override.mjs';

const base = process.argv[2] ?? 'http://127.0.0.1:8787';
const ROUTES = ['/', '/about/', '/process/', '/contact/', '/privacy/', '/thank-you/', '/__missing/'];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

const browser = await chromium.launch({
  args: [
    ...browserResolverArguments(),
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

let failures = 0;
for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({
    viewport,
    isMobile: viewportName === 'mobile',
    hasTouch: viewportName === 'mobile',
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const problems = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (route === '/__missing/' && message.text().includes('404')) return;
      problems.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.startsWith(base)) problems.push(`request failed: ${url} ${request.failure()?.errorText}`);
    });
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.__cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });

    await page.goto(base + route, { waitUntil: 'load' });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let top = 0; top < height; top += 600) {
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1200);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) problems.push(`horizontal overflow: ${overflow}px`);
    const violations = await page.evaluate(() => window.__cspViolations ?? []);
    for (const violation of violations) problems.push(`csp: ${violation}`);

    const label = `${route} @ ${viewportName}`;
    if (problems.length === 0) {
      process.stdout.write(`PASS ${label}\n`);
    } else {
      failures += 1;
      process.stdout.write(`FAIL ${label}\n${problems.map((problem) => `  - ${problem}`).join('\n')}\n`);
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
process.exit(failures === 0 ? 0 : 1);
