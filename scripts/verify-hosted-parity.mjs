// Confirms a hosted origin serves exactly the documents in `dist`, with the
// expected header policy and no leaked host names.
// Usage: node scripts/verify-hosted-parity.mjs <origin> [--noindex]
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './host-override.mjs';

const origin = (process.argv[2] ?? '').replace(/\/$/, '');
if (!origin) throw new Error('Usage: node scripts/verify-hosted-parity.mjs <origin> [--noindex]');
const expectNoindex = process.argv.includes('--noindex');

const distDirectory = resolve(import.meta.dirname, '../dist');
const DOCUMENTS = [
  ['/', 'index.html'],
  ['/about/', 'about/index.html'],
  ['/process/', 'process/index.html'],
  ['/contact/', 'contact/index.html'],
  ['/privacy/', 'privacy/index.html'],
  ['/thank-you/', 'thank-you/index.html'],
];
const DISCOVERY = [
  ['/robots.txt', 'robots.txt'],
  ['/sitemap.xml', 'sitemap.xml'],
  ['/llms.txt', 'llms.txt'],
];
const REQUIRED_HEADERS = {
  'content-security-policy': "default-src 'self'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=()',
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const failures = [];

async function get(path, headers = {}) {
  const response = await fetch(origin + path, { headers, redirect: 'manual' });
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

for (const [route, file] of [...DOCUMENTS, ...DISCOVERY]) {
  const { response, body } = await get(route);
  const expected = readFileSync(resolve(distDirectory, file));
  if (response.status !== 200) failures.push(`${route}: status ${response.status}`);
  if (sha256(body) !== sha256(expected)) failures.push(`${route}: body differs from dist/${file}`);

  const browserLike = await get(route, {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  });
  if (sha256(browserLike.body) !== sha256(expected)) {
    failures.push(`${route}: body differs from dist/${file} when requested with a browser Accept header`);
  }
  if (response.headers.get('vary')?.includes('Accept') !== true && DOCUMENTS.some(([documentRoute]) => documentRoute === route)) {
    failures.push(`${route}: missing Vary: Accept`);
  }
  for (const [header, needle] of Object.entries(REQUIRED_HEADERS)) {
    if (!(response.headers.get(header) ?? '').includes(needle)) failures.push(`${route}: ${header} missing ${needle}`);
  }
  const robotsTag = response.headers.get('x-robots-tag') ?? '';
  if (expectNoindex && !robotsTag.includes('noindex')) failures.push(`${route}: expected X-Robots-Tag: noindex`);
  if (!expectNoindex && robotsTag.includes('noindex')) failures.push(`${route}: unexpected X-Robots-Tag: noindex`);
  const text = body.toString('utf8');
  for (const forbidden of ['staging.shoppa.au', 'workers.dev']) {
    if (text.includes(forbidden)) failures.push(`${route}: body names ${forbidden}`);
  }
}

{
  const { response, body } = await get('/__hosted-parity-probe/');
  if (response.status !== 404) failures.push(`unknown path: status ${response.status}`);
  if (sha256(body) !== sha256(readFileSync(resolve(distDirectory, '404.html')))) {
    failures.push('unknown path: body is not the built 404 document');
  }

  const html = readFileSync(resolve(distDirectory, 'index.html'), 'utf8');
  const assetName = html.match(/\/_astro\/[^"']+\.js/)?.[0] ?? html.match(/\/_astro\/[^"']+\.css/)?.[0];
  if (!assetName) failures.push('no fingerprinted asset found in dist/index.html');
  else {
    const { response: asset } = await get(assetName);
    const cacheControl = asset.headers.get('cache-control') ?? '';
    if (!cacheControl.includes('immutable') || !cacheControl.includes('max-age=31536000')) {
      failures.push(`${assetName}: cache-control is "${cacheControl}"`);
    }
  }

  for (const path of ['/llms.txt', '/robots.txt']) {
    const { response: plain } = await get(path);
    if (!(plain.headers.get('content-type') ?? '').includes('text/plain; charset=utf-8')) {
      failures.push(`${path}: content-type is "${plain.headers.get('content-type')}"`);
    }
  }

  const { response: home } = await get('/');
  const cacheControl = home.headers.get('cache-control') ?? '';
  if (!cacheControl.includes('max-age=0') || !cacheControl.includes('must-revalidate')) {
    failures.push(`HTML cache-control is "${cacheControl}"; plan D-14 applies if max-age is higher`);
  }
}

if (failures.length > 0) {
  process.stdout.write(`FAIL hosted parity on ${origin}\n${failures.map((failure) => `  - ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS hosted parity on ${origin}: bodies match dist, headers complete, no host leakage\n`);
